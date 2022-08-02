const cities = require("../dummyData/cities.json");
const {City} = require("../models/city");

const seedCities = async() => {
    try
    {
        const data = cities.data;
        await City.insertMany(data);
        console.log("City Dummy Data Seeded...");
    }
    catch(err)
    {
        console.log('City Seeding Error:',err.message)
    }
};

module.exports = seedCities;