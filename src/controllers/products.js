const { Product } = require('../models')
const { sendJSONResponse } = require('../utils')
const httpStatus = require('http-status');

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 10;
// const 

const getProducts = async (req, res) => {
    try {
        let { 
            offset = DEFAULT_OFFSET, 
            limit = DEFAULT_LIMIT,
            term
        } = req.query;
        let queryOptions = {}

        limit = parseInt(limit, 10)
        offset = parseInt(offset, 10)

        if (term) {
            queryOptions.name = { "$regex": req.query.term, "$options": "i" }
        }

        let total_count = await Product.find(queryOptions).countDocuments();
        let products = await Product.find(queryOptions).limit(limit).skip(offset);
        
        let response = {
            offset,
            limit,
            total_count,
            products
        }

        sendJSONResponse(res, httpStatus.OK, response)
    } catch (err) {
        sendJSONResponse(res, 
            httpStatus.INTERNAL_SERVER_ERROR, 
            { message: `Error: ${err.message}` 
        });
    }
}

const createProduct = async (req, res) => {
    res.status(200).send('create')
}

const getProduct = async (req, res) => {
    res.status(200).send('getOne')
}

const updateProduct = async (req, res) => {
    res.status(200).send('updateOne')
}

const deleteProduct = async (req, res) => {
    res.status(200).send('deleteOne')
}


module.exports = {
    getProducts,
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct
}