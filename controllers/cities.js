const express = require('express');
const mongoose = require("mongoose");
const _ = require("lodash");

const { City } = require("../models/city");

module.exports.getAll = async (req,res) => {

    let cities = await City.find().sort({name: 1});
    return res.send(cities);
};