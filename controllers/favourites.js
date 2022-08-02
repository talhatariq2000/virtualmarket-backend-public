const express = require('express');
const mongoose = require("mongoose");
const _ = require("lodash");

const { Favourite } = require("../models/favourite");


//_________________________________________________________________________
//                       Buyer APIs
//_________________________________________________________________________

//Add a Product to Favourites
module.exports.add = async (req,res) => {

    try
    {
        let favourite = await Favourite.findOne({Buyer: req.buyer._id});

        if (!favourite)
        {
            let id = new mongoose.Types.ObjectId();
            favourite = await Favourite.create({_id: id, Buyer: req.buyer._id});
        }

        if (favourite.products.includes(req.product._id))
        {
            return res.send("Product Already in Favourites");
        }
        else
        {
            favourite.products.push(req.product._id);
            await Favourite.findByIdAndUpdate(favourite._id, { products: favourite.products });
            return res.send("Added to Favourites")
        }
    }
    catch(err)
    {
        console.log(err);
        return req.status(500).send("Internal Server Error");
    }
};

//Get Favourite Products
module.exports.getProducts = async (req,res) => {

    try
    {
        let favourite = await Favourite.findOne({Buyer: req.buyer._id}).populate('products', 'name images.link price minOrder status');

        if (favourite)
        {
            //If favourite.product is undefined (product deleted) or Unapproved
            for ( i=0 ; i<favourite.products.length ; i++ )
            {
                if( !favourite.products[i] || favourite.products[i].status != 'APPROVED' )
                {
                    favourite.products.splice(i,1);
                }
            }

            if ( favourite.products.length === 0 )
            {
                res.status(400).send("No Favourite Products");
                await Favourite.findByIdAndDelete(favourite._id);
                return;
            }
            else
            {
                res.send(favourite.products);
                await Favourite.findByIdAndUpdate(favourite._id, {products: favourite.products});
                return;
            }
            
        }
        else
        {
            return res.status(400).send("No Favourite Products");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
}

//Remove Product from Favourites
module.exports.removeProduct = async (req,res) => {

    try
    {
        let favourite = await Favourite.findOne({Buyer: req.buyer._id});

        if (favourite)
        {
            const index = favourite.products.indexOf(req.params.id)
            
            if ( index === -1 )
            {
                return res.status(400).send("Product is not in favourites");
            }
            else
            {
                favourite.products.splice(index,1);
                if ( favourite.products.length === 0 )
                {
                    await Favourite.findByIdAndDelete(favourite._id);  
                    return res.send("Product Removed from Favourites");  
                }
                else
                {
                    await Favourite.findByIdAndUpdate(favourite._id, { products: favourite.products });
                    return res.send("Product Removed from Favourites");
                }
            }
        }
        else
        {
            return res.send("No Favourite Products");
        }
    }
    catch(err)
    {
        console.log(err);
        return res.status(500).send("Internal Server Error");
    }
};