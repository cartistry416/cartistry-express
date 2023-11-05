var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import shp from 'shpjs';
import * as tj from "@mapbox/togeojson";
import * as xmldom from 'xmldom';
const DOMParser = xmldom.DOMParser;
import AdmZip from 'adm-zip';
import * as gjv from 'geojson-validation';
class GeoJSONFileReader {
    constructor() {
    }
    parse(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const zip = new AdmZip(data);
            const zipEntries = zip.getEntries();
            if (zipEntries.length !== 1) {
                throw new Error('Expected one file in the zip archive.');
            }
            const zipEntry = zipEntries[0].getData().toString();
            const geoJSON = JSON.parse(zipEntry);
            const errors = gjv.valid(geoJSON, true);
            if (errors.length > 0) {
                throw new Error(`${errors.join(', ')}`);
            }
            return Buffer.from(JSON.stringify(geoJSON));
        });
    }
}
class KMLFileReader {
    constructor(domParser = new DOMParser()) {
        this.domParser = domParser;
    }
    parse(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const zip = new AdmZip(data);
            const zipEntries = zip.getEntries();
            if (zipEntries.length !== 1) {
                throw new Error('Expected one file in the zip archive.');
            }
            const zipEntry = zipEntries[0].getData().toString();
            const geoJSON = tj.kml(this.domParser.parseFromString(zipEntry, 'text/xml'));
            return Buffer.from(JSON.stringify(geoJSON));
        });
    }
}
class SHPFileReader {
    constructor() {
    }
    parse(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const geoJSON = yield shp.parseZip(data);
            return Buffer.from(JSON.stringify(geoJSON));
        });
    }
}
const MapFileParserFactory = (fileExtension) => {
    if (fileExtension === "json") {
        return new GeoJSONFileReader();
    }
    else if (fileExtension === "kml") {
        return new KMLFileReader();
    }
    else if (fileExtension === "shp") {
        return new SHPFileReader();
    }
    return null;
};
export { MapFileParserFactory };
