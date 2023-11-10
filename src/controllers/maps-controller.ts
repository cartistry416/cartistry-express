import { UserModel, UserDocument } from '../models/user-model.js'
import { PostModel, PostDocument } from '../models/post-model.js'
import { MapMetadataModel, MapMetadataDocument } from '../models/mapMetadata-model.js'
import { MapDataModel, MapDataDocument } from '../models/mapData-model.js'

import mongoose from 'mongoose'
import {MapFileParserFactory} from '../utils/MapFileParser.js'
import { bufferToZip, zipToGridFS, gridFSToZip} from '../utils/utils.js'
import { findUserById } from '../utils/utils.js'

// import path from 'path'
// const __dirname = path.resolve();
// const geoJSONZipPath = path.join(__dirname, `/GeoJSONZipFiles${process.env.NODE_ENV === 'test' ? 'Test': ""}`)

import {Request, Response} from 'express'


const uploadMap = async (req, res) => {

    const body = req.body
    // console.log(body)
    if (!body|| !body.fileExtension) {
        return res.status(400).json({sucess: false, errorMessage: "Body is missing file extension"})
    }

    if (!req.file) {
        return res.status(400).json({sucess: false, errorMessage: "No file attached"})
    }

    if (!body.title) {
        return res.status(400).json({sucess: false, errorMessage: "Body is missing title"})
    }
    const validTemplates: Object = {
        heat: "heat",
        landmark: "landmark",
        cadastral: "cadastral",
        subway: "subway",
        bin: "bin"
    }
    if (!validTemplates.hasOwnProperty(body.templateType)) {
        return res.status(400).json({sucess: false, errorMessage: "Body is missing template type or one provided is incorrect"})
    }

    const user = await findUserById(req.userId)
    if (!user) {
        return res.status(500).json({success: false, errorMessage: "Unable to find user"})
    }

    let geoJSONZip;
    const mapFileParser = MapFileParserFactory(body.fileExtension)
    if (!mapFileParser) {
        return res.status(400).json({sucess: false, errorMessage: "Unsupported file extension!"})
    }
    try {
        const geoJSON: Buffer = await mapFileParser.parse(req.file.buffer)
        geoJSONZip = await bufferToZip(geoJSON)
    }
    catch (err) {
        return res.status(400).json({sucess: false, errorMessage: "Parsing error: " + err})
    }

    try {
        const mapMetadataDocumentId = mongoose.Types.ObjectId()
        const geoJSONZipId = mongoose.Types.ObjectId().toString()
        await zipToGridFS(geoJSONZipId, geoJSONZip) 
        
        const mapDataDocument = await MapDataModel.create({geoJSONZipId, proprietaryJSON: {templateType: body.templateType}})
        const mapMetadataDocument = await MapMetadataModel.create({_id: mapMetadataDocumentId, title: body.title, owner: user._id, mapData: mapDataDocument._id})
        user.mapsMetadata.push(mapMetadataDocument._id)
        user.markModified('mapsMetadata')
        await user.save()
        return res.status(200).json({success: true, mapMetadataId: mapMetadataDocument._id, mapDataId: mapDataDocument._id})
    }
    catch (err) {
        return res.status(500).json({successs: false, errorMessage: "A lot of possible things could have went wrong: " + err})
    }
}


const forkMap = async (req, res) => {
    const user = await findUserById(req.userId)
    if (!user) {
        return res.status(500).json({success: false, errorMessage: "Unable to find user"})
    }

    try {
        const originalMapMetaDataDocument = await MapMetadataModel.findById(req.params.id)
        if (!originalMapMetaDataDocument) {
            return res.status(404).json({success: false, errorMessage: "Unable to find mapMetadata from provided id"})
        }

        let originalMapDataId = originalMapMetaDataDocument.mapData.toString()
        const originalMapDataDocument = await MapDataModel.findById(originalMapDataId)
        
        const geoJSONZip: Buffer = await gridFSToZip(originalMapDataDocument.geoJSONZipId.toString())
        if(!originalMapDataDocument) {
            return res.status(404).json({success: false, errorMessage: "Unable to find map data via id on mapMetadata"})
        }
    
        const cloneMapMetaData = originalMapMetaDataDocument
        cloneMapMetaData.owner = user._id
        cloneMapMetaData._id = mongoose.Types.ObjectId()

        const cloneMapData = originalMapDataDocument
        cloneMapData._id = mongoose.Types.ObjectId()
        cloneMapMetaData.mapData = cloneMapData._id


        const cloneGeoJSONZipId = mongoose.Types.ObjectId().toString()
        cloneMapData.geoJSONZipId = cloneGeoJSONZipId
        await zipToGridFS(cloneGeoJSONZipId, geoJSONZip)


        cloneMapData.isNew = true
        cloneMapMetaData.isNew = true

        await cloneMapData.save()
        await cloneMapMetaData.save()
        user.mapsMetadata.push(cloneMapMetaData._id)
        user.markModified('mapsMetadata')
        await user.save()



        originalMapMetaDataDocument.forks++;
        await originalMapMetaDataDocument.save()

        return res.status(200).json({success: true})
    }
    catch(err) {
        return res.status(500).json({success: false, errorMessage: "Unable to create or save something to the database OR read/write to/from gridFS " + err})
    }




}

const exportMap = async (req, res) => {

    try {
        const mapMetadataDocument = await MapMetadataModel.findById(req.params.id)
        const mapDataDocument = await MapDataModel.findById(mapMetadataDocument.mapData)
        const geoJSONZip = await gridFSToZip(mapDataDocument.geoJSONZipId)
        res.setHeader('Content-Type', 'application/octet-stream')
        res.status(200).send(geoJSONZip)
    }
    catch (err) {
        return res.status(400).json({success: false, errorMessage: 'Unable to find mapMetadata or mapData'})
    }
    
}
const getMapMetadataOwnedByUser = async (req, res) => {
    const user = await findUserById(req.userId)
    if (!user) {
        return res.status(500).json({success: false, errorMessage: "Unable to find user"})
    }
    //console.log(user.mapsMetadata.length)
    return res.status(200).json({success: true, mapMetadataIds: user.mapsMetadata})
}
const getPublicMapMetadataOwnedByUser = async (req, res) => {
    const user = await findUserById(req.params.userId)
    if (!user) {
        return res.status(500).json({success: false, errorMessage: "Unable to find user"})
    }

    const publicMapMetadataIds: string[] = []
    for (let i=0; i<user.mapsMetadata.length; i++) {
        const mapMetadataId = user.mapsMetadata[i]
        const mapMetaDataDocument = await MapMetadataModel.findById(mapMetadataId)
        if (!mapMetaDataDocument) {
            console.error('Something went wrong, could not find mapMetadata document from users array of metadata ids')
            continue
        }
        else if (!mapMetaDataDocument.isPrivated) {
            publicMapMetadataIds.push(mapMetadataId.toString())
        }
    }
    //console.log(publicMapMetadataIds.length)
    return res.status(200).json({success: true, mapMetadataIds: publicMapMetadataIds})

}
const getMapData = async (req, res: Response) => {

    const user = await findUserById(req.userId)
    if (!user) {
        return res.status(500).json({success: false, errorMessage: "Unable to find user"})
    }
    const mapMetadataDocument = await MapMetadataModel.findById(req.params.id)
    if (!mapMetadataDocument) {
        return res.status(404).json({success:false, errorMessage: "Unable to find mapMetadata"})
    }
    if (mapMetadataDocument.owner.toString() !== user._id.toString() && mapMetadataDocument.isPrivated) {
        console.error(`${mapMetadataDocument.owner } !== ${user._id}`)
        return res.status(401).json({success:false, errorMessage: "Not authorized to get this map data"})
    }
    const mapDataDocument = await MapDataModel.findById(mapMetadataDocument.mapData)
    
    if(!mapDataDocument) {
        return res.status(404).json({success:false, errorMessage: "Unable to find map data"})
    }

    try {
        const geoJSONZip = await gridFSToZip(mapDataDocument.geoJSONZipId)
        res.setHeader('Content-Type', 'application/octet-stream')
        res.status(200).send(geoJSONZip)
    }
    catch (err) {
        console.error("Unable to read zip file from gridfs: " + err)
        return res.status(500).json({success: false, errorMessage: "Unable to read zip file from gridfs"})
    }
}
const updateMapPrivacy = async (req, res) => {
    const user = await findUserById(req.userId)
    if (!user) {
        return res.status(500).json({success: false, errorMessage: "Unable to find user"})
    }
    const mapMetadata = await MapMetadataModel.findById(req.params.id)
    if (!mapMetadata) {
        return res.status(404).json({success:false, errorMessage: "Unable to find mapMetadata"})
    }
    if (mapMetadata.owner.toString() !== user._id.toString()) {
        console.log(`${mapMetadata.owner } !== ${user._id}`)
        return res.status(401).json({success:false, errorMessage: "Not authorized to change privacy status of this map metadata"})
    }

    mapMetadata.isPrivated = !mapMetadata.isPrivated 
    
    try {      
        await mapMetadata.save()
        return res.status(200).json({success: true, isPrivated: mapMetadata.isPrivated})
    }
    catch (err) {
        return res.status(500).json({success:false, errorMessage: "Unable to find mapMetadata"})
    } 

}
const saveMapEdits = async (req, res: Response) => {
    
}
const publishMap = async (req, res: Response) => {

    const body = req.body
    if (!body || !body.title || !body.textContent || !body.tags) {
        return res.status(400).json({
            success: false,
            error: 'You must provide title and textContent and tags in body',
        })
    }
    const user = await findUserById(req.userId)

    if (!user) {
        return res.status(500).json({success: false, errorMessage: "Unable to find user"})
    }
    const mapId = req.params.id

    try {
        await MapMetadataModel.findByIdAndUpdate(mapId, {isPrivated: false})

        const post = await PostModel.create({owner: req.userId, 
                                            ownerUserName: user.userName, 
                                            title: body.title, 
                                            textContent: body.textContent, 
                                            mapMetadata: mapId,
                                            tags: body.tags})
        if (!post) {
            return res.status(500).json({ success: false, errorMessage: "Unable to create post"})
        }
        return res.status(200).json({success:true, postId: post._id})
    }
    catch (err) {
        return res.status(500).json({ success: false, errorMessage: "Unable to create post because " + err})
    }


}

const favoriteMap = async (req, res: Response) => {
    const user = await findUserById(req.userId)

    if (!user) {
        return res.status(500).json({success: false, errorMessage: "Unable to find user"})
    }
    const mapId = req.params.id

    try {
        const mapMetaDataDocument = await MapMetadataModel.findById(mapId)
        if(mapMetaDataDocument.owner.toString() !== user._id.toString()) {
            return res.status(401).json({success:false, errorMessage:"Unauthorized to edit favorited for this map"})
        }
        mapMetaDataDocument.ownerFavorited = !mapMetaDataDocument.ownerFavorited
        await mapMetaDataDocument.save()
        return res.status(200).json({success: true, ownerFavorited: mapMetaDataDocument.ownerFavorited})
    }
    catch (err) {
        return res.status(500).json({success: false, errorMessage: "Unable to edit favorited because " + err})
    }
}

const renameMap = async (req, res: Response) => {

    const body = req.body
    if (!body || !body.title) {
        return res.status(400).json({success: false, errorMessage: "Must provide title in body"})
    }

    const user = await findUserById(req.userId)

    if (!user) {
        return res.status(500).json({success: false, errorMessage: "Unable to find user"})
    }
    const mapId = req.params.id

    try {
        const mapMetaDataDocument = await MapMetadataModel.findById(mapId)
        if(mapMetaDataDocument.owner.toString() !== user._id.toString()) {
            return res.status(401).json({success:false, errorMessage:"Unauthorized to edit title for this map"})
        }
        mapMetaDataDocument.title = body.title
        await mapMetaDataDocument.save()
        return res.status(200).json({success: true, title: mapMetaDataDocument.title})
    }
    catch (err) {
        return res.status(500).json({success: false, errorMessage: "Unable to edit title because " + err})
    }

}

const deleteMap = async (req, res: Response) => {
    const user = await findUserById(req.userId)

    if (!user) {
        return res.status(500).json({success: false, errorMessage: "Unable to find user"})
    }

    try {
        const mapMetaDataDocument = await MapMetadataModel.findById(req.params.id)
        if(mapMetaDataDocument.owner.toString() !== user._id.toString()) {
            return res.status(401).json({success:false, errorMessage:"Unauthorized to edit title for this map"})
        }

        const mapMetaDataDocumentId: string = mapMetaDataDocument._id.toString()
        const mapDataDocumentId = mapMetaDataDocument.mapData

        const idx = user.mapsMetadata.findIndex(id => id.toString() === mapMetaDataDocumentId)

        if (idx >= 0) {
            user.mapsMetadata.splice(idx, 1)
            user.markModified('mapsMetadata')
            await user.save()
            await mapMetaDataDocument.remove()
            await MapDataModel.findByIdAndRemove(mapDataDocumentId)
            return res.status(200).json({success:true})
        }
        else {
            return res.status(500).json({success: false, errorMessage: "Couldn't find mapsMetadataId on user"})
        }
    }
    catch (err) {
        return res.status(500).json({success: false, errorMessage: "Unable to delete map because " + err})
    }
}


const MapsController = {
    uploadMap,
    renameMap,
    forkMap,
    exportMap,
    favoriteMap,
    deleteMap,
    updateMapPrivacy,
    saveMapEdits,
    publishMap,
    getMapMetadataOwnedByUser,
    getPublicMapMetadataOwnedByUser,
    getMapData
}

export {MapsController}