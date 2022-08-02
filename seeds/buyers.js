const buyers = require("../dummyData/buyers.json");
const {Buyer} = require("../models/buyer");

const seedBuyers = async() => {
    try
    {
        const data = buyers.data;
        await Buyer.insertMany(data);
        console.log("Buyer Dummy Data Seeded...");
    }
    catch(err)
    {
        console.log('Buyer Seeding Error:',err.message)
    }
};

module.exports = seedBuyers;