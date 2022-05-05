/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { getModelToken, MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { closeMongoDBConnection, rootMongooseTestModule } from '../util/mongo.helper';
import { UserDatabaseModule } from './user.module';
import { UserDocument, UserSchema, USER_MODEL_NAME } from './user.schema';
import { UserService } from './user.service';
import { UserAvailabilityDocument } from './userAvailability.schema';
import { UserAvailabilityICal } from './userAvailabilityICal.schema';
import { UserDatabaseUtilModule } from './util/userDatabaseUtil.module';

const id = (id: string) => {
  if (id.length > 12) throw new Error('ObjectID length must not exceed 12 characters.');
  return new Types.ObjectId(id.padEnd(12, '_'));
};

const userDocument: Partial<UserDocument> = {
  _id: id('Test User'),
  name: 'Test User',
  firebaseId: 'QwerTY12345Qwerty12345qWErTY',
  flocks: [],
  flockInvites: [],
  availability: [{ _id: id('Availabil_01'), type: 'ical', uri: 'uri://test' }] as UserAvailabilityDocument[],
};

describe(UserService.name, () => {
  let service: UserService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        UserDatabaseModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([{ name: USER_MODEL_NAME, schema: UserSchema }]),
        UserDatabaseUtilModule,
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  beforeEach(async () => {
    // This is where we setup our fake data.
    const userModel = module.get<Model<UserDocument>>(getModelToken(USER_MODEL_NAME));
    await userModel.deleteMany();
    await userModel.create(userDocument);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an user successfully', async () => {
    const createUserInput = {
      name: 'Test User',
      firebaseId: 'QwerTY12345Qwerty12345qWErTY',
    };

    const user: UserDocument = await service.create(createUserInput);
    expect(user).toBeTruthy();
    expect(user._id).toBeTruthy();
    expect(user.name).toEqual(createUserInput.name);
    expect(user.firebaseId).toEqual(createUserInput.firebaseId);
  });

  it('should return all users', async () => {
    const users: UserDocument[] | null = await service.findAll();

    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBe(1);
    checkEquality(users[0], userDocument);
  });

  it('should find one by id', async () => {
    const user: UserDocument | null = await service.findOne(userDocument._id!);

    expect(user).toBeTruthy();
    checkEquality(user!, userDocument);
  });

  it('should find one by firebaseId', async () => {
    const user: UserDocument | null = await service.findOneByFirebaseId(userDocument.firebaseId!);

    expect(user).toBeTruthy();
    checkEquality(user!, userDocument);
  });

  it('should update a user successfully', async () => {
    const user: UserDocument | null = await service.update(userDocument._id!, {
      name: 'New Name',
    });

    // FYI this doesn't make a copy.
    const updatedUserDocument: Partial<UserDocument> = userDocument;
    updatedUserDocument.name = 'New Name';

    expect(user).toBeTruthy();
    checkEquality(user!, updatedUserDocument);
  });

  it('should find add a flock to a user successfully', async () => {
    const flockId = new Types.ObjectId();
    const user: UserDocument | null = await service.addFlockToUser(userDocument._id!, flockId);

    userDocument.flocks!.push(flockId);

    checkEquality(user!, userDocument);
  });

  it('should add a new user availability source', async () => {
    const user: UserDocument | null = await service.addUserAvailability(userDocument._id!, [
      { type: 'ical', uri: 'uri://another' },
    ]);

    expect(user.availability.length).toEqual(userDocument.availability!.length + 1);

    const newAvailability = user.availability.at(-1) as UserAvailabilityICal;
    expect(newAvailability.type).toEqual('ical');
    expect(newAvailability.uri).toEqual('uri://another');
  });

  it('should delete a user successfully', async () => {
    const user: UserDocument | null = await service.delete(userDocument._id!);

    expect(user).toBeTruthy();
    checkEquality(user!, userDocument);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
      await closeMongoDBConnection();
    }
  });
});

const checkEquality = (user: UserDocument, expected: Partial<UserDocument>) => {
  const userObj = user.toJSON();
  delete userObj['__v']; // don't check version
  expect(userObj).toEqual(expected);
};
