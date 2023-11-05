import { UserModel, UserDocument } from '../models/user-model.js'
import { PostModel, PostDocument } from '../models/post-model.js'
import { MapMetadataModel, MapMetadataDocument } from '../models/mapMetadata-model.js'
import { MapDataModel, MapDataDocument } from '../models/mapData-model.js'

import mongoose from 'mongoose'
import {MapFileParserFactory} from '../utils/MapFileParser.js'
import { findUserById } from '../utils/utils.js'

const uploadMap = async (req, res) => {

    const body = req.body
    if (!body || !req.file || !body.fileExtension) {
        return res.status(400).json({sucess: false, errorMessage: "Body is missing file or file extension"})
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

    let geoJSON: Object;
    const mapFileParser = MapFileParserFactory(body.fileExtension)
    if (!mapFileParser) {
        return res.status(400).json({sucess: false, errorMessage: "Unsupported file extension!"})
    }
    try {
        const zipFileBuffer = req.file.buffer
        console.log(zipFileBuffer.length)
        geoJSON = await mapFileParser.parse(zipFileBuffer)
    }
    catch (err) {
        return res.status(400).json({sucess: false, errorMessage: "Parsing error: " + err})
    }

    try {
        const mapDataDocument = await MapDataModel.create({geoJSON, proprietaryJSON: {templateType: body.templateType}})
        const mapMetadataDocument = await MapMetadataModel.create({title: body.title, owner: user._id, mapData: mapDataDocument._id})
        user.mapsMetadata.push(mapMetadataDocument._id)
        user.markModified('mapsMetadata')
        await user.save()
        return res.status(200).json({success: true, mapMetadataId: mapMetadataDocument._id, mapDataId: mapDataDocument._id})
    }
    catch (err) {
        console.error(`this is prob where it errors lol ` + err)
        return res.status(500).json({successs: false, errorMessage: "bad stuff"})
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
        let mapDataIdQuery = originalMapMetaDataDocument.mapData.toString()
        const originalMapDataDocument = await MapDataModel.findById(mapDataIdQuery)
        if(!originalMapDataDocument) {
            return res.status(404).json({success: false, errorMessage: "Unable to find map data via id on mapMetadata"})
        }
    
        const cloneMapMetaData = originalMapMetaDataDocument
        cloneMapMetaData.owner = user._id
        cloneMapMetaData._id = mongoose.Types.ObjectId()

        const cloneMapData = originalMapDataDocument
        cloneMapData._id = mongoose.Types.ObjectId()
        cloneMapMetaData.mapData = cloneMapData._id

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
        return res.status(500).json({success: false, errorMessage: "Unable to create or save something to the database " + err})
    }




}

const exportMap = async (req, res) => {

    try {
        const mapMetadataDocument = await MapMetadataModel.findById(req.params.id)
        const mapDataDocument = await MapDataModel.findById(mapMetadataDocument.mapData)
        const geoJSON = mapDataDocument.geoJSON
        return res.status(200).json({success: true, geoJSON})
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

    return res.status(200).json({success: true, mapMetadataIds: publicMapMetadataIds})

}
const getMapData = async (req, res) => {
    
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
const saveMapEdits = async (req, res) => {
    
}
const publishMap = async (req, res) => {
    
}



const favoriteMap = async (req, res) => {
    
}
const renameMap = async (req, res) => {
    
}

const deleteMap = async (req, res) => {
    
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