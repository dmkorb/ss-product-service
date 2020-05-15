const mongoose = require('mongoose');
const { Product } = require('../models')
const { sendJSONResponse } = require('../utils')
const httpStatus = require('http-status');
const storeController = require('./stores')
const { getProductObject } = require('./products.utils')

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 10;

/**
 * Returns all the products of the stores the user is responsible for.
 * If a manager has many stores, all the stores products will be returned.
 * 
 * @param {number} offset - Offset to query. Minimum 0.
 * @param {number} limit - The number of results to be returned. Defaults to 10, max to 100.
 * @param {string} term - The term fo search for
 */
const getProducts = async (req, res) => {
    try {
        let { 
            offset = DEFAULT_OFFSET, 
            limit = DEFAULT_LIMIT,
            term
        } = req.query;
        let queryOptions = {}

        //validate query options
        limit = parseInt(limit, 10)
        offset = parseInt(offset, 10)

        if (isNaN(offset) || offset < 0) offset = 100;
        if (isNaN(limit) || limit < 0 || limit > 100) limit = 100;

        // if it's an auth call, let's return only products from stores 
        // related to that user; be the user manager, be him staff
        if (req.user) {
            let stores = await storeController.getStoresForUser(req.user._id)
            if (stores) {
                let ids = []
                stores.forEach(store => ids.push(store._id))
                queryOptions.store_id = {$in: ids}
            }
        }
        
        // the term to search for products
        if (term) {
            queryOptions.name = { "$regex": req.query.term, "$options": "i" }
        }

        let total_count = await Product.find(queryOptions).countDocuments();
        
        let products = [],
            __products = await Product.find(queryOptions).limit(limit).skip(offset);
        
        // transform the product object to format it's output
        for (p of __products) {
            products.push(await getProductObject(p, !!req.user))
        }

        let count = products.length;

        let response = {
            offset,
            limit,
            count,
            total_count,
            products
        }

        sendJSONResponse(res, httpStatus.OK, response)
    } catch (err) {
        sendJSONResponse(res, 
            httpStatus.INTERNAL_SERVER_ERROR, 
            { message: `Erro ao buscar produtos: ${err.message}` 
        });
    }
}

/**
 * Creates a new product. 
 * Can only be done by the store manager or staff.
 * 
 * @param {string} name - The name of the product
 * @param {string} description - The description of the product
 * @param {string} image_url - The product's image URL
 * @param {string} store_id - The ID of the store this product is beind added to.
 * @param {number} price - The product's price, in cents.
 */
const createProduct = async (req, res) => {
    try {
        let { name, description, image_url, store_id, price } = req.body;
        
        // validations for name and store_id
        if (!name || !store_id) {
            return sendJSONResponse(res, httpStatus.BAD_REQUEST, { 
                message: 'O nome do produto e o ID da loja são obrigatórios!'
            })
        }

        // validating price
        if (price && isNaN(price)) {
            return sendJSONResponse(res, httpStatus.BAD_REQUEST, { 
                message: 'Preço inválido'
            })
        }

        // this call will also validate the store id; it returns false if not found
        if (!await storeController.isUserAuthorized(store_id, req.user?._id)) {
            return sendJSONResponse(res, httpStatus.FORBIDDEN, { 
                message: 'Usuário não autorizado a criar produtos nesta loja!'
            })
        }

        let product = await Product.create({
            name,
            description,
            image_url,
            price,
            store_id,
            created_by: req.user._id
        })

        sendJSONResponse(res, httpStatus.CREATED, await getProductObject(product, !!req.user))
    } catch (err) {
        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao criar produto: ${err.message}`
        })
    }
}

/**
 * Gets one product. 
 * Available for unauthorised users.
 */
const getProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id)

        if (!product) {
            return sendJSONResponse(res, httpStatus.NOT_FOUND, {
                message: 'Produto não encontrado!'
            })
        }

        let authorized = (req.user && await storeController.isUserAuthorized(product.store_id, req.user._id))

        sendJSONResponse(res, httpStatus.OK, await getProductObject(product, authorized))
    } catch (err) {
        if (err instanceof mongoose.Error.CastError)
            return sendJSONResponse(res, httpStatus.NOT_FOUND, { message: `ID inválido!` });

        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao buscar um produto: ${err.message}`
        })
    }
}

/**
 * Updates the product name, description, image and/or price.
 * Can only be called by the store manager or staff.
 * 
 * @param {string} name - The name of the product
 * @param {string} description - The description of the product
 * @param {string} image_url - The product's image URL
 * @param {number} price - The product's price, in cents.
 */
const updateProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id)

        if (!product) {
            return sendJSONResponse(res, httpStatus.NOT_FOUND, {
                message: 'Produto não encontrado!'
            })
        }

        if (!await storeController.isUserAuthorized(product.store_id, req.user?._id)) {
            return sendJSONResponse(res, httpStatus.FORBIDDEN, { 
                message: 'Usuário não autorizado a alterar este produto!'
            })
        }

        let { name, description, image_url, price } = req.body;
        product.name = name ?? product.name;
        product.description = description ?? product.description;
        product.image_url = image_url ?? product.image_url;
        product.price = (price && !isNaN(price)) ? price : product.price;

        await product.save();

        sendJSONResponse(res, httpStatus.OK, await getProductObject(product, !!req.user))
    } catch (err) {
        if (err instanceof mongoose.Error.CastError)
            return sendJSONResponse(res, httpStatus.NOT_FOUND, { message: `ID inválido!` });

        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao atualizar produto: ${err.message}`
        })
    }
}

/**
 * Deletes a product.
 * Can only be called by the store manager or staff.
 */
const deleteProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id)

        if (!product) {
            return sendJSONResponse(res, httpStatus.NOT_FOUND, {
                message: 'Produto não encontrado!'
            })
        }

        if (!await storeController.isUserAuthorized(product.store_id, req.user?._id)) {
            return sendJSONResponse(res, httpStatus.FORBIDDEN, { 
                message: 'Usuário não autorizado a remover este produto!'
            })
        }

        await product.remove();

        sendJSONResponse(res, httpStatus.OK, { message: `Produto ${product.name} removido!`})
    } catch (err) {
        if (err instanceof mongoose.Error.CastError)
            return sendJSONResponse(res, httpStatus.NOT_FOUND, { message: `ID inválido!` });

        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao remover o produto: ${err.message}`
        })
    }
}


module.exports = {
    getProducts,
    createProduct,
    getProduct,
    updateProduct,
    deleteProduct
}