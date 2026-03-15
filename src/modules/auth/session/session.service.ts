import {
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'argon2';
import { Request } from 'express';

import { PrismaService } from '@/src/core/prisma/prisma.service';

import { LoginInput } from './inputs/login.input';

@Injectable()
export class SessionService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService,
	) {}

	public async login(req: Request, dto: LoginInput) {
		const { login, password } = dto;

		const user = await this.prismaService.user.findFirst({
			where: {
				OR: [
					{ email: { equals: login } },
					{ username: { equals: login } },
				],
			},
		});

		if (!user) {
			throw new UnauthorizedException('Invalid login or password');
		}

		const isValidPassword = await verify(user.password, password);

		if (!isValidPassword) {
			throw new UnauthorizedException('Invalid login or password');
		}

		return new Promise((resolve, reject) => {
			req.session.userId = user.id;
			req.session.createdAt = new Date();

			req.session.save((err) => {
				if (err) {
					return reject(
						new InternalServerErrorException(
							'Failed to save session',
						),
					);
				}

				resolve(user);
			});
		});
	}

	public async logout(req: Request) {
		return new Promise((resolve, reject) => {
			req.session.destroy((err) => {
				if (err) {
					return reject(
						new InternalServerErrorException(
							'Failed to destroy session',
						),
					);
				}

				req.res?.clearCookie(
					this.configService.getOrThrow<string>('SESSION_NAME'),
				);

				resolve(true);
			});
		});
	}
}
