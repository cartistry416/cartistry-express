import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import { UserDocument } from './user-model'; 
import { MapDataDocument } from './mapData-model'; 
// Define the MapMetadata schema
const mapMetadataSchema = new Schema<MapMetadataDocument>({
  title: { type: String, required: true },
  owner: { type: Types.ObjectId, ref: 'User', required: true },
  thumbnail: {
    imageData: Buffer,
    contentType: String,
    required: true,
  },
  lastEdited: { type: Date },
  ownerFavorited: { type: Boolean, default: false },
  forks: { type: Number, default: 0 },
  mapData: { type: Types.ObjectId, ref: 'MapData', required: true },
  isPrivated: { type: Boolean, default: true },
}, { timestamps: true });

interface MapMetadataDocument extends Document {
  title: string;
  owner: Types.ObjectId; 
  thumbnail: Image;
  lastEdited: Date;
  ownerFavorited: boolean;
  forks: number;
  mapData: Types.ObjectId; 
  isPrivated: boolean;
}

interface Image {
  imageData: Buffer,
  contentType: string,
}

const MapMetadataModel: Model<MapMetadataDocument> = mongoose.model('MapMetadata', mapMetadataSchema);

export { MapMetadataModel, MapMetadataDocument };


// const mongoose = require('mongoose')
// const Schema = mongoose.Schema
// const ObjectId = Schema.Types.ObjectId

// const mapMetadataSchema = new Schema(
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

// module.exports = mongoose.model('MapMetadata', mapMetadataSchema)
