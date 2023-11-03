var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import * as shp from 'shpjs';
import * as tj from '@mapbox/togeojson';
import * as xmldom from 'xmldom';
const DOMParser = xmldom.DOMParser;
import * as AdmZip from 'adm-zip';
//const AdmZip = require('adm-zip');
import * as gjv from 'geojson-validation';
//const gjv = require("geojson-validation");
const uploadMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    if (!body || !body.zipFile || !body.fileExtension) {
        return res.status(400).json({ sucess: false, errorMessage: "Body is missing required data" });
    }
    let geoJSON = {};
    try {
        if (body.fileExtension === '.shp') {
            const zipFileBuffer = body.zipFile;
            geoJSON = yield shp.parseZip(zipFileBuffer);
        }
        else if (body.fileExtension === '.json') {
            const zipFileBuffer = body.zipFile;
            const zip = new AdmZip(zipFileBuffer);
            const zipEntries = zip.getEntries();
            if (zipEntries.length !== 1) {
                return res.status(400).send('Expected one file in the zip archive.');
            }
            const zipEntry = zipEntries[0].getData().toString();
            if (!gjv.valid(zipEntry)) {
                return res.status(400).json({ sucess: false, errorMessage: "JSON uploaded was not valid geoJSON" });
            }
            geoJSON = JSON.parse(zipEntry);
        }
        else if (body.fileExtension === '.kml') {
            const zipFileBuffer = body.zipFile;
            const zip = new AdmZip(zipFileBuffer);
            const zipEntries = zip.getEntries();
            if (zipEntries.length !== 1) {
                return res.status(400).send('Expected one file in the zip archive.');
            }
            const zipEntry = zipEntries[0].getData.toString();
            const xmlParser = new DOMParser();
            const kml = xmlParser.parseFromString(zipEntry, 'text/xml');
            geoJSON = tj.kml(kml);
        }
    }
    catch (err) {
        console.error("Parsing error!" + err);
        return res.status(400).json({ sucess: false, errorMessage: "Parsing error!" });
    }
    if (!geoJSON) {
        return res.status(400).json({ sucess: false, errorMessage: "Unsupported file extension!" });
    }
    console.log(JSON.stringify(geoJSON));
});
const forkMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
});
const exportMap = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
});
const getMapMetadataOwnedByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
});
const getPublicMapMetadataOwnedByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
});
const getMapData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
});
const updateMapPrivacy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
