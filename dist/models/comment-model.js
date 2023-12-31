import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const CommentSchema = new Schema({
    ownerUserName: { type: String, required: true },
    textContent: { type: String, required: true },
    ownerId: { type: String, required: true },
}, { timestamps: true });
const CommentModel = mongoose.model('Comment', CommentSchema);
export { CommentModel };
