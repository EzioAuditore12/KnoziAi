import { Exclude, Expose, Transform, Type } from 'class-transformer';

import { Project } from '../entities/project.entity';
import { ProjectFileType } from '../enums/project-file-type.enum';
import { ProjectStatus } from '../enums/project-status.enum';
import { ProjectSettingsDto } from './project-settings.dto';

@Exclude()
export class ProjectDto implements Omit<Partial<Project>, 'settings'> {
  @Expose({ name: 'id' })
  @Transform(
    ({ obj }: { obj: Project & { id: string } }) =>
      obj._id ?? obj.id?.toString(),
    {
      toClassOnly: true,
    },
  )
  id: string;

  @Expose()
  name: string;

  @Expose()
  userId: string;

  @Expose()
  description?: string | null;

  @Expose()
  fileUrl: string;

  @Expose()
  fileType: ProjectFileType;

  @Expose()
  status: ProjectStatus;

  @Expose()
  @Type(() => ProjectSettingsDto)
  settings: ProjectSettingsDto;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
