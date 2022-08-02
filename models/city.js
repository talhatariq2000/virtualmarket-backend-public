const mongoose = require("mongoose");

citySchema = mongoose.Schema({
    _id: String,
    name: String
});

var City = mongoose.model("City",citySchema);

module.exports.City = City;