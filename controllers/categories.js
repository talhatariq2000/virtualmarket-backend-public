const express = require('express');
const mongoose = require("mongoose");
const _ = require("lodash");

const { Category } = require("../models/category");


module.exports.getAll = async (req,res) => {

    let categories = await Category.find().sort({name: 1});
    return res.send(categories);
};


//_________________________________________________________________________
//                              Internal Function
//_________________________________________________________________________

//Get Category ID from Search Key
module.exports.getCategoryID = async(key) => {

    try
    {
        let category = await Category.findOne({name: {$regex: key,$options:'i'}});

        if(category)
        {
            return category._id;
        }
        else
        {
            return;
        }
    }
    catch(err)
    {
        console.log(err);
        return;
    }
};