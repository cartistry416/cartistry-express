import { app } from '../app';
import request from 'supertest';
// const app = require('../app')
// const request = require('supertest')
let server;
describe("Test the root path", () => {
    beforeAll(() => {
        server = app.listen(4000);
    });
    test("It should response the GET method", (done) => {
        request(app)
            .get("/")
            .expect(200)
            .end(done);
    });
    afterAll((done) => {
        // Close the server after all tests are complete
        server.close(done);
    });
});
