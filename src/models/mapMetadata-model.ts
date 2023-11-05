import mongoose, { Document, Model, Types } from 'mongoose';
import { UserDocument } from './user-model.js'; 
import { MapDataDocument } from './mapData-model.js'; 
const mapMetadata = new mongoose.Schema<MapMetadataDocument>({
  title: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thumbnail: {
    imageData: Buffer,
    contentType: String,
  },
  ownerFavorited: { type: Boolean, default: false },
  forks: { type: Number, default: 0 },
  mapData: { type: mongoose.Schema.Types.ObjectId, ref: 'MapData', required: true },
  isPrivated: { type: Boolean, default: true },
}, { timestamps: true });

interface MapMetadataDocument extends Document {
  title: string;
  owner: mongoose.Schema.Types.ObjectId; 
  thumbnail: Image;
  ownerFavorited: boolean;
  forks: number;
  mapData: mongoose.Schema.Types.ObjectId; 
  isPrivated: boolean;
}

interface Image {
  imageData: Buffer,
  contentType: string,
}

const MapMetadataModel: Model<MapMetadataDocument> = mongoose.model('MapMetadata', mapMetadata);

export { MapMetadataModel, MapMetadataDocument };


// const mongoose = require('mongoose')
// const mongoose.Schema = mongoose.mongoose.Schema
// const ObjectId = mongoose.Schema.Types.ObjectId

// const mapMetadatamongoose.Schema = new mongoose.Schema(
//     {
//         title: { type: String, required: true },
//         owner: { type: ObjectId, ref:'User', required: true },
//         thumbnail: {
//             imageData: Buffer,
//             contentType: String, 
//             required: true
//         },
//         lastEdited: {type: Date},
//         ownerFavorited: {type: Boolean, default: false},
//         forks: {type: Number, default: 0},
//         mapData: {type: ObjectId, ref:'MapData', required: true},
//         isPrivated: {type: Boolean, default: true},
//         tags: {type: [{type: String}], default: []}
//     },
//     { timestamps: true },
// )

// module.exports = mongoose.model('MapMetadata', mapMetadatamongoose.Schema)
