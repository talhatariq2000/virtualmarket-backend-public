const sheduledOrders = require("../dummyData/scheduledOrders.json");
const {ScheduledOrder} = require("../models/scheduledOrder");

const seedScheduledOrders = async() => {
    try
    {
        const data = sheduledOrders.data;
        await ScheduledOrder.insertMany(data);
        console.log("ScheduledOrder Dummy Data Seeded...");
    }
    catch(err)
    {
        console.log('ScheduledOrder Seeding Error:',err.message)
    }
};

module.exports = seedScheduledOrders;