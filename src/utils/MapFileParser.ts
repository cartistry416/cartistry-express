import shp from 'shpjs';
import * as tj from "@mapbox/togeojson";
import * as xmldom from 'xmldom'
const DOMParser = xmldom.DOMParser;
import AdmZip from 'adm-zip'
import * as gjv from 'geojson-validation'

interface MapParser {
    parse(data: Buffer): Promise<Object | Error>

}

class GeoJSONFileReader implements MapParser {
    constructor() {
    }
    async parse(data: Buffer): Promise<Object | Error> {
        const zip = new AdmZip(data)
        const zipEntries = zip.getEntries();
        if (zipEntries.length !== 1) {
           throw new Error('Expected one file in the zip archive.')
        }
        const zipEntry: string = zipEntries[0].getData().toString()
        const geoJSON = JSON.parse(zipEntry)
        const errors = gjv.valid(geoJSON, true)
        if (errors.length > 0) {
           throw new Error(`${errors.join(', ')}`)
        }
        return JSON.parse(zipEntry)
    }

}

class KMLFileReader implements MapParser {
    constructor(private domParser = new DOMParser()) {

    }
    async parse(data: Buffer): Promise<Object | Error> {
        const zip = new AdmZip(data)
        const zipEntries = zip.getEntries();
        if (zipEntries.length !== 1) {
            throw new Error('Expected one file in the zip archive.')
        }
        const zipEntry: string = zipEntries[0].getData().toString()
        return tj.kml(this.domParser.parseFromString(zipEntry, 'text/xml'))
    }

}

class SHPFileReader implements MapParser {
    constructor() {

    }
    async parse(data: Buffer): Promise<Object>  {
        let geoJSON;
        
        try {
            geoJSON = await shp.parseZip(data)
        }
        catch(err) {
            console.error("errorrrrr" + err)
        }
        return geoJSON
    }

}

const MapFileParserFactory = (fileExtension: string): MapParser | null => {

    if (fileExtension === "json") {
        return new GeoJSONFileReader()
    }
    else if (fileExtension === "kml") {
        return new KMLFileReader()
    }
    else if (fileExtension === "shp") {
        return new SHPFileReader()
    }

    return null
}

export {MapFileParserFactory}