import mongoose, { Document, Model} from 'mongoose';

const ObjectId = mongoose.Schema.Types.ObjectId


const postSchema = new mongoose.Schema<PostDocument>({
  title: { type: String, required: true },
  owner: { type: ObjectId, ref: 'User', required: true },
  ownerUserName: { type: String, required: true },
  textContent: {type: String, required: true},
  thumbnail: {
    imageData: Buffer,
    contentType: String,
  },
  commentList: [{ type: ObjectId, ref: 'Comment', default: [] }],
  images: [
    {
      imageData: Buffer,
      contentType: String,
    }
  ],
  likes: { type: Number, default: 0 },
  forks: { type: Number, default: 0 },
  mapMetadata: { type: ObjectId, ref: 'MapMetadata', required: false},
  tags: [{ type: String }],
}, { timestamps: true });

interface PostDocument extends Document {
  title: string;
  owner: mongoose.Schema.Types.ObjectId; 
  textContent: string;
  ownerUserName: string;
  thumbnail: Image;
  commentList: mongoose.Schema.Types.ObjectId[];
  images: Image[];
  likes: number;
  forks: number;
  mapMetadata: mongoose.Schema.Types.ObjectId;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Image {
  imageData: Buffer,
  contentType: string,
}

const PostModel: Model<PostDocument> = mongoose.model('Post', postSchema);

export { PostModel, PostDocument };
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
