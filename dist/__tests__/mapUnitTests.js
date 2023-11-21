var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import request from 'supertest';
import { connectDB, disconnectDB } from '../db/db.js';
import { app } from '../app.js';
import { randomBytes } from 'crypto';
import { bufferToZip, zipToBuffer } from '../utils/utils.js';
import { promises as fs } from 'fs';
import path from 'path';
const req = request(app);
let server;
describe('MapsController tests', () => {
    const testPath = path.join(__dirname, `../../GeoJSONZipFilesTest`);
    let token = null;
    let res = null;
    let userId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        if (!process.env.JWT_SECRET) {
            process.env.JWT_SECRET = randomBytes(32).toString('hex');
            process.env.JWT_EXPIRATION_TIME = "86400";
        }
        server = app.listen(4000);
        yield connectDB();
        res = yield req.post('/auth/register').send({
            userName: "DummyUser123",
            email: "DummyUser123@stonybrook.edu",
            password: "PASsWord1234!",
            passwordVerify: "PASsWord1234!"
        });
        expect(res.status).toBe(200);
        res = yield req.post('/auth/login').send({
            email: "DummyUser123@stonybrook.edu",
            password: "PASsWord1234!"
        });
        expect(res.status).toBe(200);
        token = res.headers['set-cookie'];
        userId = res.body.user.userId;
        // try {
        //     const stats = await fs.stat(testPath)
        //     if (stats.isDirectory()) {
        //     }
        // }
        // catch (err) {
        //     if (err.code === 'ENOENT') {
        //         await fs.mkdir(testPath) 
        //     }
        // }
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield disconnectDB();
        server.close();
        // try {
        //     await fs.rm(testPath, { recursive: true })
        // }
        // catch (err) {
        //     console.error("Unable to remove temp directory used for unit tests: " + err)
        // }
    }));
    describe('MapsController unit tests', () => {
        let res;
        let mapMetadataId;
        let mapDataId;
        it('Uploads GeoJSON Map', () => __awaiter(void 0, void 0, void 0, function* () {
            const mapData = yield fs.readFile(path.join(__dirname, '../../examples/australia.json'));
            const zipData = yield bufferToZip(mapData);
            res = yield req.post('/maps-api/maps/upload')
                .field('fileExtension', 'json')
                .field('title', 'australia json')
                .field('templateType', 'heat')
                .attach('zipFile', zipData, 'data.zip').set('Cookie', token);
            expect(res.status).toBe(200);
            expect(res.body.mapMetadata).toBeDefined();
            mapMetadataId = res.body.mapMetadata._id;
            mapDataId = res.body.mapDataId;
        }), 20000);
        it('Can get geoJSON zip data', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield req.get(`/maps-api/maps/${mapMetadataId}`).set('Cookie', token);
            expect(res.status).toBe(200);
            expect(res.body.length).toBeGreaterThan(0);
            let geoJSON = yield zipToBuffer(Buffer.from(res.body));
            expect(JSON.parse(geoJSON.toString())).toBeDefined();
        }));
        it('Uploads kml Map', () => __awaiter(void 0, void 0, void 0, function* () {
            const mapData = yield fs.readFile(path.join(__dirname, '../../examples/US.kml'));
            const zipData = yield bufferToZip(mapData);
            res = yield req.post('/maps-api/maps/upload').field('fileExtension', 'kml').field('title', 'us kml').field('templateType', 'bin')
                .attach('zipFile', zipData, 'data.zip').set('Cookie', token);
            expect(res.status).toBe(200);
        }), 20000);
        it('Forks the original geoJSON map', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield req.post(`/maps-api/maps/${mapMetadataId}/fork`).set('Cookie', token);
            expect(res.status).toBe(200);
            expect(res.body.mapMetadata).toBeDefined();
            res = yield req.get('/maps-api/maps/map-metadata').set('Cookie', token);
            expect(res.status).toBe(200);
            expect(res.body.mapMetadatas.length).toBe(3);
        }));
        it('Updates the privacy status to public for original geoJSON map', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield req.put(`/maps-api/maps/${mapMetadataId}/update-privacy`).set('Cookie', token);
            expect(res.status).toBe(200);
            expect(res.body.isPrivated).toBe(false);
            res = yield req.put(`/maps-api/maps/${mapMetadataId}/favorite`).set('Cookie', token);
            expect(res.status).toBe(200);
            expect(res.body.ownerFavorited).toBe(true);
            const newTitle = "NEW TITLE";
            res = yield req.put(`/maps-api/maps/${mapMetadataId}/rename`).send({ title: newTitle }).set('Cookie', token);
            expect(res.status).toBe(200);
            expect(res.body.title).toBe(newTitle);
            res = yield req.get(`/maps-api/maps/public-map-metadata/${userId}`);
            expect(res.status).toBe(200);
            expect(res.body.mapMetadatas.length).toBe(1);
            res = yield req.get('/maps-api/maps/map-metadata').set('Cookie', token);
            expect(res.status).toBe(200);
            expect(res.body.mapMetadatas.length).toBe(3);
        }));
        it('exports as geoJSON', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield req.get(`/maps-api/maps/${mapMetadataId}/export`);
            expect(res.status).toBe(200);
            expect(res.body.length).toBeGreaterThan(0);
            let geoJSON = yield zipToBuffer(Buffer.from(res.body));
            expect(JSON.parse(geoJSON.toString())).toBeDefined();
        }), 20000);
        it('deletes original geoJSON map', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield req.delete(`/maps-api/maps/${mapMetadataId}`).set('Cookie', token);
            expect(res.status).toBe(200);
            res = yield req.get(`/maps-api/maps/public-map-metadata/${userId}`);
            expect(res.status).toBe(200);
            expect(res.body.mapMetadatas.length).toBe(0);
            res = yield req.get('/maps-api/maps/map-metadata').set('Cookie', token);
            expect(res.status).toBe(200);
            expect(res.body.mapMetadatas.length).toBe(2);
        }));
        // it('Uploads shp Map', async () => {
        //     const mapData = await fs.readFile(path.join(__dirname, '../../examples/USA_adm.zip'))
        //     res = await req.post('/maps-api/maps/upload').field('fileExtension', 'shp').field('title', 'us shp').field('templateType', 'cadastral')
        //     .attach('zipFile', mapData, 'data.zip').set('Cookie', token)
        //     expect(res.status).toBe(200)
        // }, 60000)
    });
});
