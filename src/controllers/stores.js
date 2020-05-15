const mongoose = require('mongoose');
const { Store } = require('../models')
const { sendJSONResponse } = require('../utils')
const httpStatus = require('http-status')
const { getStoreObject } = require('./stores.utils')
const usersController = require('./users')

/**
 * Gets all stores, and it's products.
 */
const getStores = async (req, res) => {
    try {
        let stores = [],
            __stores = await Store.find();

        for (s of __stores) {
            stores.push(await getStoreObject(s))
        }

        let count = stores.length;

        sendJSONResponse(res, httpStatus.OK, { count, stores });
    } catch (err) {
        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao buscar lojas: ${err.message}` 
        });
    }
}

/**
 * Gets a store, by the ID in the endpoint param.
 */
const getStore = async (req, res) => {
    return getStoreById(req.params.id, req.user, res)
}

/**
 * Get's an store by its ID. 
 * This function can also be used internally.
 * 
 * @param {string} storeId - The store ID
 */
const getStoreById = async (storeId, user, res) => {
    try {
        let store = await Store.findById(storeId);
        if (!store) {
            return sendJSONResponse(res, httpStatus.NOT_FOUND, { 
                message: 'Loja não encontrada' 
            });
        }

        let authorized = (user && await isUserAuthorized(store._id, user._id))

        sendJSONResponse(res, httpStatus.OK, await getStoreObject(store, authorized));
        
        return store;
    } catch (err) {
        if (err instanceof mongoose.Error.CastError)
            return sendJSONResponse(res, httpStatus.NOT_FOUND, { message: `ID inválido!` });

        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao buscar loja: ${err.message}` 
        });
    }
}

/**
 * Creates a new store.
 * The users that creates it is automatically assigned as it's manager.
 * 
 * @param {string} name - The name of the store 
 */
const createStore = async (req, res) => {
    try {
        let { name } = req.body;
        let { _id: manager } = req.user;

        if (!name) {
            return sendJSONResponse(res, httpStatus.BAD_REQUEST, { 
                message: 'O nome é obrigatório!' 
            });
        }

        let store = await Store.create({ 
            name,
            manager
        });

        await usersController.setRole(req.user._id, 'manager');

        sendJSONResponse(res, httpStatus.CREATED, await getStoreObject(store, !!req.user));
    } catch (err) {
        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao criar loja: ${err.message}` 
        });
    }
}

/**
 * Assign a user to the store staff list, thus allowing it to create,
 * update and remove products.
 * Can only be performed by the store manager.
 * 
 * @param {string} user_email - The ID of the user to be added as staff 
 */
const addStaff = async (req, res) => {
    try {
        let { user_email } = req.body;
        if (!user_email) {
            return sendJSONResponse(res, 
                httpStatus.BAD_REQUEST, 
                { message: 'O email do usuário é obrigatório!'})
        }
        
        let store = await Store.findById(req.params.id); 
        if (!store) {
            return sendJSONResponse(res, httpStatus.NOT_FOUND, { 
                message: 'Loja não encontrada' 
            });
        }

        let isAuthorized = await isUserAuthorized(store._id, req.user?._id, true)
        if (!isAuthorized) {
            return sendJSONResponse(res, httpStatus.FORBIDDEN, { 
                message: 'Usuário não autorizado!' 
            });
        }

        let user = await usersController.getUserByEmail(user_email);
        if (!user) {
            return sendJSONResponse(res, httpStatus.NOT_FOUND, {
                message: 'Usuário não encontrado!'
            })
        }

        if (store.staff.includes(user._id)) {
            return sendJSONResponse(res, httpStatus.BAD_REQUEST, { 
                message: 'Usuário já faz parte da staff!' 
            });
        }

        if (user.role === 'manager' || user.role === 'staff') {
            return sendJSONResponse(res, httpStatus.BAD_REQUEST, { 
                message: 'Usuário já associado à outra loja!' 
            });
        } 

        await usersController.setRole(user._id, 'staff');

        store.staff.push(user._id)
        await store.save();

        sendJSONResponse(res, httpStatus.OK, await getStoreObject(store, !!req.user))
    } catch (err) {
        if (err instanceof mongoose.Error.CastError)
            return sendJSONResponse(res, httpStatus.NOT_FOUND, { message: `ID inválido!` });

        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao adicionar staff: ${err.message}` 
        });
    }
}

/**
 * Removes a store.
 * Can only be performed by the store manager.
 */
const removeStore = async (req, res) => {
    try {
        let store = await Store.findById(req.params.id); 
        if (!store) {
            return sendJSONResponse(res, httpStatus.NOT_FOUND, { 
                message: 'Loja não encontrada' 
            });
        }

        let isAuthorized = await isUserAuthorized(store._id, req.user?._id, true)
        if (!isAuthorized) {
            return sendJSONResponse(res, httpStatus.FORBIDDEN, { 
                message: 'Usuário não autorizado!' 
            });
        }

        await store.remove()
        
        sendJSONResponse(res, httpStatus.OK, { message: `Loja ${store.name} removida!`})
    } catch (err) {
        if (err instanceof mongoose.Error.CastError)
            return sendJSONResponse(res, httpStatus.NOT_FOUND, { message: `ID inválido!` });
            
        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, { 
            message: `Erro ao remover a loja: ${err.message}` 
        });
    }
}

/**
 * Checks if an user is authorized to call store-specific endpoints,
 * like creating/updating/removing products, etc.
 * 
 * @param {string} storeId - The ID of the store to check 
 * @param {string} userId - The user ID that's trying to access
 * @param {boolean} managerOnly - Specifies whether staff can also access the resources.
 */
const isUserAuthorized = async (storeId, userId, managerOnly) => {
    try {
        if (!storeId || !userId) return false;
        let store = await Store.findById(storeId);
        if (!store) return false;
        if (store.manager == userId) return true;
        if (!managerOnly && store.staff.includes(userId)) return true;
        return false;
    } catch (err) {
        return false;
    }
}

/**
 * Get's the corresponding store of which the user is either a manager,
 * or part of the staff.
 * 
 * @param {string} userId - The user ID
 */
const getStoresForUser = async (userId) => {
    try {
        let store = await Store.find({
            $or: [
                { manager: userId },
                { staff: {$in: [userId]}}
            ]
        })
        return store;
    } catch (err) {
        return null;
    }
}

module.exports = {
    getStores, 
    getStore, 
    getStoreById,
    createStore, 
    addStaff,
    removeStore,
    isUserAuthorized,
    getStoresForUser
}