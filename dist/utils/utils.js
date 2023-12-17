var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import archiver from 'archiver';
import { UserModel } from '../models/user-model.js';
import { promises as fs } from 'fs';
import { gfs } from '../db/db.js';
import { patch } from 'jsondiffpatch';
import AdmZip from 'adm-zip';
function findUserById(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield UserModel.findById(userId);
            if (!user) {
                return null;
            }
            return user;
        }
        catch (err) {
            return null;
        }
    });
}
function bufferToZip(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });
            const zipBuffer = [];
            archive.on('data', (chunk) => {
                zipBuffer.push(chunk);
            });
            archive.on('end', () => {
                const zipData = Buffer.concat(zipBuffer);
                resolve(zipData);
            });
            archive.append(data, { name: 'data' });
            archive.finalize();
            archive.on('error', (err) => {
                reject(err);
            });
        });
    });
}
function zipToBuffer(zipBuffer) {
    return __awaiter(this, void 0, void 0, function* () {
        const zip = new AdmZip(zipBuffer);
        const entries = zip.getEntries();
        const buffers = [];
        entries.forEach((entry) => {
            buffers.push(entry.getData());
        });
        return Buffer.concat(buffers);
    });
}
function zipToDisk(path, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs.writeFile(path, data);
            return true;
        }
        catch (err) {
            console.error("Unable to write zip file to disk: " + err);
            return false;
        }
    });
}
function diskToZipBuffer(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fs.readFile(path);
    });
}
function zipToGridFS(id, name, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const writeStream = gfs.openUploadStreamWithId(id, name, { contentType: "zip" });
        writeStream.end(data);
        return new Promise((resolve, reject) => {
            writeStream.on('close', () => {
                resolve();
            });
            writeStream.on('error', (err) => {
                reject(err);
            });
        });
    });
}
function gridFSToZip(name) {
    return __awaiter(this, void 0, void 0, function* () {
        const readStream = gfs.openDownloadStreamByName(name);
        const bufferArray = [];
        readStream.on('data', chunk => {
            bufferArray.push(chunk);
        });
        return new Promise((resolve, reject) => {
            readStream.on('end', () => {
                resolve(Buffer.concat(bufferArray));
            });
            readStream.on('error', err => {
                reject(err);
            });
        });
    });
}
function zipToGridFSOverwrite(id, name, zipData) {
    return __awaiter(this, void 0, void 0, function* () {
        yield new Promise((resolve, reject) => {
            gfs.delete(id, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
        yield zipToGridFS(id, name, zipData);
    });
}
function patchGeoJSON(geoJSON, delta) {
    return __awaiter(this, void 0, void 0, function* () {
        const editedGeoJSON = patch(geoJSON, delta);
        // console.log(editedGeoJSON)
        // after performing patch, compress JSON to zip in order to store in GridFS
        return yield bufferToZip(Buffer.from(JSON.stringify(editedGeoJSON)));
    });
}
export { bufferToZip, findUserById, zipToDisk, diskToZipBuffer, zipToGridFS, gridFSToZip, patchGeoJSON, zipToBuffer, zipToGridFSOverwrite };
