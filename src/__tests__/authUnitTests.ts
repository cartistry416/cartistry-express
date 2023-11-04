import express from 'express'
import request from 'supertest'
import { authRouter } from 'routes/auth-router.js'
import {UserDocument} from '../models/user-model.js'

import { MongoClient } from 'mongodb'

import { connectDB, disconnectDB} from '../db/db.js'
import {app} from '../app.js'

import cookieParser from 'cookie-parser'
import { randomBytes } from 'crypto'
const req = request(app)

let server;
describe('AuthController tests', () => {

    beforeAll(() => {
        if (!process.env.JWT_SECRET) {
            process.env.JWT_SECRET = randomBytes(32).toString('hex')
            process.env.JWT_EXPIRATION_TIME="86400"
        }
        server = app.listen(4000)
        connectDB()
    })

    afterAll(() => {
        disconnectDB()
        server.close()
    })

    describe('POST /auth/register', () => {

        it('example request to register a mocked user', async () => {
            const res = await req.post('/auth/register').send({
                userName: "DummyUser123",
                email: "DummyUser123@stonybrook.edu",
                password:"PASsWord1234!",
                passwordVerify: "PASsWord1234!"
            })
            
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
    })

})