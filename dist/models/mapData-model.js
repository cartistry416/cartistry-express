import mongoose, { Schema } from 'mongoose';
// Define the MapData schema
const mapDataSchema = new Schema({
    geoJSON: { type: Object, required: true },
    proprietaryJSON: {
        templateType: { type: String, required: true },
        legend: {
            title: { type: String },
            keyValueLabels: [
                {
                    key: { type: String },
                    value: { type: String },
                },
            ],
        },
        gradientData: {
            primaryColor: { type: Number },
            minScale: { type: Number },
            maxScale: { type: Number },
            sections: { type: Number },
        },
    },
}, { timestamps: true });
// Create the MapData model
const MapDataModel = mongoose.model('MapData', mapDataSchema);
export { MapDataModel };
// const mongoose = require('mongoose')
// const Schema = mongoose.Schema
// const ObjectId = Schema.Types.ObjectId
// const mapDataSchema = new Schema(
//     {
//         geoJSON: {type: Object, required: true},
//         proprietaryJSON: {
//             templateType: {type: String, required: true},
//             legend: {
//                 title: {type: String},
//                 keyValueLabels: {type: [{
//                     key: {type: String},
//                     value: {type: String}
//                 }]}
//             },
//             gradientData: {
//                 primaryColor: {type: Number},
//                 minScale: {type: Number},
//                 maxScale: {type: Number},
//                 sections: {type: Number},
//             }
//         }
//     }
// )
// module.exports = mongoose.model('MapData', mapDataSchema)
