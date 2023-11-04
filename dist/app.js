// THESE ARE NODE APIs WE WISH TO USE
// import authRouter from './routes/auth-router'
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// import postsRouter from './routes/posts-router'
// import mapsRouter from './routes/maps-router'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth-router.js';
//const authRouter = require('./routes/auth-router.ts')
import { postsRouter } from './routes/posts-router.js';
//const postsRouter = require('./routes/posts-router.ts')
import { mapsRouter } from './routes/maps-router.js';
import { connectDB } from './db/db.js';
import mongoose from 'mongoose';
//const mapsRouter = require('./routes/maps-router.ts')
// CREATE OUR SERVER
dotenv.config();
const PORT = process.env.PORT || 4000;
const app = express();
// SETUP THE MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: ["https://main.d2cpsfn3mxqyu2.amplifyapp.com"],
    credentials: true
})); //CartistryExpressServer-env-1.eba-fmapfype.us-east-1.elasticbeanstalk.com 
app.use(express.json());
app.use(cookieParser());
// SETUP OUR OWN ROUTERS AS MIDDLEWARE
app.use('/auth', authRouter);
app.use('/posts-api', postsRouter);
app.use('/maps-api', mapsRouter);
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("HELLO FROM EXPRESS!");
}));
// INITIALIZE OUR DATABASE OBJECT
// db.on('error', console.error.bind(console, 'MongoDB connection error:'))
// PUT THE SERVER IN LISTENING MODE
if (process.env.NODE_ENV !== 'test') {
    connectDB().then(() => {
        const db = mongoose.connection;
        db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    });
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
export { app };
