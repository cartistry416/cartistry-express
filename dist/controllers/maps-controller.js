var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { MapMetadataModel } from '../models/mapMetadata-model.js';
import { MapDataModel } from '../models/mapData-model.js';
import mongoose from 'mongoose';
import { MapFileParserFactory } from '../utils/MapFileParser.js';
import { bufferToZip, zipToDisk, diskToZipBuffer } from '../utils/utils.js';
import { findUserById } from '../utils/utils.js';
const path = require('path');
const uploadMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body || !req.file || !body.fileExtension) {
        return res.status(400).json({ sucess: false, errorMessage: "Body is missing file or file extension" });
    }
    if (!body.title) {
        return res.status(400).json({ sucess: false, errorMessage: "Body is missing title" });
    }
    const validTemplates = {
        heat: "heat",
        landmark: "landmark",
        cadastral: "cadastral",
        subway: "subway",
        bin: "bin"
    };
    if (!validTemplates.hasOwnProperty(body.templateType)) {
        return res.status(400).json({ sucess: false, errorMessage: "Body is missing template type or one provided is incorrect" });
    }
    const user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({ success: false, errorMessage: "Unable to find user" });
    }
    let geoJSONZip;
    const mapFileParser = MapFileParserFactory(body.fileExtension);
    if (!mapFileParser) {
        return res.status(400).json({ sucess: false, errorMessage: "Unsupported file extension!" });
    }
    try {
        const zipFileBuffer = req.file.buffer;
        const geoJSON = yield mapFileParser.parse(zipFileBuffer);
        geoJSONZip = yield bufferToZip(geoJSON);
    }
    catch (err) {
        return res.status(400).json({ sucess: false, errorMessage: "Parsing error: " + err });
    }
    try {
        const mapMetadataDocumentId = mongoose.Types.ObjectId();
        const geoJSONZipPath = path.join(__dirname, `../../GeoJSONZipFiles${process.env.NODE_ENV === 'test' ? 'Test' : ""}/${mapMetadataDocumentId.toString()}`);
        yield zipToDisk(geoJSONZipPath, geoJSONZip);
        const mapDataDocument = yield MapDataModel.create({ geoJSONZipPath, proprietaryJSON: { templateType: body.templateType } });
        const mapMetadataDocument = yield MapMetadataModel.create({ _id: mapMetadataDocumentId, title: body.title, owner: user._id, mapData: mapDataDocument._id });
        user.mapsMetadata.push(mapMetadataDocument._id);
        user.markModified('mapsMetadata');
        yield user.save();
        return res.status(200).json({ success: true, mapMetadataId: mapMetadataDocument._id, mapDataId: mapDataDocument._id });
    }
    catch (err) {
        return res.status(500).json({ successs: false, errorMessage: "A lot of possible things could have went wrong" });
    }
});
const forkMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({ success: false, errorMessage: "Unable to find user" });
    }
    try {
        const originalMapMetaDataDocument = yield MapMetadataModel.findById(req.params.id);
        if (!originalMapMetaDataDocument) {
            return res.status(404).json({ success: false, errorMessage: "Unable to find mapMetadata from provided id" });
        }
        let originalMapDataId = originalMapMetaDataDocument.mapData.toString();
        const originalMapDataDocument = yield MapDataModel.findById(originalMapDataId);
        const geoJSONZip = yield diskToZipBuffer(originalMapDataDocument.geoJSONZipPath);
        if (!originalMapDataDocument) {
            return res.status(404).json({ success: false, errorMessage: "Unable to find map data via id on mapMetadata" });
        }
        const cloneMapMetaData = originalMapMetaDataDocument;
        cloneMapMetaData.owner = user._id;
        cloneMapMetaData._id = mongoose.Types.ObjectId();
        const cloneMapData = originalMapDataDocument;
        cloneMapData._id = mongoose.Types.ObjectId();
        cloneMapMetaData.mapData = cloneMapData._id;
        const cloneGeoJSONZipPath = path.join(__dirname, `../../GeoJSONZipFiles${process.env.NODE_ENV === 'test' ? 'Test' : ""}/${cloneMapMetaData._id.toString()}`);
        cloneMapData.geoJSONZipPath = cloneGeoJSONZipPath;
        yield zipToDisk(cloneGeoJSONZipPath, geoJSONZip);
        cloneMapData.isNew = true;
        cloneMapMetaData.isNew = true;
        yield cloneMapData.save();
        yield cloneMapMetaData.save();
        user.mapsMetadata.push(cloneMapMetaData._id);
        user.markModified('mapsMetadata');
        yield user.save();
        originalMapMetaDataDocument.forks++;
        yield originalMapMetaDataDocument.save();
        return res.status(200).json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ success: false, errorMessage: "Unable to create or save something to the database OR read/write to/from local disk " + err });
    }
});
const exportMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mapMetadataDocument = yield MapMetadataModel.findById(req.params.id);
        const mapDataDocument = yield MapDataModel.findById(mapMetadataDocument.mapData);
        const geoJSONZip = yield diskToZipBuffer(mapDataDocument.geoJSONZipPath);
        res.status(200).send(geoJSONZip);
    }
    catch (err) {
        return res.status(400).json({ success: false, errorMessage: 'Unable to find mapMetadata or mapData' });
    }
});
const getMapMetadataOwnedByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({ success: false, errorMessage: "Unable to find user" });
    }
    console.log(user.mapsMetadata.length);
    return res.status(200).json({ success: true, mapMetadataIds: user.mapsMetadata });
});
const getPublicMapMetadataOwnedByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield findUserById(req.params.userId);
    if (!user) {
        return res.status(500).json({ success: false, errorMessage: "Unable to find user" });
    }
    const publicMapMetadataIds = [];
    for (let i = 0; i < user.mapsMetadata.length; i++) {
        const mapMetadataId = user.mapsMetadata[i];
        const mapMetaDataDocument = yield MapMetadataModel.findById(mapMetadataId);
        if (!mapMetaDataDocument) {
            console.error('Something went wrong, could not find mapMetadata document from users array of metadata ids');
            continue;
        }
        else if (!mapMetaDataDocument.isPrivated) {
            publicMapMetadataIds.push(mapMetadataId.toString());
        }
    }
    console.log(publicMapMetadataIds.length);
    return res.status(200).json({ success: true, mapMetadataIds: publicMapMetadataIds });
});
const getMapData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({ success: false, errorMessage: "Unable to find user" });
    }
    const mapMetadataDocument = yield MapMetadataModel.findById(req.params.id);
    if (!mapMetadataDocument) {
        return res.status(404).json({ success: false, errorMessage: "Unable to find mapMetadata" });
    }
    if (mapMetadataDocument.owner.toString() !== user._id.toString() && mapMetadataDocument.isPrivated) {
        console.log(`${mapMetadataDocument.owner} !== ${user._id}`);
        return res.status(401).json({ success: false, errorMessage: "Not authorized to get this map data" });
    }
    const mapDataDocument = yield MapDataModel.findById(mapMetadataDocument.mapData);
    if (!mapDataDocument) {
        return res.status(404).json({ success: false, errorMessage: "Unable to find map data" });
    }
    try {
        const geoJSONZip = yield diskToZipBuffer(mapDataDocument.geoJSONZipPath);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.status(200).send(geoJSONZip);
    }
    catch (err) {
        console.error("Unable to read zip file from disk: " + err);
        return res.status(500).json({ success: false, errorMessage: "Unable to read zip file from disk" });
    }
});
const updateMapPrivacy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({ success: false, errorMessage: "Unable to find user" });
    }
    const mapMetadata = yield MapMetadataModel.findById(req.params.id);
    if (!mapMetadata) {
        return res.status(404).json({ success: false, errorMessage: "Unable to find mapMetadata" });
    }
    if (mapMetadata.owner.toString() !== user._id.toString()) {
        console.log(`${mapMetadata.owner} !== ${user._id}`);
        return res.status(401).json({ success: false, errorMessage: "Not authorized to change privacy status of this map metadata" });
    }
    mapMetadata.isPrivated = !mapMetadata.isPrivated;
    try {
        yield mapMetadata.save();
        return res.status(200).json({ success: true, isPrivated: mapMetadata.isPrivated });
    }
    catch (err) {
        return res.status(500).json({ success: false, errorMessage: "Unable to find mapMetadata" });
    }
});
const saveMapEdits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
});
const publishMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
});
const favoriteMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
});
const renameMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
});
const deleteMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
});
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
};
export { MapsController };
