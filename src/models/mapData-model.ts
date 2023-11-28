import mongoose, { Document, Model } from 'mongoose';
const Schema = mongoose.Schema
// Define the MapData schema
const mapDataSchema = new Schema<MapDataDocument>({
  geoJSONZipId: { type: String , required: true },
  proprietaryJSON: {
    templateType: { type: String, required: true },
    legend: {
      title: { type: String, default: "Legend Title"},
      keyValueLabels: {type: [
        {
          key: { type: String },
          value: { type: String },
        },
        ],
        default: []
      }
    },
    gradientData: {
      primaryColor: { type: Number, default: 0x00FF00},
      minScale: { type: Number, default: 0},
      maxScale: { type: Number, default: 100},
      sections: { type: Number, default: 4},
    },
  },
});

// Define the MapDataDocument interface to represent a map data document
interface MapDataDocument extends Document {
  geoJSONZipId: string;
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
      primaryColor: number;
      minScale: number;
      maxScale: number;
      sections: number;
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
