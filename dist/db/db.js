// const mongoose = require('mongoose')
// const dotenv = require('dotenv')
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
mongoose
    .connect(process.env.DB_CONNECT, { useNewUrlParser: true })
    .catch(e => {
    console.log(process.env.DB_CONNECT);
    console.error('Connection error', e.message);
});
const db = mongoose.connection;
export default db;
// module.exports = db
