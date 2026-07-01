import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, ObjectId } from 'mongoose';

export const JWKS_TABLE_NAME = 'jwks';

@Schema({
  collection: JWKS_TABLE_NAME,
  timestamps: {
    createdAt: true,
    updatedAt: false,
  },
})
export class Jwks {
  _id: ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  publicKey: string;

  @Prop({
    type: String,
    required: true,
  })
  privateKey: string;

  @Prop({
    type: Date,
    required: false,
    default: null,
  })
  expiresAt?: Date | null;

  createdAt: Date;
}

export type JwksDocument = HydratedDocument<Jwks>;

export const JwksSchema = SchemaFactory.createForClass(Jwks);
