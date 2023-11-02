
const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config();

mongoose
    .connect(process.env.DB_CONNECT, { useNewUrlParser: true })
    .catch(e => {
        console.log(process.env.DB_CONNECT)
        console.error('Connection error', e.message)
    });
const db = mongoose.connection
module.exports = db

