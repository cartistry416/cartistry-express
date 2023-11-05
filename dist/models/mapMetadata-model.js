import mongoose from 'mongoose';
const mapMetadata = new mongoose.Schema({
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
const MapMetadataModel = mongoose.model('MapMetadata', mapMetadata);
export { MapMetadataModel };
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
