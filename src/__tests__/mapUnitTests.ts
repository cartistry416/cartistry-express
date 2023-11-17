import request from 'supertest'
import { connectDB, disconnectDB} from '../db/db.js'
import {app} from '../app.js'

import { randomBytes } from 'crypto'
import { bufferToZip, zipToBuffer } from '../utils/utils.js'
import { promises as fs, stat } from 'fs'


import path from 'path'

const req = request(app)

let server;
describe('MapsController tests', () => {
    const testPath = path.join(__dirname, `../../GeoJSONZipFilesTest`)
    let token = null;
    let res = null;
    let userId;

    beforeAll(async () => {
        if (!process.env.JWT_SECRET) {
            process.env.JWT_SECRET = randomBytes(32).toString('hex')
            process.env.JWT_EXPIRATION_TIME="86400"
        }
        server = app.listen(4000)
        await connectDB()
        res = await req.post('/auth/register').send({
            userName: "DummyUser123",
            email: "DummyUser123@stonybrook.edu",
            password:"PASsWord1234!",
            passwordVerify: "PASsWord1234!"
        })
        expect(res.status).toBe(200)
        res = await req.post('/auth/login').send({
            email: "DummyUser123@stonybrook.edu",
            password:"PASsWord1234!"
        })
        expect(res.status).toBe(200)
        token = res.headers['set-cookie']
        userId = res.body.user.userId
        
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
    })

    afterAll(async () => {
        await disconnectDB()
        server.close()

        // try {
        //     await fs.rm(testPath, { recursive: true })
        
        // }
        // catch (err) {
        //     console.error("Unable to remove temp directory used for unit tests: " + err)
        // }

    })


    describe('MapsController unit tests', () => {

        let res;
        let mapMetadataId;
        let mapDataId
        it('Uploads GeoJSON Map', async () => {
            const mapData = await fs.readFile(path.join(__dirname, '../../examples/australia.json'))
            const zipData = await bufferToZip(mapData)
            res = await req.post('/maps-api/maps/upload').field('fileExtension', 'json').field('title', 'australia json').field('templateType', 'heat')
            .attach('zipFile', zipData, 'data.zip').set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.mapMetadata).toBeDefined()
            mapMetadataId = res.body.mapMetadata._id
            mapDataId = res.body.mapDataId
        }, 20000)

        it('Can get geoJSON zip data', async () => {
            res = await req.get(`/maps-api/maps/${mapMetadataId}`).set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.length).toBeGreaterThan(0)
            let geoJSON = await zipToBuffer(Buffer.from(res.body))
            expect(JSON.parse(geoJSON.toString())).toBeDefined()
        })

        it('Uploads kml Map', async () => {
            const mapData = await fs.readFile(path.join(__dirname, '../../examples/US.kml'))
            const zipData = await bufferToZip(mapData)
            res = await req.post('/maps-api/maps/upload').field('fileExtension', 'kml').field('title', 'us kml').field('templateType', 'bin')
            .attach('zipFile', zipData, 'data.zip').set('Cookie', token)
            expect(res.status).toBe(200)

        }, 20000)

        it('Forks the original geoJSON map', async () => {
            res = await req.post(`/maps-api/maps/${mapMetadataId}/fork`).set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.mapMetadata).toBeDefined()
            res = await req.get('/maps-api/maps/map-metadata').set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.mapMetadatas.length).toBe(3)
        })

        it('Updates the privacy status to public for original geoJSON map', async () => {
            res = await req.put(`/maps-api/maps/${mapMetadataId}/update-privacy`).set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.isPrivated).toBe(false)
            
            res = await req.put(`/maps-api/maps/${mapMetadataId}/favorite`).set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.ownerFavorited).toBe(true)

            const newTitle = "NEW TITLE"
            res = await req.put(`/maps-api/maps/${mapMetadataId}/rename`).send({title: newTitle}).set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.title).toBe(newTitle)

            res = await req.get(`/maps-api/maps/public-map-metadata/${userId}`)
            expect(res.status).toBe(200)
            expect(res.body.mapMetadatas.length).toBe(1)

            res = await req.get('/maps-api/maps/map-metadata').set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.mapMetadatas.length).toBe(3)
        })

        it('exports as geoJSON', async () => {
            res = await req.get(`/maps-api/maps/${mapMetadataId}/export`)
            expect(res.status).toBe(200)
            expect(res.body.length).toBeGreaterThan(0)
            let geoJSON = await zipToBuffer(Buffer.from(res.body))
            expect(JSON.parse(geoJSON.toString())).toBeDefined()
        }, 20000) 

        it('deletes original geoJSON map', async () => {
            res = await req.delete(`/maps-api/maps/${mapMetadataId}`).set('Cookie', token)
            expect(res.status).toBe(200)

            res = await req.get(`/maps-api/maps/public-map-metadata/${userId}`)
            expect(res.status).toBe(200)
            expect(res.body.mapMetadatas.length).toBe(0)

            res = await req.get('/maps-api/maps/map-metadata').set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.mapMetadatas.length).toBe(2)
        })


        // it('Uploads shp Map', async () => {
        //     const mapData = await fs.readFile(path.join(__dirname, '../../examples/USA_adm.zip'))
        //     res = await req.post('/maps-api/maps/upload').field('fileExtension', 'shp').field('title', 'us shp').field('templateType', 'cadastral')
        //     .attach('zipFile', mapData, 'data.zip').set('Cookie', token)
        //     expect(res.status).toBe(200)
        // }, 60000)

    })





})
