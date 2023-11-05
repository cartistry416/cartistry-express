var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import archiver from 'archiver';
import { UserModel } from '../models/user-model.js';
function findUserById(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield UserModel.findById(userId);
            if (!user) {
                return null;
            }
            return user;
        }
        catch (err) {
            return null;
        }
    });
}
function bufferToZip(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });
            const zipBuffer = [];
            archive.on('data', (chunk) => {
                zipBuffer.push(chunk);
            });
            archive.on('end', () => {
                const zipData = Buffer.concat(zipBuffer);
                resolve(zipData);
            });
            archive.append(data, { name: 'data' });
            archive.finalize();
            archive.on('error', (err) => {
                reject(err);
            });
        });
    });
}
export { bufferToZip, findUserById };
