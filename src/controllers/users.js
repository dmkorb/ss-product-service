const { User } = require('../models')
const { sendJSONResponse } = require('../utils')
const httpStatus = require('http-status')
const passport = require('passport');

const register = async (req, res) => {
    try {
        let { name, email, password } = req.body;

        if (!name || !email || !password) {
            return sendJSONResponse(res, 
                httpStatus.BAD_REQUEST, 
                { message: 'Nome, email e senha são obrigatórios!'})
        }

        let user = new User({ name, email });
        user.setPassword(req.body.password);
        await user.save();

        let token = await user.generateJwt();

        let response = {
            _id: user._id,
            name: user.name,
            email: user.email,
            token
        }

        sendJSONResponse(res, httpStatus.OK, response);
    } catch (err) {
        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, 
            { message: `Erro ao criar usuário: ${err.message}`})
    }
}

const login = async (req, res) => {
    try {
        let { email, password } = req.body;

        if (!email || !password) {            
            return sendJSONResponse(res, 
                httpStatus.BAD_REQUEST, 
                { message: 'Email e senha são obrigatórios!'})
        }
        
        passport.authenticate('user-local', async (err, user, info) => {
            if (err) { 
                return sendJSONResponse(res, 
                    httpStatus.INTERNAL_SERVER_ERROR, 
                    { message: `Error: ${err.message}` });
            }

            if (!user) { 
                return sendJSONResponse(res, httpStatus.NOT_FOUND, info); 
            }

            let token = await user.generateJwt();
            let { _id, name, email, is_admin } = user;
            
            let response = {
                _id,
                name,
                email,
                is_admin,
                token
            }
            
            sendJSONResponse(res, httpStatus.OK, response);
        })(req, res);
    } catch (err) {
        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, 
            { message: `Erro no login: ${err.message}`})
    }
}

const getUsers = async (req, res) => {
    try {
        let users = await User.find();
        sendJSONResponse(res, httpStatus.OK, users)
    } catch (err) {
        sendJSONResponse(res, httpStatus.OK, {message: err.message})
    }
}

module.exports = {
    register,
    login,
    getUsers
}