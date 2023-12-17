
import archiver from 'archiver';
import {UserModel, UserDocument} from '../models/user-model.js'
import { promises as fs } from 'fs'
import {gfs} from '../db/db.js'
import {Delta, patch} from 'jsondiffpatch'
import AdmZip from 'adm-zip'

async function findUserById(userId: string): Promise<UserDocument | null> {
  try {
    const user = await UserModel.findById(userId)
    if (!user) {
      return null;
    }
    return user;
  } catch (err) {
    return null;
  }
}

async function bufferToZip(data: Buffer): Promise<Buffer> {

 return new Promise<Buffer>((resolve, reject) => {
    const archive = archiver('zip', {
        zlib: { level: 9 }
      });
    
      const zipBuffer: Buffer[] = [];
    
      archive.on('data', (chunk: Buffer) => {
        zipBuffer.push(chunk);
      });
    
      archive.on('end', () => {
        const zipData = Buffer.concat(zipBuffer);
        resolve(zipData)
      });
    
      archive.append(data, { name: 'data' })
    
      archive.finalize()

      archive.on('error', (err) => {
        reject(err);
      })
 })
}

async function zipToBuffer(zipBuffer: Buffer): Promise<Buffer> {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  const buffers: Buffer[] = [];
  entries.forEach((entry) => {
    buffers.push(entry.getData())
  })

  return Buffer.concat(buffers)
}


async function zipToDisk(path: string, data: Buffer): Promise<Boolean> {
  try {
    await fs.writeFile(path, data)
    return true
  }
  catch (err) {
    console.error("Unable to write zip file to disk: " + err)
    return false
  }
}

async function diskToZipBuffer(path: string): Promise<Buffer> {
  return await fs.readFile(path)
}


async function zipToGridFS(id:string , name:string, data: Buffer): Promise<void> {
  const writeStream = gfs.openUploadStreamWithId(id, name, {contentType:"zip"});
  writeStream.end(data);
  return new Promise<void>((resolve, reject) => {
    writeStream.on('close', () => {
      resolve();
    });

    writeStream.on('error', (err) => {
      reject(err);
    });
  });
}

async function gridFSToZip(name :string): Promise<Buffer> {
  const readStream = gfs.openDownloadStreamByName(name);
  const bufferArray = [];
  readStream.on('data', chunk => {  
      bufferArray.push(chunk)
  });

  return new Promise<Buffer>((resolve, reject) => {
    readStream.on('end', () => {
      resolve(Buffer.concat(bufferArray))
    })
    readStream.on('error', err => {
      reject(err)
    })
  });
}

async function zipToGridFSOverwrite(id: string, name: string, zipData: Buffer): Promise<void> {

  await new Promise<void>((resolve, reject) => {
    gfs.delete(id, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })

  await zipToGridFS(id, name, zipData)
}

async function patchGeoJSON(geoJSON: Object, delta: Delta): Promise<Buffer> {
   const editedGeoJSON = patch(geoJSON, delta)
  // console.log(editedGeoJSON)
   // after performing patch, compress JSON to zip in order to store in GridFS
   return await bufferToZip(Buffer.from(JSON.stringify(editedGeoJSON)))
}


export {bufferToZip, findUserById, zipToDisk, diskToZipBuffer, zipToGridFS, gridFSToZip, patchGeoJSON, zipToBuffer, zipToGridFSOverwrite}