import mongoose from 'mongoose';
const ObjectId = mongoose.Schema.Types.ObjectId;
const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    owner: { type: ObjectId, ref: 'User', required: true },
    ownerUserName: { type: String, required: true },
    textContent: { type: String, required: true },
    thumbnail: {
        imageData: Buffer,
        contentType: String,
    },
    comments: [
        {
            authorUserName: String,
            comment: String,
            publishDate: { type: Date },
        },
    ],
    images: [
        {
            imageData: Buffer,
            contentType: String,
        }
    ],
    likes: { type: Number, default: 0 },
    forks: { type: Number, default: 0 },
    mapMetadata: { type: ObjectId, ref: 'MapMetadata' },
    tags: [{ type: String }],
    publishDate: { type: Date },
}, { timestamps: true });
const PostModel = mongoose.model('Post', postSchema);
export { PostModel };
// const Schema = mongoose.Schema
// const ObjectId = Schema.Types.ObjectId
// const postSchema = new Schema(
//     {
//         title: { type: String, required: true },
//         owner: { type: ObjectId, ref:'User', required: true },
//         ownerUserName: {type: String, required: true},  
//         thumbnail: {
//             imageData: Buffer,
//             contentType: String, 
//         },
//         comments: { type: [{
//             authorUserName: String,
//             comment: String,
//             publishDate: {type: Date},
//         }], default: []},
//         likes: {type: Number, default: 0},
//         forks: {type: Number, default: 0},
//         publishDate: {type: Date},
//     },
//     { timestamps: true },
// )
// module.exports = mongoose.model('Post', postSchema)
