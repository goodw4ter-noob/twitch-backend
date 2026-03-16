import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'argon2';
import { Request } from 'express';

import { PrismaService } from '@/src/core/prisma/prisma.service';
import { RedisService } from '@/src/core/redis/redis.service';
import { getSessionMetadata } from '@/src/shared/utils/session-metadata.util';

import { LoginInput } from './inputs/login.input';

@Injectable()
export class SessionService {
	constructor(
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService,
		private readonly redisService: RedisService,
	) {}

	public async findByUser(req: Request) {
		const userId = req.session.userId;

		if (!userId) {
			throw new NotFoundException('No active session found');
		}

		const keys = await this.redisService.client.keys('*');

		if (!keys) {
			throw new NotFoundException('Session keys are not empty');
		}

		const userSessions: any[] = [];

		for (const key of keys) {
			const sessionData = await this.redisService.client.get(key);

			if (sessionData) {
				const session = JSON.parse(sessionData);

				if (session.userId === userId) {
					userSessions.push({
						...session,
						id: key.split(':')[1],
					});
				}
			}
		}

		userSessions.sort((a, b) => b.createdAt - a.createdAt);

		return userSessions.filter((session) => session.id !== req.sessionID);
	}

	public async findCurrent(req: Request) {
		const sessionId = req.session.id;

		if (!sessionId) {
			throw new NotFoundException('Session Id not found');
		}

		const sessionData = await this.redisService.client.get(
			`${this.configService.getOrThrow<string>('SESSION_FOLDER')}${sessionId}`,
		);
 
		if (!sessionData) {
			throw new NotFoundException('Session data not found');
		}

		const session = JSON.parse(sessionData);

		return { ...session, id: sessionId };
	}

	public async login(req: Request, dto: LoginInput, userAgent: string) {
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

		const metadata = getSessionMetadata(req, userAgent);

		return new Promise((resolve, reject) => {
			req.session.userId = user.id;
			req.session.createdAt = new Date();
			req.session.metadata = metadata;

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

	public async clearSession(req: Request) {
		req.res?.clearCookie(
			this.configService.getOrThrow<string>('SESSION_NAME'),
		);

		return true;
	}

	public async removeSession(req: Request, sessionId: string) {
		if (req.session.id === sessionId) {
			throw new ConflictException('Cannot remove current session');
		}

		await this.redisService.client.del(
			`${this.configService.getOrThrow<string>('SESSION_FOLDER')}${sessionId}`,
		);

		return true;
	}
}
