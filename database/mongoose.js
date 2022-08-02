const mongoose =  require("mongoose");
const { MongoClient, ServerApiVersion } = require('mongodb');
const dotenv = require("dotenv").config();
let db = null

const collectionDropper = async() => {
    try {
        if (db !== null) {
          await db.dropDatabase()
          console.log(`Database has been Refreshed Successfully`)
        }
    } 
    catch (err) {
        console.log(`Collection Dropper Error: `, err.message)
    }
}

//Local
// const mongooseConnection = async() => {
//     mongoose
//         .connect("mongodb://localhost/vmdb1", {useNewUrlParser : true, useUnifiedTopology: true})
//         .then(() => console.log("Connected to MongoDB-vmdb1..."))
//         .catch((error) => console.log(error.message))
//     ;
//     db = mongoose.connection
// }

//Cloud
const mongooseConnection = async() => {
    mongoose
        .connect(process.env.MONGO_VMDB2, {useNewUrlParser : true, useUnifiedTopology: true})
        .then(() => console.log("Connected to Cloud MongoDB-vmdb2..."))
        .catch((error) => console.log(error))
    ;
    db = mongoose.connection
}

//const mongooseConnection = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

module.exports = {collectionDropper,mongooseConnection};