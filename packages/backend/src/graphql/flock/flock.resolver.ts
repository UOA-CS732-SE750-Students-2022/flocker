import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Resolver, Args, Query, Parent, ResolveField, Mutation } from '@nestjs/graphql';
// eslint-disable-next-line import/no-unresolved
import { DecodedIdToken } from 'firebase-admin/auth';
import { GraphQLString } from 'graphql';
import { FlockDocument } from '~/database/flock/flock.schema';
import { FlockService } from '~/database/flock/flock.service';
import { UserService } from '~/database/user/user.service';
import { Auth } from '~/decorators/auth.decorator';
import { User } from '~/decorators/user.decorator';
import { AddFlockInput } from './inputs/addFlock.input';
import { FlockGraphQLModel } from './models/flock.model';

@Resolver(() => FlockGraphQLModel)
export class FlockResolver {
  constructor(private flockService: FlockService, private userService: UserService) {}

  @ResolveField()
  async users(@Parent() flock: FlockDocument) {
    return this.userService.findMany(flock.users);
  }

  @Query(() => FlockGraphQLModel)
  async getFlock(@Args('id', { type: () => GraphQLString }) id: string) {
    return this.flockService.findOne(id);
  }

  @Query(() => [FlockGraphQLModel])
  async getFlocks() {
    return this.flockService.findAll();
  }

  @Mutation(() => FlockGraphQLModel)
  async addFlock(@Args('addFlockInput') addFlockInput: AddFlockInput) {
    for (const flockDay of addFlockInput.flockDays) {
      const { start, end } = flockDay;

      if (start >= end) {
        return new BadRequestException('Invalid start and end date(s)');
      }
    }
    return this.flockService.create(addFlockInput);
  }

  @Auth()
  @Mutation(() => FlockGraphQLModel)
  async joinFlock(@Args('flockCode', { type: () => GraphQLString }) flockCode: string, @User() user: DecodedIdToken) {
    const firebaseId = user.uid;
    const userDocument = await this.userService.findOneByFirebaseId(firebaseId);

    if (!userDocument) {
      throw new NotFoundException('Invalid user id');
    }

    const flock = await this.flockService.findOneByCode(flockCode);

    if (!flock) {
      throw new NotFoundException('Invalid flock code');
    }

    if (flock.users.includes(userDocument._id)) {
      throw new BadRequestException('User is already in this flock');
    }

    await this.flockService.update(flock._id, { users: [...flock.users, userDocument._id] });
    return this.flockService.findOne(flock._id);
  }
}
