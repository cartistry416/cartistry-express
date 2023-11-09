import mongoose, { Document, Model} from 'mongoose';
import { UserDocument } from './user-model'; 

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
  mapMetadata: { type: ObjectId, ref: 'MapMetadata', required: false},
  tags: [{ type: String }],
}, { timestamps: true });

interface PostDocument extends Document {
  title: string;
  owner: mongoose.Schema.Types.ObjectId; 
  textContent: string;
  ownerUserName: string;
  thumbnail: Image;
  comments: Comment[];
  images: Image[];
  likes: number;
  forks: number;
  mapMetadata: mongoose.Schema.Types.ObjectId;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Comment {
  authorUserName: string;
  comment: string;
  publishDate: Date;
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
