import fs from 'node:fs';
import crypto from 'node:crypto';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { firstValueFrom } from 'rxjs';
import { Connection, Model } from 'mongoose';
import { CloudinaryService } from 'nestjs-cloudinary';
import {
  INGESTION_SERVICE,
  type IngestionService,
} from 'src/rag/interfaces/ingestion.interface';
import { mapToDto } from 'src/utils/dto-mapper.util';

import { CreateProjectDto } from './dto/create-project.dto';
import { InsertProjectDto } from './dto/insert-project.dto';
import { ProjectDto } from './dto/project.dto';
import { ProjectFileEmbedding } from './entities/project-file-embedding.entity';
import { Project } from './entities/project.entity';
import { ProjectFileType } from './enums/project-file-type.enum';
import { ProjectStatus } from './enums/project-status.enum';

@Injectable()
export class ProjectService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,

    @InjectModel(Project.name)
    private readonly projectRepository: Model<Project>,
    @InjectModel(ProjectFileEmbedding.name)
    private readonly projectFileEmbeddingRepository: Model<ProjectFileEmbedding>,

    private readonly cloudinaryService: CloudinaryService,

    @Inject(INGESTION_SERVICE)
    private readonly ingestionService: IngestionService,

    private readonly httpService: HttpService,
  ) {}

  public async create(
    userId: string,
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectDto> {
    const session = await this.connection.startSession();

    try {
      const { name, description, file } = createProjectDto;

      const uploadedFile =
        await this.cloudinaryService.cloudinaryInstance.uploader.upload(
          file.path,
        );

      const createdProject = await this.insert({
        userId,
        name,
        description,
        fileUrl: uploadedFile.url,
        fileType: ProjectFileType.PDF, // For now only pdf
      });

      return createdProject;
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();

      if (fs.existsSync(createProjectDto.file.path)) {
        await fs.promises.unlink(createProjectDto.file.path);
      }

      throw error;
    } finally {
      await session.endSession();
      if (fs.existsSync(createProjectDto.file.path)) {
        await fs.promises.unlink(createProjectDto.file.path);
      }
    }
  }

  public async isExistingProjectAndUser(
    projectId: string,
    userId: string,
  ): Promise<boolean> {
    const exists = await this.projectRepository.exists({
      _id: projectId,
      userId,
    });
    return exists !== null;
  }

  public async processProjectFile(projectId: string, userId: string): Promise<void> {
    const project = await this.projectRepository.findOne({ _id: projectId, userId });

    if (!project) {
      throw new UnauthorizedException('Project not found or unauthorized');
    }

    const fileUrl = project.fileUrl;

    // Download the PDF from Cloudinary
    const response = await firstValueFrom(
      this.httpService.get(fileUrl, { responseType: 'arraybuffer' })
    );

    const tempDir = './.public';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempFilePath = `${tempDir}/project-file-${crypto.randomUUID()}.pdf`;
    fs.writeFileSync(tempFilePath, Buffer.from(response.data));

    try {
      const documents = await this.ingestionService.processDocuments(tempFilePath);

      const session = await this.connection.startSession();
      session.startTransaction();

      try {
        const embeddingsToInsert = documents.map(doc => ({
          projectId: project._id,
          embedding: doc.metadata.embedding,
          content: doc.pageContent,
          metadata: {
            text: doc.metadata.text,
            images: doc.metadata.images || [],
            tables: doc.metadata.tables || [],
          },
        }));

        await this.projectFileEmbeddingRepository.insertMany(embeddingsToInsert, { session });

        project.status = ProjectStatus.COMPLETED;
        await project.save({ session });

        await session.commitTransaction();
      } catch (dbError) {
        if (session.inTransaction()) {
          await session.abortTransaction();
        }
        throw dbError;
      } finally {
        await session.endSession();
      }
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  private async insert(
    insertProjectDto: InsertProjectDto,
  ): Promise<ProjectDto> {
    const insertedProject =
      await this.projectRepository.create(insertProjectDto);

    return mapToDto(ProjectDto, insertedProject);
  }
}
