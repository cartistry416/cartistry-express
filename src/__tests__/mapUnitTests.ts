import request from 'supertest'
import { connectDB, disconnectDB} from '../db/db.js'
import {app} from '../app.js'

import { randomBytes } from 'crypto'
import { bufferToZip } from '../utils/utils.js'
import { promises as fs } from 'fs'

import * as gjv from 'geojson-validation'
const path = require('path');

const req = request(app)

let server;
describe('MapsController tests', () => {

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
    })

    afterAll(async () => {
        await disconnectDB()
        server.close()
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
            mapMetadataId = res.body.mapMetadataId
            mapDataId = res.body.mapDataId
        }, 20000)
        
        it('exports as geoJSON', async () => {
            res = await req.get(`/maps-api/maps/${mapMetadataId}/export`)
            expect(res.status).toBe(200)
            const errors = gjv.valid(res.body.geoJSON, true)
            expect(errors.length).toBe(0)
        }, 20000) 

        it('Uploads kml Map', async () => {
            const mapData = await fs.readFile(path.join(__dirname, '../../examples/US.kml'))
            const zipData = await bufferToZip(mapData)
            res = await req.post('/maps-api/maps/upload').field('fileExtension', 'kml').field('title', 'us kml').field('templateType', 'bin')
            .attach('zipFile', zipData, 'data.zip').set('Cookie', token)
            expect(res.status).toBe(200)
        }, 20000)
        
 
        it('Uploads shp Map', async () => {
            const mapData = await fs.readFile(path.join(__dirname, '../../examples/USA_adm.zip'))
            
            console.log(mapData.length)
            res = await req.post('/maps-api/maps/upload').field('fileExtension', 'shp').field('title', 'us shp').field('templateType', 'cadastral')
            .attach('zipFile', mapData, 'data.zip').set('Cookie', token)
            expect(res.status).toBe(200)
        }, 20000)

        it('Forks the original geoJSON map', async () => {
            res = await req.post(`/maps-api/maps/${mapMetadataId}/fork`).set('Cookie', token)
            expect(res.status).toBe(200)
            res = await req.get('/maps-api/maps/map-metadata').set('Cookie', token)
            expect(res.body.mapMetadataIds.length).toBe(4)
        })

        it('Updates the privacy status to public for original geoJSON map', async () => {
            res = await req.put(`/maps-api/maps/${mapMetadataId}/update-privacy`).set('Cookie', token)
            expect(res.status).toBe(200)
            expect(res.body.isPrivated).toBe(false)

            res = await req.get(`/maps-api/maps/public-map-metadata/${userId}`)
            expect(res.status).toBe(200)
            expect(res.body.mapMetadataIds.length).toBe(1)

            res = await req.get('/maps-api/maps/map-metadata').set('Cookie', token)
            expect(res.body.mapMetadataIds.length).toBe(4)
        })





    })





})
