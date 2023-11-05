
import archiver from 'archiver';
import {UserModel, UserDocument} from '../models/user-model.js'

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

export {bufferToZip, findUserById}