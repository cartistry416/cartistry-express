// THESE ARE NODE APIs WE WISH TO USE
// import authRouter from './routes/auth-router'

// import postsRouter from './routes/posts-router'

// import mapsRouter from './routes/maps-router'

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

import {authRouter} from './routes/auth-router.js'
//const authRouter = require('./routes/auth-router.ts')

import {postsRouter} from './routes/posts-router.js'

//const postsRouter = require('./routes/posts-router.ts')
import {mapsRouter} from './routes/maps-router.js'

import {connectDB, disconnectDB} from './db/db.js'
import mongoose from 'mongoose'
import { randomBytes } from 'crypto'
//const mapsRouter = require('./routes/maps-router.ts')

// CREATE OUR SERVER
dotenv.config()
const PORT = process.env.PORT || 4000;
const app = express()
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = randomBytes(32).toString('hex')
    process.env.JWT_EXPIRATION_TIME="86400"
}
// SETUP THE MIDDLEWARE
app.use(express.urlencoded({ extended: true }))

const frontEndURL = process.env.FRONTEND_URL
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', frontEndURL);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});
app.use(cors({
    origin: [frontEndURL],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

// SETUP OUR OWN ROUTERS AS MIDDLEWARE
app.use('/auth', authRouter)

app.use('/posts-api', postsRouter)

app.use('/maps-api', mapsRouter)

app.get('/', async (req, res) => {
    res.send("HELLO FROM EXPRESS!")
})

// INITIALIZE OUR DATABASE OBJECT


// db.on('error', console.error.bind(console, 'MongoDB connection error:'))

// PUT THE SERVER IN LISTENING MODE
if (process.env.NODE_ENV !== 'test') {
    connectDB().then(() => {
        const db = mongoose.connection
        db.on('error', console.error.bind(console, 'MongoDB connection error:'))
    })
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

export {app}

