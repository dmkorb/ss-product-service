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

router.get('/', (req, res) => { res.status(200).send({message: 'Im running!'}); });

router.post('/login',                   usersController.login);
router.post('/register',                usersController.register);


router.get('/stores',                   storesController.getStores);
router.post('/stores',                  auth, storesController.createStore)
router.post('/stores/:id/add-staff',    auth, storesController.addStaff)
router.delete('/stores/:id',            auth, storesController.removeStore)

router.get('/products',                 productsController.getProducts)
router.post('/products',                auth, productsController.createProduct)
router.get('/products/:id',             productsController.getProduct)
router.put('/products/:id',             productsController.updateProduct)
router.delete('/products/:id',          productsController.deleteProduct)

module.exports = router;
