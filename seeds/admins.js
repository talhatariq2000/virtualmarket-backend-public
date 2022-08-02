const admins = require("../dummyData/admins.json");
const {Admin} = require("../models/admin");

const seedAdmins = async() => {
    try
    {
        const data = admins.data;
        await Admin.insertMany(data);
        console.log("Admin Dummy Data Seeded...");
    }
    catch(err)
    {
        console.log('Admin Seeding Error:',err.message)
    }
};

module.exports = seedAdmins;