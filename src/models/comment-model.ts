
import mongoose, { Document, Model } from 'mongoose';

const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const CommentSchema = new Schema<CommentDocument>({
    ownerUserName: { type: String, required: true },
    textContent: {type: String, required: true},
    ownerId: { type: String, required: true },
}, { timestamps: true });

interface CommentDocument extends Document {
    ownerUserName: string;
    textContent: string;
    ownerId: string;
}
  
const CommentModel: Model<CommentDocument> = mongoose.model('Comment', CommentSchema);

export { CommentModel, CommentDocument };