// THESE ARE NODE APIs WE WISH TO USE
// import authRouter from './routes/auth-router'

// import postsRouter from './routes/posts-router'

// import mapsRouter from './routes/maps-router'

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

import authRouter from './routes/auth-router.ts'
//const authRouter = require('./routes/auth-router.ts')

import postsRouter from './routes/posts-router.ts'

//const postsRouter = require('./routes/posts-router.ts')
import mapsRouter from './routes/maps-router.ts'

import db from './db/db.ts'

//const mapsRouter = require('./routes/maps-router.ts')

// CREATE OUR SERVER
dotenv.config()
const PORT = process.env.PORT || 4000;
const app = express()

// SETUP THE MIDDLEWARE
app.use(express.urlencoded({ extended: true }))
// app.use(cors({
//     origin: ["https://main.d2cpsfn3mxqyu2.amplifyapp.com"],
//     credentials: true
// })) //CartistryExpressServer-env-1.eba-fmapfype.us-east-1.elasticbeanstalk.com 
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
// const db = require('./db')
db.on('error', console.error.bind(console, 'MongoDB connection error:'))

// PUT THE SERVER IN LISTENING MODE
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))


