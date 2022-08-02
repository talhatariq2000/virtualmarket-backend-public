const chats = require("../dummyData/chats.json");
const {Chat} = require("../models/chat");

const seedChats = async() => {
    try
    {
        const data = chats.data;
        await Chat.insertMany(data);
        console.log("Chat Dummy Data Seeded...");
    }
    catch(err)
    {
        console.log('Chat Seeding Error:',err.message)
    }
};

module.exports = seedChats;