import mongoose, { Document, Model, Schema } from 'mongoose';

// Define the MapData schema
const mapDataSchema = new Schema<MapDataDocument>({
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

// Define the MapDataDocument interface to represent a map data document
interface MapDataDocument extends Document {
  geoJSON: object;
  proprietaryJSON: {
    templateType: string;
    legend: {
      title: string | undefined;
      keyValueLabels: Array<{
        key: string;
        value: string;
      }>;
    };
    gradientData: {
      primaryColor: number | undefined;
      minScale: number | undefined;
      maxScale: number | undefined;
      sections: number | undefined;
    };
  };
}

// Create the MapData model
const MapDataModel: Model<MapDataDocument> = mongoose.model('MapData', mapDataSchema);

export { MapDataModel, MapDataDocument };

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
