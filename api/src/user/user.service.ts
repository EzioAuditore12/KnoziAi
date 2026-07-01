import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { mapToDto } from 'src/utils/dto-mapper.util';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userRepository: Model<UserDocument>,
  ) {}

  public async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const createdUser = await this.userRepository.create(createUserDto);
    return mapToDto(UserDto, createdUser);
  }

  public findAll() {
    return `This action returns all user`;
  }

  public async findOne(id: string): Promise<UserDto | null> {
    const user = await this.userRepository.findById(id).exec();
    return user ? mapToDto(UserDto, user) : null;
  }

  public async findByEmail(email: string): Promise<UserDto | null> {
    const user = await this.userRepository.findOne({ email }).exec();
    return user ? mapToDto(UserDto, user) : null;
  }

  public async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDto | null> {
    const updatedUser = await this.userRepository
      .findByIdAndUpdate(id, updateUserDto, { returnDocument: 'after' })
      .exec();
    return updatedUser ? mapToDto(UserDto, updatedUser) : null;
  }

  public async remove(id: string): Promise<UserDto | null> {
    const deletedUser = await this.userRepository.findByIdAndDelete(id).exec();
    return deletedUser ? mapToDto(UserDto, deletedUser) : null;
  }
}
