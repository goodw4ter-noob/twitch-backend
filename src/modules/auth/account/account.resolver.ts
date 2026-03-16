import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { Authorization } from '@/src/shared/decorators/auth.decorator';
import { Authorized } from '@/src/shared/decorators/authorized.decorator';

import { AccountService } from './account.service';
import { CreateUserInput } from './inputs/create-user.input';
import { ShortUserModel, UserModel } from './models/user.model';

@Resolver('Account')
export class AccountResolver {
	constructor(private readonly accountService: AccountService) {}

	@Authorization()
	@Query(() => UserModel, { name: 'findProfile', nullable: true })
	public async me(@Authorized('id') id: string) {
		return this.accountService.me(id);
	}

	@Mutation(() => ShortUserModel, { name: 'createUser' })
	public async create(@Args('data') dto: CreateUserInput) {
		return this.accountService.create(dto);
	}
}
