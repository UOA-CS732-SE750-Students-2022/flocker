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
import { UserFlockAvailabilityInput } from './inputs/userFlockAvailability.input';
import { FlockGraphQLModel } from './models/flock.model';

@Resolver(() => FlockGraphQLModel)
export class FlockResolver {
  constructor(private flockService: FlockService, private userService: UserService) {}

  @ResolveField()
  async users(@Parent() flock: FlockDocument) {
    return this.userService.findMany(flock.users);
  }

  @ResolveField()
  async userFlockAvailability(@Parent() flock: FlockDocument) {
    const userFlockAvailabilityIds = flock.userFlockAvailability.map((userFlockAvailability) => {
      return userFlockAvailability.userAvailabilityId;
    });

    const userAvailability = await this.userService.findManyUserAvailability(userFlockAvailabilityIds);

    return Promise.all(
      userAvailability.map((document, index) => ({
        user: this.userService.findOne(document.userId),
        userAvailability: document.availabilityDocument,
        enabled: flock.userFlockAvailability[index].enabled,
      })),
    );
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
      throw new NotFoundException('Invalid flock code');
    }

    if (flock.users.includes(user._id)) {
      throw new BadRequestException('User is already in this flock');
    }

    return this.flockService.update(flock._id, { users: [...flock.users, user._id] });
  }

  @Auth()
  @Mutation(() => FlockGraphQLModel)
  async updateAvailabilityEnablement(
    @Args('flockCode', { type: () => GraphQLString }) flockCode: string,
    @Args('userFlockAvailabilityInput') userFlockAvailabilityInput: UserFlockAvailabilityInput,
    @User() user: UserDocument,
  ) {
    const flock = await this.flockService.findOneByCode(flockCode);

    if (!flock) {
      throw new NotFoundException(`Invalid flock code: ${flockCode}`);
    } else if (!flock.users.includes(user._id)) {
      throw new BadRequestException('User is not in this flock');
    }

    const userAvailability = await this.userService.findUserAvailability(
      user._id,
      userFlockAvailabilityInput.userAvailabilityId,
    );

    if (!userAvailability) {
      throw new NotFoundException(`Invalid user availability id: ${userFlockAvailabilityInput.userAvailabilityId}`);
    }

    for (const userFlockAvailability of flock.userFlockAvailability) {
      if (userFlockAvailability.userAvailabilityId.toString() === userFlockAvailabilityInput.userAvailabilityId) {
        userFlockAvailability.enabled = userFlockAvailabilityInput.enabled;
        await flock.save();
        return flock;
      }
    }

    return this.flockService.addUserFlockAvailability(flock._id, {
      user: user._id,
      userAvailabilityId: userAvailability.availability[0]._id,
      enabled: userFlockAvailabilityInput.enabled,
    });
  }
}
