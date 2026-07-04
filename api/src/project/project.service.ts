import crypto from 'node:crypto';
import fs from 'node:fs';
import { Document } from '@langchain/core/documents';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { ClientSession, Connection, Model, type PaginateModel } from 'mongoose';
import { CloudinaryService } from 'nestjs-cloudinary';
import { firstValueFrom } from 'rxjs';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { RagStrategy } from 'src/rag/enums/rag-strategy.enum';
import {
  INGESTION_SERVICE,
  type IngestionService,
} from 'src/rag/interfaces/ingestion.interface';
import {
  RETRIEVAL_SERVICE,
  type RetrievalService,
  type RetrievedContext,
} from 'src/rag/interfaces/retrieval.interface';
import { mapToDto } from 'src/utils/dto-mapper.util';

import { CreateProjectDto } from './dto/create-project.dto';
import { InsertProjectDto } from './dto/insert-project.dto';
import { ProjectListResponseDto } from './dto/project-list-response.dto';
import { ProjectDto } from './dto/project.dto';
import { ProjectFileEmbedding } from './entities/project-file-embedding.entity';
import { Project } from './entities/project.entity';
import { ProjectFileType } from './enums/project-file-type.enum';
import { ProjectStatus } from './enums/project-status.enum';

@Injectable()
export class ProjectService {
  private readonly tempDir = './.public';

  constructor(
    @InjectConnection()
    private readonly connection: Connection,

    @InjectModel(Project.name)
    private readonly projectRepository: PaginateModel<Project>,
    @InjectModel(ProjectFileEmbedding.name)
    private readonly projectFileEmbeddingRepository: Model<ProjectFileEmbedding>,

    private readonly cloudinaryService: CloudinaryService,

    @Inject(INGESTION_SERVICE)
    private readonly ingestionService: IngestionService,

    @Inject(RETRIEVAL_SERVICE)
    private readonly retrievalService: RetrievalService,

    private readonly httpService: HttpService,
  ) {}

  public async create(
    userId: string,
    createProjectDto: CreateProjectDto,
  ): Promise<ProjectDto> {
    const session = await this.connection.startSession();

    try {
      const { name, description, file, ragStrategy, reRankingModel } =
        createProjectDto;

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
        settings: {
          ...(ragStrategy && { ragStrategy }),
          ...(reRankingModel && { reRankingModel }),
          embeddingModel: this.ingestionService.embeddingModelName,
        },
      });

      return createdProject;
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();

      if (fs.existsSync(createProjectDto.file.path))
        await fs.promises.unlink(createProjectDto.file.path);

      throw error;
    } finally {
      await session.endSession();
      if (fs.existsSync(createProjectDto.file.path))
        await fs.promises.unlink(createProjectDto.file.path);
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

  public async getProjectById(
    projectId: string,
    userId: string,
  ): Promise<ProjectDto> {
    const project = await this.projectRepository.findOne({
      _id: projectId,
      userId,
    });

    if (!project)
      throw new UnauthorizedException('Project not found or unauthorized');

    return mapToDto(ProjectDto, project);
  }

  public async getAllProjects(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<ProjectListResponseDto> {
    const result = await this.projectRepository.paginate(
      { userId },
      {
        page: paginationDto.page,
        limit: paginationDto.limit,
        sort: { createdAt: -1 },
      },
    );

    return {
      ...result,
      page: result.page ?? paginationDto.page,
      prevPage: result.prevPage ?? null,
      nextPage: result.nextPage ?? null,
      docs: result.docs.map((doc) => mapToDto(ProjectDto, doc)),
    };
  }

  public async processProjectFile(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const project = await this.projectRepository.findOne({
      _id: projectId,
      userId,
    });

    if (!project)
      throw new UnauthorizedException('Project not found or unauthorized');

    const tempFilePath = await this.downloadFileToTemp(project.fileUrl);

    try {
      await this.projectRepository.findByIdAndUpdate(projectId, {
        $set: {
          'settings.outputDimensionality':
            this.ingestionService.outputDimensionality,
        },
      });

      const documents =
        await this.ingestionService.processDocuments(tempFilePath);

      const session = await this.connection.startSession();
      session.startTransaction();

      try {
        const embeddingsToInsert = this.mapDocumentsToEmbeddings(
          project,
          documents,
        );
        await this.batchInsertEmbeddings(embeddingsToInsert, session, 50);

        project.status = ProjectStatus.COMPLETED;
        await project.save({ session });

        await session.commitTransaction();
      } catch (dbError) {
        if (session.inTransaction()) await session.abortTransaction();
        throw dbError;
      } finally {
        await session.endSession();
      }
    } finally {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    }
  }

  private async downloadFileToTemp(fileUrl: string): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.get(fileUrl, { responseType: 'arraybuffer' }),
    );

    if (!fs.existsSync(this.tempDir))
      fs.mkdirSync(this.tempDir, { recursive: true });

    const tempFilePath = `${this.tempDir}/project-file-${crypto.randomUUID()}.pdf`;
    fs.writeFileSync(tempFilePath, Buffer.from(response.data));

    return tempFilePath;
  }

  private mapDocumentsToEmbeddings(project: Project, documents: Document[]) {
    return documents.map((doc) => ({
      projectId: project._id,
      embedding: doc.metadata.embedding,
      content: doc.pageContent,
      metadata: {
        text: doc.metadata.text,
        images: doc.metadata.images || [],
        tables: doc.metadata.tables || [],
      },
    }));
  }

  private async batchInsertEmbeddings(
    embeddingsToInsert: Partial<ProjectFileEmbedding>[],
    session: ClientSession,
    batchSize: number,
  ) {
    for (let i = 0; i < embeddingsToInsert.length; i += batchSize) {
      const batch = embeddingsToInsert.slice(i, i + batchSize);
      await this.projectFileEmbeddingRepository.insertMany(batch, { session });
    }
  }

  private async insert(
    insertProjectDto: InsertProjectDto,
  ): Promise<ProjectDto> {
    const insertedProject =
      await this.projectRepository.create(insertProjectDto);

    return mapToDto(ProjectDto, insertedProject);
  }

  public async retrieveProjectContext(
    projectId: string,
    userId: string,
    query: string,
    limit = 5,
  ): Promise<RetrievedContext[]> {
    const project = await this.projectRepository.findOne({
      _id: projectId,
      userId,
    });

    if (!project)
      throw new UnauthorizedException('Project not found or unauthorized');

    return this.retrievalService.retrieveContext(
      this.projectFileEmbeddingRepository,
      projectId,
      query,
      project.settings?.ragStrategy || RagStrategy.BASIC,
      limit,
    );
  }

  public async answerProjectQuestion(
    projectId: string,
    userId: string,
    query: string,
    limit = 5,
  ): Promise<{ answer: string; contexts: RetrievedContext[] }> {
    const contexts = await this.retrieveProjectContext(
      projectId,
      userId,
      query,
      limit,
    );

    const answer = await this.retrievalService.answerFromContext(
      query,
      contexts,
    );

    return { answer, contexts };
  }
}
