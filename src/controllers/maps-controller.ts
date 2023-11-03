import { UserModel, UserDocument } from '../models/user-model.js'; // Import the User model and UserDocument
import { PostModel, PostDocument } from '../models/post-model.js'; // Import the Post model and PostDocument
import { MapMetadataModel, MapMetadataDocument } from '../models/mapMetadata-model.js'; // Import the MapMetadata model and MapMetadataDocument
import { Types } from 'mongoose';
import * as shp from 'shpjs';
import * as tj from '@mapbox/togeojson';

import * as xmldom from 'xmldom'


const DOMParser = xmldom.DOMParser;
import * as AdmZip from 'adm-zip'
//const AdmZip = require('adm-zip');
import * as gjv from 'geojson-validation'
//const gjv = require("geojson-validation");


const uploadMap = async (req, res) => {

    const body = req.body
    if (!body || !body.zipFile || !body.fileExtension) {
        return res.status(400).json({sucess: false, errorMessage: "Body is missing required data"})
    }

    let geoJSON = {};

    try {
        if (body.fileExtension === '.shp') {
            const zipFileBuffer = body.zipFile as Buffer
            geoJSON = await shp.parseZip(zipFileBuffer)
        }
        else if (body.fileExtension === '.json') {
            const zipFileBuffer = body.zipFile as Buffer
            const zip = new AdmZip(zipFileBuffer)
    
            const zipEntries = zip.getEntries();
            if (zipEntries.length !== 1) {
            return res.status(400).send('Expected one file in the zip archive.');
            }
            const zipEntry = zipEntries[0].getData().toString()
            if (!gjv.valid(zipEntry)) {
                return res.status(400).json({sucess: false, errorMessage: "JSON uploaded was not valid geoJSON"})
            }
            geoJSON = JSON.parse(zipEntry)
        }
        else if (body.fileExtension === '.kml') {
            const zipFileBuffer = body.zipFile as Buffer
            const zip = new AdmZip(zipFileBuffer)
    
            const zipEntries = zip.getEntries();
            if (zipEntries.length !== 1) {
            return res.status(400).send('Expected one file in the zip archive.');
            }
            const zipEntry = zipEntries[0].getData.toString()
            const xmlParser = new DOMParser()
            const kml = xmlParser.parseFromString(zipEntry, 'text/xml')
            geoJSON = tj.kml(kml)  
        }
    }
    catch (err) {
        console.error("Parsing error!" + err)
        return res.status(400).json({sucess: false, errorMessage: "Parsing error!"})

    }

    if (!geoJSON) {
        return res.status(400).json({sucess: false, errorMessage: "Unsupported file extension!"})
    }

    console.log(JSON.stringify(geoJSON))




    
    
}


const forkMap = async (req, res) => {
    
}

const exportMap = async (req, res) => {
    
}
const getMapMetadataOwnedByUser = async (req, res) => {
    
}
const getPublicMapMetadataOwnedByUser = async (req, res) => {
    
}
const getMapData = async (req, res) => {
    
}
const updateMapPrivacy = async (req, res) => {
    
}
const saveMapEdits = async (req, res) => {
    
}
const publishMap = async (req, res) => {
    
}



const favoriteMap = async (req, res) => {
    
}
const renameMap = async (req, res) => {
    
}

const deleteMap = async (req, res) => {
    
}


const MapsController = {
    uploadMap,
    renameMap,
    forkMap,
    exportMap,
    favoriteMap,
    deleteMap,
    updateMapPrivacy,
    saveMapEdits,
    publishMap,
    getMapMetadataOwnedByUser,
    getPublicMapMetadataOwnedByUser,
    getMapData
}

export {MapsController}