import request from 'supertest'
import { connectDB, disconnectDB} from '../db/db.js'
import {app} from '../app.js'

import { randomBytes } from 'crypto'
const req = request(app)

let server;
describe('AuthController tests', () => {

    beforeAll(async () => {
        if (!process.env.JWT_SECRET) {
            process.env.JWT_SECRET = randomBytes(32).toString('hex')
            process.env.JWT_EXPIRATION_TIME="86400"
        }
        server = app.listen(4000)
        await connectDB()
    })

    afterAll(async () => {
        await disconnectDB()
        server.close()
    })

    describe('registering', () => {

        it('example request to register a mocked user', async () => {
            const res = await req.post('/auth/register').send({
                userName: "DummyUser123",
                email: "DummyUser123@stonybrook.edu",
                password:"PASsWord1234!",
                passwordVerify: "PASsWord1234!"
            })
            //console.log(res.errorMessage)
            expect(res.status).toBe(200)
        })

    })

    describe('POST /auth/login followed by GET /auth/loggedIn followed by GET /auth/logout', () => {
        let cookies = null;
        it ('example request to login the newly created registered user', async () => {
            const res = await req.post('/auth/login').send({
                email: "DummyUser123@stonybrook.edu",
                password:"PASsWord1234!"
            })
            expect(res.status).toBe(200)
            // const token = res.coo
            cookies = res.headers['set-cookie']
        })

        it ('example request to verify that the user has logged in using a JWT (no need to login again)', async () => {
            if (!cookies) {
                throw new Error('Cookies not available from the previous response');
              }
            const res = await req.get('/auth/loggedIn').set('Cookie', cookies)
            expect(res.status).toBe(200)
        })

        it ('example request to logout the logged in user', async () => {
            const res = await req.get('/auth/logout')
            expect(res.status).toBe(200)

        })

        it ('dummy test case', async () => {
            const res = await req.post('/auth/register').send({
                userName: "messi",
                email: "messi@stonybrook.edu",
                password:"PASsWord1234!",
                passwordVerify: "PASsWord1234!"
            })
            expect(res.status).toBe(200)
        })

    })

})