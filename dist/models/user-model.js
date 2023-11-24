import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const UserSchema = new Schema({
    userName: { type: String, required: true },
    email: { type: String, required: true },
    passwordHash: { type: String, required: true },
    posts: [{ type: ObjectId, ref: 'Post', default: [] }],
    mapsMetadata: [{ type: ObjectId, ref: 'MapMetadata', default: [] }],
    likedPosts: [{ type: ObjectId, ref: 'Post', default: [] }],
    untitledCount: { type: Number, default: 0 },
    duplicateCount: { type: Number, default: 0 },
    isAdmin: { type: Boolean, default: false },
    resetPasswordToken: { type: String, required: false },
    resetTokenExpiration: { type: Date, required: false },
}, { timestamps: true });
const UserModel = mongoose.model('User', UserSchema);
export { UserModel };
