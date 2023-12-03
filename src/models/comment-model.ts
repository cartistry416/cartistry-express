
import mongoose, { Document, Model } from 'mongoose';

const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const CommentSchema = new Schema<CommentDocument>({
    ownerUserName: { type: String, required: true },
    textContent: {type: String, required: true},
    likes: { type: Number, default: 0 },
    replies: [{ type: ObjectId, ref: 'Comment', default: [] }],
}, { timestamps: true });

interface CommentDocument extends Document {
    ownerUserName: string;
    textContent: string;
    likes: number;
    replies: mongoose.Schema.Types.ObjectId[];
}
  
const CommentModel: Model<CommentDocument> = mongoose.model('Comment', CommentSchema);

export { CommentModel, CommentDocument };