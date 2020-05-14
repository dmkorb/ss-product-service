const express = require('express');
const router = express.Router();
const jwt = require('express-jwt');
const { 
    usersController,
    storesController,
    productsController
 } = require('../controllers')

var auth = jwt({
	secret: process.env.JWT_SECRET || 'testsecret',
	userProperty: 'user'
});

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
router.get('/stores',                   storesController.getStores);
router.post('/stores',                  auth, storesController.createStore)
router.post('/stores/:id/add-staff',    auth, storesController.addStaff)
router.delete('/stores/:id',            auth, storesController.removeStore)

/**
 * Products
 */
router.get('/products',                 auth, productsController.getProducts)
router.post('/products',                auth, productsController.createProduct)
router.get('/products/:id',             productsController.getProduct)
router.put('/products/:id',             auth, productsController.updateProduct)
router.delete('/products/:id',          auth, productsController.deleteProduct)

module.exports = router;
