const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
const secret = require('../config').secret;
const { 
    usersController,
    storesController,
    productsController
 } = require('../controllers')

const auth = {
    required: jwt({
        secret,
        userProperty: 'user'
    }),
    optional: jwt({
        secret,
        userProperty: 'user',
        credentialsRequired: false,
    })
}

/**
 * These routes are for debuggin/demostration;
 * In a microservices architecture, the auth would've probably been done
 * somewhere else - an independent auth service, for instance.
 */
router.post('/login',                   usersController.login);
router.post('/register',                usersController.register);

if (process.env.NODE_ENV !== 'production') {
    router.get('/users',                usersController.getUsers)
}


/**
 * Stores
 */
router.get('/stores',                   auth.optional, storesController.getStores);
router.post('/stores',                  auth.required, storesController.createStore)
router.post('/stores/:id/add-staff',    auth.required, storesController.addStaff)
router.delete('/stores/:id',            auth.required, storesController.removeStore)

/**
 * Products
 */
router.get('/products',                 auth.optional, productsController.getProducts)
router.post('/products',                auth.required, productsController.createProduct)
router.get('/products/:id',             auth.optional, productsController.getProduct)
router.put('/products/:id',             auth.required, productsController.updateProduct)
router.delete('/products/:id',          auth.required, productsController.deleteProduct)

module.exports = router;
