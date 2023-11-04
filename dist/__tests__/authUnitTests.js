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
const req = request(app);
let server;
describe('AuthController tests', () => {
    beforeAll(() => {
        if (!process.env.JWT_SECRET) {
            process.env.JWT_SECRET = randomBytes(32).toString('hex');
            process.env.JWT_EXPIRATION_TIME = "86400";
        }
        server = app.listen(4000);
        connectDB();
    });
    afterAll(() => {
        disconnectDB();
        server.close();
    });
    describe('POST /auth/register', () => {
        it('example request to register a mocked user', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield req.post('/auth/register').send({
                userName: "DummyUser123",
                email: "DummyUser123@stonybrook.edu",
                password: "PASsWord1234!",
                passwordVerify: "PASsWord1234!"
            });
            expect(res.status).toBe(200);
        }));
    });
    describe('POST /auth/login followed by GET /auth/loggedIn followed by GET /auth/logout', () => {
        let cookies = null;
        it('example request to login the newly created registered user', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield req.post('/auth/login').send({
                email: "DummyUser123@stonybrook.edu",
                password: "PASsWord1234!"
            });
            expect(res.status).toBe(200);
            // const token = res.coo
            cookies = res.headers['set-cookie'];
        }));
        it('example request to verify that the user has logged in using a JWT (no need to login again)', () => __awaiter(void 0, void 0, void 0, function* () {
            if (!cookies) {
                throw new Error('Cookies not available from the previous response');
            }
            const res = yield req.get('/auth/loggedIn').set('Cookie', cookies);
            expect(res.status).toBe(200);
        }));
        it('example request to logout the logged in user', () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield req.get('/auth/logout');
            expect(res.status).toBe(200);
        }));
    });
});
