import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Resolver, Args, Query, Parent, ResolveField, Mutation } from '@nestjs/graphql';
import { GraphQLString } from 'graphql';
import { FlockDocument } from '~/database/flock/flock.schema';
import { FlockService } from '~/database/flock/flock.service';
import { UserDocument } from '~/database/user/user.schema';
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
  async joinFlock(@Args('flockCode', { type: () => GraphQLString }) flockCode: string, @User() user: UserDocument) {
    const flock = await this.flockService.findOneByCode(flockCode);

    if (!flock) {
      throw new NotFoundException(`Invalid flock code: ${flockCode}`);
    }

    if (flock.users.includes(user._id)) {
      throw new BadRequestException('User is already in this flock');
    }

    await this.userService.update(user._id, { flocks: [...flock.users, user._id] });
    return this.flockService.update(flock._id, { users: [...flock.users, user._id] });
  }
}
