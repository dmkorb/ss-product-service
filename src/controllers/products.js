const { Product } = require('../models')
const { sendJSONResponse } = require('../utils')
const httpStatus = require('http-status');
const storeController = require('./stores')
const { getProductObject } = require('./products.utils')

const DEFAULT_OFFSET = 0;
const DEFAULT_LIMIT = 10;

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

        // let's return only products from stores related to that user;
        // be the user manager, be him staff
        let stores = await storeController.getStoresForUser(req.user._id)
        if (stores) {
            let ids = []
            stores.forEach(store => ids.push(store._id))
            queryOptions.store_id = {$in: ids}
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

        sendJSONResponse(res, httpStatus.OK, await getProductObject(product, !!req.user))
    } catch (err) {
        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao criar produto: ${err.message}`
        })
    }
    
}

const getProduct = async (req, res) => {
    try {
        let product = await Product.findById(req.params.id)

        if (!product) {
            return sendJSONResponse(res, httpStatus.NOT_FOUND, {
                message: 'Produto não encontrado!'
            })
        }

        sendJSONResponse(res, httpStatus.OK, await getProductObject(product, !!req.user))
    } catch (err) {
        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao criar produto: ${err.message}`
        })
    }
}

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
        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao atualizar produto: ${err.message}`
        })
    }
}

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