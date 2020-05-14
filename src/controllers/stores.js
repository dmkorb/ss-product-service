const { Store } = require('../models')
const { sendJSONResponse } = require('../utils')
const httpStatus = require('http-status')

const getStores = async (req, res) => {
    try {
        let stores = await Store.find();
        let count = stores.length;
        sendJSONResponse(res, httpStatus.OK, { count, stores });
    } catch (err) {
        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao buscar lojas: ${err.message}` 
        });
    }
}

const getStore = async (req, res) => {
    return getStoreById(req.params.id, res)
}

const getStoreById = async (storeId, res) => {
    try {
        let store = await Store.findById(storeId);
        if (!store) {
            return sendJSONResponse(res, httpStatus.NOT_FOUND, { 
                message: 'Loja não encontrada' 
            });
        }
        
        sendJSONResponse(res, httpStatus.OK, store);
        
        return store;
    } catch (err) {
        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao buscar loja: ${err.message}` 
        });
    }
}

const createStore = async (req, res) => {
    try {
        let { name } = req.body;
        let { _id: manager } = req.user;

        if (!name) {
            return sendJSONResponse(res, httpStatus.INVALID_REQUEST, { 
                message: 'O nome é obrigatório!' 
            });
        }

        let store = await Store.create({ 
            name,
            manager
        });

        sendJSONResponse(res, httpStatus.OK, store);
    } catch (err) {
        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao criar loja: ${err.message}` 
        });
    }
}

const addStaff = async (req, res) => {
    try {

    } catch (err) {
        
    }
}

const removeStore = async (req, res) => {
    try {
        console.log(req.params.id)
        let store = await Store.findById(req.params.id); 
        if (!store) {
            return sendJSONResponse(res, httpStatus.NOT_FOUND, { 
                message: 'Loja não encontrada' 
            });
        }

        let isAuthorized = await isUserAuthorized(store._id, req.user._id)
        if (!isAuthorized) {
            return sendJSONResponse(res, httpStatus.FORBIDDEN, { 
                message: 'Usuário não autorizado!' 
            });
        }

        await store.remove()
        
        sendJSONResponse(res, httpStatus.OK, { message: `Loja ${store.name} removida!`})
    } catch (err) {
        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao remover a loja: ${err.message}` 
        });
    }
}

const isUserAuthorized = async (storeId, userId) => {
    try {
        let store = await Store.findById(storeId);
        if (!store) return false;
        if (store.manager == userId) return true;
        if (store.staff.includes(userId)) return true;
        return false;
    } catch (err) {
        return false;
    }
}

module.exports = {
    getStores, 
    getStore, 
    getStoreById,
    createStore, 
    addStaff,
    removeStore,
    isUserAuthorized
}