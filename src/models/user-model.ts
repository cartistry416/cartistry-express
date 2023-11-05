
import mongoose, { Document, Model } from 'mongoose';

const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const UserSchema = new Schema<UserDocument>({
    userName: { type: String, required: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    posts: [{ type: ObjectId, ref: 'Post', default: [] }],
    mapsMetadata: [{ type: ObjectId, ref: 'MapMetadata', default: [] }],
    likedPosts: [{ type: ObjectId, ref: 'Post', default: [] }],
    untitledCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    timeOfLastPasswordResetRequest: { type: Date, required: false },
  }, { timestamps: true });

interface UserDocument extends Document {
    userName: string;
    email: string;
    passwordHash: string;
    posts: mongoose.Schema.Types.ObjectId[];
    mapsMetadata: mongoose.Schema.Types.ObjectId[];
    likedPosts: mongoose.Schema.Types.ObjectId[];
    untitledCount: number;
    duplicateCount: number;
    isAdmin: boolean;
    timeOfLastPasswordResetRequest: Date;
  }
  
const UserModel: Model<UserDocument> = mongoose.model('User', UserSchema);

export { UserModel, UserDocument };