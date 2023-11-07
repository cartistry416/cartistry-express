
// const mongoose = require('mongoose')
// const dotenv = require('dotenv')
import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config();

// RESOURCE WE USED FOR MOCKING THE MONGODB SERVER FOR UNIT TESTING 
// https://medium.com/weekly-webtips/express-js-testing-mocking-mongodb-46c3797a201
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongod = null;
// comment for github actions
const connectDB = async () => {
  try {
    let dbUrl = process.env.MONGODB_URI;
    if (process.env.NODE_ENV === 'test') {
      // mongod = await MongoMemoryServer.create();
      // dbUrl = mongod.getUri();
      dbUrl = "mongodb+srv://cartistry:kKcrgro6VUyTCz5h@cluster0.9zgz9yx.mongodb.net/"
    }

    const conn = await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

export {connectDB, disconnectDB}



// mongoose
//     .connect(process.env.DB_CONNECT, { useNewUrlParser: true })
//     .catch(e => {
//         console.log(process.env.DB_CONNECT)
//         console.error('Connection error', e.message)
//     });
// const db = mongoose.connection
// export default db


// module.exports = db

