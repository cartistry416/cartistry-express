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
import { bufferToZip } from '../utils/utils.js';
import { promises as fs } from 'fs';
import * as gjv from 'geojson-validation';
const path = require('path');
const req = request(app);
let server;
describe('MapsController tests', () => {
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
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield disconnectDB();
        server.close();
    }));
    describe('MapsController unit tests', () => {
        let res;
        let mapMetadataId;
        let mapDataId;
        it('Uploads GeoJSON Map', () => __awaiter(void 0, void 0, void 0, function* () {
            const mapData = yield fs.readFile(path.join(__dirname, '../../examples/australia.json'));
            const zipData = yield bufferToZip(mapData);
            res = yield req.post('/maps-api/maps/upload').field('fileExtension', 'json').field('title', 'australia json').field('templateType', 'heat')
                .attach('zipFile', zipData, 'data.zip').set('Cookie', token);
            expect(res.status).toBe(200);
            mapMetadataId = res.body.mapMetadataId;
            mapDataId = res.body.mapDataId;
        }), 20000);
        it('exports as geoJSON', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield req.get(`/maps-api/maps/${mapMetadataId}/export`);
            expect(res.status).toBe(200);
            const errors = gjv.valid(res.body.geoJSON, true);
            expect(errors.length).toBe(0);
        }), 20000);
        it('Uploads kml Map', () => __awaiter(void 0, void 0, void 0, function* () {
            const mapData = yield fs.readFile(path.join(__dirname, '../../examples/US.kml'));
            const zipData = yield bufferToZip(mapData);
            res = yield req.post('/maps-api/maps/upload').field('fileExtension', 'kml').field('title', 'us kml').field('templateType', 'bin')
                .attach('zipFile', zipData, 'data.zip').set('Cookie', token);
            expect(res.status).toBe(200);
        }), 20000);
        it('Uploads shp Map', () => __awaiter(void 0, void 0, void 0, function* () {
            const mapData = yield fs.readFile(path.join(__dirname, '../../examples/USA_adm.zip'));
            console.log(mapData.length);
            res = yield req.post('/maps-api/maps/upload').field('fileExtension', 'shp').field('title', 'us shp').field('templateType', 'cadastral')
                .attach('zipFile', mapData, 'data.zip').set('Cookie', token);
            expect(res.status).toBe(200);
        }), 20000);
        it('Forks the original geoJSON map', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield req.post(`/maps-api/maps/${mapMetadataId}/fork`).set('Cookie', token);
            expect(res.status).toBe(200);
            res = yield req.get('/maps-api/maps/map-metadata').set('Cookie', token);
            expect(res.body.mapMetadataIds.length).toBe(4);
        }));
        it('Updates the privacy status to public for original geoJSON map', () => __awaiter(void 0, void 0, void 0, function* () {
            res = yield req.put(`/maps-api/maps/${mapMetadataId}/update-privacy`).set('Cookie', token);
            expect(res.status).toBe(200);
            expect(res.body.isPrivated).toBe(false);
            res = yield req.get(`/maps-api/maps/public-map-metadata/${userId}`);
            expect(res.status).toBe(200);
            expect(res.body.mapMetadataIds.length).toBe(1);
            res = yield req.get('/maps-api/maps/map-metadata').set('Cookie', token);
            expect(res.body.mapMetadataIds.length).toBe(4);
        }));
    });
});
