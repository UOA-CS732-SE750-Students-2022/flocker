import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Document, Schema as MSchema, type Types } from 'mongoose';

export const FLOCK_MODEL_NAME = 'Flock';

/**
 * A Flock represents a multi-user ('flock') availability schedule.
 */
export interface Flock {
  name: string;
  users: Types.ObjectId[];
}

@Schema()
class FlockClass implements Flock {
  @Prop()
  name!: string;

  @Prop({ type: [MSchema.Types.ObjectId], ref: 'User', default: [] })
  users!: Types.ObjectId[];
}

/**
 * A Flock represents a multi-user ('flock') availability schedule.
 */
export type FlockDocument = Flock & Omit<Document<Types.ObjectId>, 'id'>;

/**
 * A Flock represents a multi-user ('flock') availability schedule.
 */
export const FlockSchema = SchemaFactory.createForClass(FlockClass);