const offers = require("../dummyData/offers.json");
const {Offer} = require("../models/offer");

const seedOffers = async() => {
    try
    {
        const data = offers.data;
        await Offer.insertMany(data);
        console.log("Offer Dummy Data Seeded...");
    }
    catch(err)
    {
        console.log('Offer Seeding Error:',err.message)
    }
};

module.exports = seedOffers;