const mongoose = require("mongoose");

const {
    collectionDropper, 
    mongooseConnection
  } = require("./database/mongoose");

const seedAdmins = require("./seeds/admins");
const seedBuyers = require("./seeds/buyers");
const seedCarts = require("./seeds/carts");
const seedCategories = require("./seeds/categories");
const seedChats = require("./seeds/chats");
const seedCities = require("./seeds/cities");
const seedOffers = require("./seeds/offers");
const seedProducts = require("./seeds/products");
const seedReviews = require("./seeds/reviews");
const seedScheduledOrders = require("./seeds/scheduledOrders");
const seedSellers = require("./seeds/sellers");
//const seedSubCategories = require("./seeds/subCategories");



const launchScript = async() => {

    //creating mongodb connection
    await mongooseConnection();
    //clearing database
    //await collectionDropper();

    //seeding Dummy Data
    await seedAdmins();
    //await seedBuyers();
    //await seedCarts();
    //await seedCategories();
    //await seedChats();
    //await seedCities();
    //await seedOffers();
    //await seedProducts();
    //await seedReviews();
    //await seedScheduledOrders();
    //await seedSellers();
    //await seedSubCategories();
    //await seedCities();

    process.exit();
}

launchScript();



