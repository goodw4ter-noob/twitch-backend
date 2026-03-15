import { ConflictException, Injectable } from '@nestjs/common';
import { hash } from 'argon2';

import { PrismaService } from '@/src/core/prisma/prisma.service';

import { CreateUserInput } from './inputs/create-user.input';

@Injectable()
export class AccountService {
	public constructor(private readonly prismaService: PrismaService) {}

	public async findAll() {
		const users = await this.prismaService.user.findMany();

		return users;
	}

	public async create(dto: CreateUserInput) {
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

		return user;
	}
}
