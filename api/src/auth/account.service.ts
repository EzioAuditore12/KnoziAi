import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateAccountDto } from './dto/create-account.dto';
import { Account, AccountDocument } from './entities/account.entity';
import { AuthProviderEnum } from './enums/auth-provider.enum';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Account.name)
    private readonly accountRepository: Model<AccountDocument>,
  ) {}

  public async create(createAccountDto: CreateAccountDto): Promise<Account> {
    return await this.accountRepository.create(createAccountDto);
  }

  public async findByProviderAccountId(
    provider: AuthProviderEnum,
    providerAccountId: string,
  ): Promise<Account | null> {
    return this.accountRepository
      .findOne({ provider, providerAccountId })
      .exec();
  }
}
