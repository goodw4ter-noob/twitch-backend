import { ConflictException, Injectable } from '@nestjs/common';
import { hash } from 'argon2';

import { PrismaService } from '@/src/core/prisma/prisma.service';

import { CreateUserInput } from './inputs/create-user.input';
import { ShortUserModel, UserModel } from './models/user.model';

@Injectable()
export class AccountService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async me(userId: string): Promise<UserModel | null> {
		const user = await this.prismaService.user.findUnique({
			where: { id: userId },
		});

		return user;
	}

	public async create(dto: CreateUserInput): Promise<ShortUserModel> {
		const { email, password, username } = dto;

		const isUsernameExists = await this.prismaService.user.findUnique({
			where: { username },
		});

		if (isUsernameExists) {
			throw new ConflictException('Username already exists');
		}

		const isEmailExists = await this.prismaService.user.findUnique({
			where: { email },
		});

		if (isEmailExists) {
			throw new ConflictException('Email already exists');
		}

		const user = await this.prismaService.user.create({
			data: {
				email,
				password: await hash(password),
				username,
				displayName: username,
			},
		});

		return { id: user.id, username: user.username };
	}
}
