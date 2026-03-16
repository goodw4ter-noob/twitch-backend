import { Field, ID, ObjectType } from '@nestjs/graphql';

import { User } from '@/prisma/generated';

@ObjectType()
export class UserModel implements User {
	@Field(() => ID)
	public id: string;

	@Field(() => String)
	public email: string;

	@Field(() => String)
	public password: string;

	@Field(() => String)
	public username: string;

	@Field(() => String)
	public displayName: string;

	@Field(() => String, { nullable: true })
	public avatar: string | null;

	@Field(() => String, { nullable: true })
	public bio: string | null;

	@Field(() => Date)
	public createdAt: Date;

	@Field(() => Date)
	public updatedAt: Date;
}

@ObjectType()
export class ShortUserModel {
	@Field(() => ID)
	public id: string;

	@Field(() => String)
	public username: string;
}
