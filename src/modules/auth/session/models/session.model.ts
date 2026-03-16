import { Field, ID, ObjectType } from '@nestjs/graphql';

import {
	DeviceInfo,
	LocationInfo,
	SessionMetadata,
} from '@/src/shared/types/session-metadata.types';

@ObjectType()
export class LocationModel implements LocationInfo {
	@Field(() => String)
	country: string;

	@Field(() => String)
	city: string;

	@Field(() => Number)
	latitude: number;

	@Field(() => Number)
	longitude: number;
}

@ObjectType()
export class DeviceModel implements DeviceInfo {
	@Field(() => String)
	browser: string;

	@Field(() => String)
	os: string;

	@Field(() => String)
	type: string;
}

@ObjectType()
export class SessionMetadataModel implements SessionMetadata {
	@Field(() => String)
	ip: string;

	@Field(() => LocationModel)
	location: LocationModel;

	@Field(() => DeviceModel)
	device: DeviceModel;
}

@ObjectType()
export class SessionModel {
	@Field(() => ID)
	id: string;

	@Field(() => ID)
	userId: string;

	@Field(() => String)
	createdAt: string;

	@Field(() => SessionMetadataModel)
	metadata: SessionMetadataModel;
}
