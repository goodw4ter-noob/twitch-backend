import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
	public client: RedisClientType;

	public constructor(private readonly configService: ConfigService) {
		this.client = createClient({
			url: this.configService.getOrThrow<string>('REDIS_URI'),
		}) as RedisClientType;
	}

	public async onModuleInit() {
		await this.client.connect();
	}

	public async onModuleDestroy() {
		await this.client.disconnect();
	}
}
