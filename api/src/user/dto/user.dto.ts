import { Exclude, Expose, Transform } from 'class-transformer';

import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';

@Exclude()
export class UserDto implements Partial<User> {
  @Expose({ name: 'id' })
  @Transform(
    ({ obj }: { obj: User & { id: string } }) => obj._id ?? obj.id?.toString(),
    {
      toClassOnly: true,
    },
  )
  id: string;

  @Expose()
  name: string;

  @Expose()
  email: string;

  @Expose()
  image: string | null;

  @Expose()
  emailVerified: boolean;

  @Expose()
  role: UserRole;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
