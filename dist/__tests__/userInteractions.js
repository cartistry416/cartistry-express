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
import path from 'path';
const req = request(app);
let server;
describe('Set of tests involving user interactions', () => {
    let userToken1 = null;
    let userID1 = null;
    let userToken2 = null;
    let userID2 = null;
    let res = null;
    let mapMetadataId;
    let mapDataId;
    let postId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        if (!process.env.JWT_SECRET) {
            process.env.JWT_SECRET = randomBytes(32).toString('hex');
            process.env.JWT_EXPIRATION_TIME = "86400";
        }
        server = app.listen(4000);
        yield connectDB();
        res = yield req.post('/auth/register').send({
            userName: "Alice",
            email: "alice@gmail.com",
            password: "PASsWord1234!",
            passwordVerify: "PASsWord1234!"
        });
        expect(res.status).toBe(200);
        res = yield req.post('/auth/login').send({
            email: "alice@gmail.com",
            password: "PASsWord1234!"
        });
        expect(res.status).toBe(200);
        userToken1 = res.headers['set-cookie'];
        userID1 = res.body.user.userId;
        res = yield req.post('/auth/register').send({
            userName: "Bob",
            email: "bob@gmail.com",
            password: "PASsWord1234!",
            passwordVerify: "PASsWord1234!"
        });
        expect(res.status).toBe(200);
        res = yield req.post('/auth/login').send({
            email: "bob@gmail.com",
            password: "PASsWord1234!"
        });
        expect(res.status).toBe(200);
        userToken2 = res.headers['set-cookie'];
        userID2 = res.body.user.userId;
    }));
    afterAll(() => {
        disconnectDB();
        server.close();
    });
    it('Alice uploads a map, Bob cannot retrieve it', () => __awaiter(void 0, void 0, void 0, function* () {
        const mapData = yield fs.readFile(path.join(__dirname, '../../examples/australia.json'));
        const zipData = yield bufferToZip(mapData);
        res = yield req.post('/maps-api/maps/upload')
            .field('fileExtension', 'json')
            .field('title', 'australia json')
            .field('templateType', 'heat')
            .attach('zipFile', zipData, 'data.zip').set('Cookie', userToken1);
        expect(res.status).toBe(200);
        expect(res.body.mapMetadata).toBeDefined();
        mapMetadataId = res.body.mapMetadata._id;
        mapDataId = res.body.mapDataId;
        res = yield req.get(`/maps-api/maps/${mapMetadataId}`).set('Cookie', userToken2);
        expect(res.status).toBe(401);
        res = yield req.get(`/maps-api/maps/${mapMetadataId}/export`).set('Cookie', userToken2);
        expect(res.status).toBe(401);
        res = yield req.get(`/maps-api/maps/single-map-metadata/${mapMetadataId}`);
        expect(res.status).toBe(401);
        res = yield req.post(`/maps-api/maps/${mapMetadataId}/fork`).set('Cookie', userToken2);
        expect(res.status).toBe(401);
    }));
    it('Alice publishes the map by creating a post', () => __awaiter(void 0, void 0, void 0, function* () {
        const title = 'TEST POST TITLE';
        const textContent = 'Lorem Ipsum something something';
        const tags = "tag1,tag2,tag3";
        res = yield req.post('/posts-api/posts')
            .send({
            title,
            textContent,
            tags,
            mapMetadataId
        })
            .set('Cookie', userToken1);
        expect(res.status).toBe(200);
        postId = res.body.postId;
        res = yield req.get(`/posts-api/posts/${postId}`);
        expect(res.status).toBe(200);
        const post = res.body.post;
        expect(mapMetadataId).toBe(post.mapMetadata);
    }));
    it('Bob is now authorized to perform the actions he could not previously, e.g. fork or export', () => __awaiter(void 0, void 0, void 0, function* () {
        res = yield req.get(`/maps-api/maps/${mapMetadataId}`).set('Cookie', userToken2);
        expect(res.status).toBe(200);
        res = yield req.get(`/maps-api/maps/${mapMetadataId}/export`).set('Cookie', userToken2);
        expect(res.status).toBe(200);
        res = yield req.get(`/maps-api/maps/single-map-metadata/${mapMetadataId}`);
        expect(res.status).toBe(200);
        res = yield req.post(`/maps-api/maps/${mapMetadataId}/fork`).set('Cookie', userToken2);
        expect(res.status).toBe(200);
    }));
    it('commenting on created post', () => __awaiter(void 0, void 0, void 0, function* () {
        const comment = "HELLO I AM COMMENTING, COOL MAP!!";
        res = yield req.put(`/posts-api/posts/${postId}/comment`).send({ comment }).set('Cookie', userToken2);
        expect(res.status).toBe(200);
        expect(res.body.comments[0].comment).toBe(comment);
    }));
    it('deleting comment', () => __awaiter(void 0, void 0, void 0, function* () {
        res = yield req.delete(`/posts-api/posts/${postId}/comment`).send({ index: 0 }).set('Cookie', userToken2);
        expect(res.status).toBe(200);
        expect(res.body.comments.length).toBe(0);
    }));
    it('like the post', () => __awaiter(void 0, void 0, void 0, function* () {
        res = yield req.put(`/posts-api/posts/${postId}/likes`).set('Cookie', userToken2);
        expect(res.status).toBe(200);
    }));
});
