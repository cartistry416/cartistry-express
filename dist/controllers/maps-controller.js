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
import { bufferToZip, zipToGridFS, gridFSToZip, zipToBuffer, patchGeoJSON, zipToGridFSOverwrite } from '../utils/utils.js';
import { findUserById } from '../utils/utils.js';
const uploadMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    // console.log(body)
    if (!body || !body.fileExtension) {
        return res.status(400).json({ sucess: false, errorMessage: "Body is missing file extension" });
    }
    if (!req.file) {
        return res.status(400).json({ sucess: false, errorMessage: "No file attached" });
    }
    if (!body.title) {
        return res.status(400).json({ sucess: false, errorMessage: "Body is missing title" });
    }
    const validTemplates = {
        choropleth: "choropleth",
        landmark: "landmark",
        cadastral: "cadastral",
        gradient: "gradient",
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
        const geoJSON = yield mapFileParser.parse(req.file.buffer);
        geoJSONZip = yield bufferToZip(geoJSON);
    }
    catch (err) {
        return res.status(400).json({ sucess: false, errorMessage: "Parsing error: " + err });
    }
    try {
        const mapMetadataDocumentId = mongoose.Types.ObjectId();
        const geoJSONZipId = mongoose.Types.ObjectId().toString();
        const geoManLayersId = mongoose.Types.ObjectId().toString();
        yield zipToGridFS(geoJSONZipId, `geoJSON_${geoJSONZipId}.zip`, geoJSONZip);
        const mapDataDocument = yield MapDataModel.create({ geoJSONZipId, geoManLayersId, proprietaryJSON: { templateType: body.templateType } });
        geoJSONZip = yield bufferToZip(Buffer.from(JSON.stringify([])));
        // console.log(mapDataDocument.geoManLayersId)
        yield zipToGridFS(geoManLayersId, `geoMan_${geoManLayersId}.zip`, geoJSONZip);
        const mapMetadataDocument = yield MapMetadataModel.create({ _id: mapMetadataDocumentId, title: body.title, owner: user._id, mapData: mapDataDocument._id });
        user.mapsMetadata.push(mapMetadataDocument._id);
        user.markModified('mapsMetadata');
        yield user.save();
        return res.status(200).json({ success: true, mapMetadata: mapMetadataDocument.toObject(), mapDataId: mapDataDocument._id });
    }
    catch (err) {
        return res.status(500).json({ successs: false, errorMessage: "A lot of possible things could have went wrong: " + err });
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
        if (originalMapMetaDataDocument.owner.toString() !== req.userId && originalMapMetaDataDocument.isPrivated) {
            return res.status(401).json({ success: false, errorMessage: "Unauthorized to fork this map" });
        }
        let originalMapDataId = originalMapMetaDataDocument.mapData.toString();
        const originalMapDataDocument = yield MapDataModel.findById(originalMapDataId);
        const geoJSONZip = yield gridFSToZip(`geoJSON_${originalMapDataDocument.geoJSONZipId.toString()}.zip`);
        if (!originalMapDataDocument) {
            return res.status(404).json({ success: false, errorMessage: "Unable to find map data via id on mapMetadata" });
        }
        const cloneMapMetaData = originalMapMetaDataDocument;
        cloneMapMetaData.owner = user._id;
        cloneMapMetaData._id = mongoose.Types.ObjectId();
        const cloneMapData = originalMapDataDocument;
        cloneMapData._id = mongoose.Types.ObjectId();
        cloneMapMetaData.mapData = cloneMapData._id;
        const cloneGeoJSONZipId = mongoose.Types.ObjectId().toString();
        const cloneGeoManLayersId = mongoose.Types.ObjectId().toString();
        cloneMapData.geoJSONZipId = cloneGeoJSONZipId;
        cloneMapData.geoManLayersId = cloneGeoManLayersId;
        yield zipToGridFS(cloneGeoJSONZipId, `geoJSON_${cloneGeoJSONZipId}.zip`, geoJSONZip);
        yield zipToGridFS(cloneGeoManLayersId, `geoMan_${cloneGeoManLayersId}.zip`, geoJSONZip);
        cloneMapMetaData.createdAt = new Date();
        cloneMapMetaData.updatedAt = new Date();
        cloneMapData.isNew = true;
        cloneMapMetaData.isNew = true;
        yield cloneMapData.save();
        yield cloneMapMetaData.save();
        user.mapsMetadata.push(cloneMapMetaData._id);
        user.markModified('mapsMetadata');
        yield user.save();
        originalMapMetaDataDocument.forks++;
        yield originalMapMetaDataDocument.save();
        return res.status(200).json({ success: true, mapMetadata: cloneMapMetaData.toObject() });
    }
    catch (err) {
        return res.status(500).json({ success: false, errorMessage: "Unable to create or save something to the database OR read/write to/from gridFS " + err });
    }
});
const exportMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mapMetadataDocument = yield MapMetadataModel.findById(req.params.id);
        if (mapMetadataDocument.isPrivated) {
            return res.status(401).json({ success: false, errorMessage: "Unauthorized to export this map" });
        }
        const mapDataDocument = yield MapDataModel.findById(mapMetadataDocument.mapData);
        const geoJSONZip = yield gridFSToZip(`geoJSON_${mapDataDocument.geoJSONZipId}.zip`);
        res.setHeader('Content-Type', 'application/octet-stream');
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
    //console.log(user.mapsMetadata.length)
    const mapMetadatas = [];
    for (let i = 0; i < user.mapsMetadata.length; i++) {
        const mapMetadataId = user.mapsMetadata[i];
        const mapMetaDataDocument = yield MapMetadataModel.findById(mapMetadataId);
        if (!mapMetaDataDocument) {
            console.error('Something went wrong, could not find mapMetadata document from users array of metadata ids');
            continue;
        }
        mapMetadatas.push(mapMetaDataDocument.toObject());
    }
    return res.status(200).json({ success: true, mapMetadatas });
});
const getPublicMapMetadataOwnedByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield findUserById(req.params.userId);
    if (!user) {
        return res.status(500).json({ success: false, errorMessage: "Unable to find user" });
    }
    const publicMapMetadatas = [];
    for (let i = 0; i < user.mapsMetadata.length; i++) {
        const mapMetadataId = user.mapsMetadata[i];
        const mapMetaDataDocument = yield MapMetadataModel.findById(mapMetadataId);
        if (!mapMetaDataDocument) {
            console.error('Something went wrong, could not find mapMetadata document from users array of metadata ids');
            continue;
        }
        else if (!mapMetaDataDocument.isPrivated) {
            publicMapMetadatas.push(mapMetaDataDocument.toObject());
        }
    }
    //console.log(publicMapMetadataIds.length)
    return res.status(200).json({ success: true, mapMetadatas: publicMapMetadatas });
});
const getMapData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let mapMetadataDocument = null;
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, errorMessage: "Invalid map metadata id: " + req.params.id });
    }
    mapMetadataDocument = yield MapMetadataModel.findById(req.params.id);
    if (!mapMetadataDocument) {
        return res.status(404).json({ success: false, errorMessage: "Unable to find mapMetadata" });
    }
    if (mapMetadataDocument.isPrivated) {
        if (!req.userId) { // guest cannot access private map
            return res.status(401).json({ success: false, errorMessage: "Not authorized to get this map data" });
        }
        else if (req.userId !== mapMetadataDocument.owner.toString()) { // logged in cannot access
            return res.status(401).json({ success: false, errorMessage: "Not authorized to get this map data" });
        }
    }
    const mapDataDocument = yield MapDataModel.findById(mapMetadataDocument.mapData);
    if (!mapDataDocument) {
        return res.status(404).json({ success: false, errorMessage: "Unable to find map data" });
    }
    try {
        const geoJSONZip = yield gridFSToZip(`geoJSON_${mapDataDocument.geoJSONZipId}.zip`);
        res.setHeader('Content-Type', 'multipart/mixed; boundary=boundary');
        res.write('--boundary\r\n');
        res.write('Content-Type: application/json\r\n\r\n');
        res.write(JSON.stringify(mapDataDocument.toObject()));
        res.write('\r\n--boundary\r\n');
        res.write('Content-Type: application/json\r\n\r\n');
        // res.write(geoJSONZip);
        res.write((yield zipToBuffer(geoJSONZip)).toString());
        if (mapDataDocument.geoManLayersId !== "") {
            // console.log(mapDataDocument.geoManLayersId )
            const geoManLayers = yield gridFSToZip(`geoMan_${mapDataDocument.geoManLayersId}.zip`);
            res.write('\r\n--boundary\r\n');
            res.write('Content-Type: application/json\r\n\r\n');
            res.write((yield zipToBuffer(geoManLayers)).toString());
        }
        res.end('\r\n--boundary--');
        // res.setHeader('Content-Type', 'application/octet-stream')
        // res.status(200).send(geoJSONZip)
    }
    catch (err) {
        console.error("Unable to read zip file from gridfs: " + err);
        return res.status(500).json({ success: false, errorMessage: "Unable to read zip file from gridfs" });
    }
});
const getMapProprietaryData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let mapMetadataDocument = null;
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, errorMessage: "Invalid map metadata id: " + req.params.id });
    }
    mapMetadataDocument = yield MapMetadataModel.findById(req.params.id);
    if (!mapMetadataDocument) {
        return res.status(404).json({ success: false, errorMessage: "Unable to find mapMetadata" });
    }
    if (mapMetadataDocument.isPrivated) {
        if (!req.userId) { // guest cannot access private map
            return res.status(401).json({ success: false, errorMessage: "Not authorized to get this map data" });
        }
        else if (req.userId !== mapMetadataDocument.owner.toString()) { // logged in cannot access
            return res.status(401).json({ success: false, errorMessage: "Not authorized to get this map data" });
        }
    }
    const mapDataDocument = yield MapDataModel.findById(mapMetadataDocument.mapData);
    if (!mapDataDocument) {
        return res.status(404).json({ success: false, errorMessage: "Unable to find map data" });
    }
    try {
        res.status(200).json({ success: true, proprietaryJSON: mapDataDocument.proprietaryJSON });
    }
    catch (err) {
        return res.status(500).json({ success: false, errorMessage: "Unable to get proprietary JSON" });
    }
});
const getMapMetadata = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ success: false, errorMessage: "Invalid map metadata id: " + req.params.id });
    }
    const mapMetadataDocument = yield MapMetadataModel.findById(req.params.id);
    if (!mapMetadataDocument) {
        return res.status(404).json({ success: false, errorMessage: "Unable to find mapMetadata" });
    }
    if (mapMetadataDocument.isPrivated) {
        if (!req.userId) { // guest cannot access private map
            return res.status(401).json({ success: false, errorMessage: "Not authorized to get this map data" });
        }
        else if (req.userId !== mapMetadataDocument.owner.toString()) { // logged in cannot access
            return res.status(401).json({ success: false, errorMessage: "Not authorized to get this map data" });
        }
    }
    return res.status(200).json({ success: true, mapMetadata: mapMetadataDocument.toObject() });
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
        //console.error(`${mapMetadata.owner } !== ${user._id}`)
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
    const body = req.body;
    if (!body || !body.thumbnail) {
        return res.status(400).json({
            success: false,
            errorMessage: 'You must provide delta and thumbnail in body',
        });
    }
    const user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({ success: false, errorMessage: "Unable to find user" });
    }
    const mapId = req.params.id;
    try {
        const mapMetaDataDocument = yield MapMetadataModel.findById(mapId);
        if (mapMetaDataDocument.owner.toString() !== user._id.toString()) {
            return res.status(401).json({ success: false, errorMessage: "Unauthorized to save this map" });
        }
        mapMetaDataDocument.thumbnail = body.thumbnail;
        yield mapMetaDataDocument.save();
        const mapDataDocument = yield MapDataModel.findById(mapMetaDataDocument.mapData);
        if (body.delta) {
            const geoJSONZip = yield gridFSToZip(`geoJSON_${mapDataDocument.geoJSONZipId}.zip`);
            const geoJSON = JSON.parse((yield zipToBuffer(geoJSONZip)).toString());
            const editedGeoJSONZip = yield patchGeoJSON(geoJSON, body.delta);
            yield zipToGridFSOverwrite(mapDataDocument.geoJSONZipId, `geoJSON_${mapDataDocument.geoJSONZipId}.zip`, editedGeoJSONZip);
        }
        if (body.proprietaryJSON) {
            // console.log(JSON.stringify(body.proprietaryJSON))
            mapDataDocument.proprietaryJSON.legend.title = body.proprietaryJSON.legend.title;
            mapDataDocument.proprietaryJSON.legend.keyValueLabels = JSON.stringify(body.proprietaryJSON.legend.keyValueLabels);
            mapDataDocument.markModified('proprietaryJSON.legend');
            yield mapDataDocument.save();
        }
        if (body.layersGeoJSON) {
            // const geoJSONZip: Buffer = await gridFSToZip(`geoMan_${mapDataDocument.geoManLayersId}.zip`)
            // const geoJSON: Object = JSON.parse((await zipToBuffer(geoJSONZip)).toString())
            // const editedGeoJSONZip: Buffer = await patchGeoJSON(geoJSON, body.layerDelta)    
            const editedLayersZip = yield bufferToZip(Buffer.from(JSON.stringify(body.layersGeoJSON)));
            yield zipToGridFSOverwrite(mapDataDocument.geoManLayersId, `geoMan_${mapDataDocument.geoManLayersId}.zip`, editedLayersZip);
        }
        if (body.gradientLayersGeoJSON) {
            mapDataDocument.gradientLayers = body.gradientLayersGeoJSON;
            yield mapDataDocument.save();
        }
        if (body.gradientOptions) {
            // console.log("received the following gradient options: " + JSON)
            mapDataDocument.gradientOptions = body.gradientOptions;
            yield mapDataDocument.save();
        }
        return res.status(200).json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ success: false, errorMessage: "Unable to perform one of the following: read from gridfs, perform patching, write to gridfs: " + err });
    }
});
const favoriteMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({ success: false, errorMessage: "Unable to find user" });
    }
    const mapId = req.params.id;
    try {
        const mapMetaDataDocument = yield MapMetadataModel.findById(mapId);
        if (mapMetaDataDocument.owner.toString() !== user._id.toString()) {
            return res.status(401).json({ success: false, errorMessage: "Unauthorized to edit favorited for this map" });
        }
        mapMetaDataDocument.ownerFavorited = !mapMetaDataDocument.ownerFavorited;
        yield mapMetaDataDocument.save();
        return res.status(200).json({ success: true, ownerFavorited: mapMetaDataDocument.ownerFavorited });
    }
    catch (err) {
        return res.status(500).json({ success: false, errorMessage: "Unable to edit favorited because " + err });
    }
});
const renameMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body || !body.title) {
        return res.status(400).json({ success: false, errorMessage: "Must provide title in body" });
    }
    const user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({ success: false, errorMessage: "Unable to find user" });
    }
    const mapId = req.params.id;
    try {
        const mapMetaDataDocument = yield MapMetadataModel.findById(mapId);
        if (mapMetaDataDocument.owner.toString() !== user._id.toString()) {
            return res.status(401).json({ success: false, errorMessage: "Unauthorized to edit title for this map" });
        }
        mapMetaDataDocument.title = body.title;
        yield mapMetaDataDocument.save();
        return res.status(200).json({ success: true, title: mapMetaDataDocument.title });
    }
    catch (err) {
        return res.status(500).json({ success: false, errorMessage: "Unable to edit title because " + err });
    }
});
const deleteMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield findUserById(req.userId);
    if (!user) {
        return res.status(500).json({ success: false, errorMessage: "Unable to find user" });
    }
    try {
        const mapMetaDataDocument = yield MapMetadataModel.findById(req.params.id);
        if (mapMetaDataDocument.owner.toString() !== user._id.toString()) {
            return res.status(401).json({ success: false, errorMessage: "Unauthorized to delete this map" });
        }
        const mapMetaDataDocumentId = mapMetaDataDocument._id.toString();
        const mapDataDocumentId = mapMetaDataDocument.mapData;
        const idx = user.mapsMetadata.findIndex(id => id.toString() === mapMetaDataDocumentId);
        if (idx >= 0) {
            user.mapsMetadata.splice(idx, 1);
            user.markModified('mapsMetadata');
            yield user.save();
            yield mapMetaDataDocument.remove();
            yield MapDataModel.findByIdAndRemove(mapDataDocumentId);
            return res.status(200).json({ success: true });
        }
        else {
            return res.status(500).json({ success: false, errorMessage: "Couldn't find mapsMetadataId on user" });
        }
    }
    catch (err) {
        return res.status(500).json({ success: false, errorMessage: "Unable to delete map because " + err });
    }
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
    getMapMetadataOwnedByUser,
    getPublicMapMetadataOwnedByUser,
    getMapData,
    getMapMetadata,
};
export { MapsController };
