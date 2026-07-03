import { unlink } from 'node:fs/promises';
import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CloudinaryService } from 'nestjs-cloudinary';
import { mapToDto } from 'src/utils/dto-mapper.util';

import { CreateProjectDto } from './dto/create-project.dto';
import { InsertProjectDto } from './dto/insert-project.dto';
import { ProjectDto } from './dto/project.dto';
import { Project } from './entities/project.entity';
import { ProjectFileType } from './enums/project-file-type.enum';

@Injectable()
export class ProjectService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,

    @InjectModel(Project.name)
    private readonly projectRepository: Model<Project>,

    private readonly cloudinaryService: CloudinaryService,
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

      await unlink(createProjectDto.file.path);

      throw error;
    } finally {
      await session.endSession();
      await unlink(createProjectDto.file.path);
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
