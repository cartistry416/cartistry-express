var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// const mongoose = require('mongoose')
// const dotenv = require('dotenv')
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
// RESOURCE WE USED FOR MOCKING THE MONGODB SERVER FOR UNIT TESTING 
// https://medium.com/weekly-webtips/express-js-testing-mocking-mongodb-46c3797a201
import { MongoMemoryServer } from 'mongodb-memory-server';
let mongod = null;
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let dbUrl = process.env.MONGODB_URI;
        if (process.env.NODE_ENV === 'test') {
            mongod = yield MongoMemoryServer.create();
            dbUrl = mongod.getUri();
        }
        const conn = yield mongoose.connect(dbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });
        console.log(`MongoDB connected: ${conn.connection.host}`);
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
});
const disconnectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose.connection.close();
        if (mongod) {
            yield mongod.stop();
        }
    }
    catch (err) {
        console.log(err);
        process.exit(1);
    }
});
export { connectDB, disconnectDB };
// mongoose
//     .connect(process.env.DB_CONNECT, { useNewUrlParser: true })
//     .catch(e => {
//         console.log(process.env.DB_CONNECT)
//         console.error('Connection error', e.message)
//     });
// const db = mongoose.connection
// export default db
// module.exports = db
