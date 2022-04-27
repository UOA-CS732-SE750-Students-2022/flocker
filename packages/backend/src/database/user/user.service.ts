import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, type Types } from 'mongoose';
import { USER_MODEL_NAME, type User, type UserDocument } from './user.schema';
import { UserAvailabilityProjectionDocument } from './util/projections.types';

/**
 * Service for managing Users in the database.
 * A User represents a single unique person with their Flocks, availability & settings.
 */
@Injectable()
export class UserService {
  constructor(@InjectModel(USER_MODEL_NAME) private readonly model: Model<UserDocument>) {}

  async create(user: Omit<User, 'flocks' | 'flockInvites' | 'availability' | 'settings'>): Promise<UserDocument> {
    return this.model.create({ ...user, flocks: [], flockInvites: [], availability: [], settings: {} });
  }

  async delete(_id: Types.ObjectId | string): Promise<UserDocument | null> {
    return this.model.findByIdAndRemove({ _id }).exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.model.find().exec();
  }

  async findMany(_ids: (Types.ObjectId | string)[]): Promise<UserDocument[]> {
    return this.model
      .find({
        _id: { $in: _ids },
      })
      .exec();
  }

  async findOne(_id: Types.ObjectId | string): Promise<UserDocument | null> {
    return this.model.findById({ _id }).exec();
  }

  async findOneByFirebaseId(firebaseId: string): Promise<UserDocument | null> {
    return this.model.findOne({ firebaseId }).exec();
  }

  async update(_id: Types.ObjectId | string, user: Partial<User>): Promise<UserDocument | null> {
    return this.model.findByIdAndUpdate({ _id }, user).exec();
  }

  async findUserAvailability(
    userId: Types.ObjectId | string,
    availabilityId: Types.ObjectId | string,
  ): Promise<UserDocument | null> {
    return this.model.findOne({ _id: userId, 'availability._id': availabilityId }, { 'availability.$': 1 }).exec();
  }

  /**
   * This query is used to find all userAvailability with an id in the provided list, and return each of those subdocuments separately with their parent doc id.
   *
   * How it works:
   * $unwind performs the operation on each element of availability.
   * $match performs a match on the availability._id field for every availability element. It checks its _id is in the passed list availabilityIds.
   * $project changes the document structure we want to return. Rather than returning the entire user document, we only return the user document id and then the availability subdocument (not as an array, because we are doing this for each element).
   */
  async findManyUserAvailability(
    availabilityIds: (Types.ObjectId | string)[],
  ): Promise<UserAvailabilityProjectionDocument[]> {
    return this.model
      .aggregate([
        {
          $unwind: '$availability',
        },
        {
          $match: {
            'availability._id': { $in: availabilityIds },
          },
        },
        {
          $project: {
            userId: '$_id',
            availabilityDocument: '$availability',
          },
        },
      ])
      .exec();
  }
}
