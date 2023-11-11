/*
    This is where we'll route all of the received http requests
    into controller response functions.
    
    @author McKilla Gorilla
*/
// const express = require('express')
import express from 'express'

import {MapsController} from '../controllers/maps-controller.js'
const mapsRouter = express.Router()
import auth from '../auth/auth.js'

import multer from 'multer'
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
mapsRouter.post('/maps/upload', auth.verify, upload.single('zipFile'), MapsController.uploadMap)

mapsRouter.get('/maps/:id/export', MapsController.exportMap)
mapsRouter.get('/maps/map-metadata', auth.verify, MapsController.getMapMetadataOwnedByUser)
mapsRouter.get('/maps/public-map-metadata/:userId', MapsController.getPublicMapMetadataOwnedByUser)
mapsRouter.get('/maps/:id', auth.verify, MapsController.getMapData)


mapsRouter.post('/maps/upload', auth.verify, upload.single('zipFile'), MapsController.uploadMap)
mapsRouter.post('/maps/:id/fork', auth.verify, MapsController.forkMap)
mapsRouter.post('/maps/:id/publish', auth.verify, MapsController.publishMap)


mapsRouter.put('/maps/:id/favorite', auth.verify, MapsController.favoriteMap)
mapsRouter.put('/maps/:id/save', auth.verify, MapsController.saveMapEdits)
mapsRouter.put('/maps/:id/rename', auth.verify, MapsController.renameMap)
mapsRouter.put('/maps/:id/update-privacy', auth.verify, MapsController.updateMapPrivacy)

mapsRouter.delete('/maps/:id', auth.verify, MapsController.deleteMap)

export {mapsRouter}

// module.exports = mapsRouter
// const mapsmapsRouter = mapsRouter
// export {mapsmapsRouter}