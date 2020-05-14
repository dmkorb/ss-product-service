const { User } = require('../models')
const { sendJSONResponse } = require('../utils')
const httpStatus = require('http-status')
const passport = require('passport');

/**
 * Creates a new user 
 * 
 * @param {string} name
 * @param {string} email
 * @param {string} password
 */
const register = async (req, res) => {
    let { name, email, password } = req.body;
    return createUser(name, email, password, res);
}

const createUser = async (name, email, password, res) => {
    try {
        if (!name || !email || !password) {
            return sendJSONResponse(res, 
                httpStatus.BAD_REQUEST, 
                { message: 'Nome, email e senha são obrigatórios!'})
        }

        if (await User.isEmailTaken(email)) {
            return sendJSONResponse(res, 
                httpStatus.BAD_REQUEST, 
                { message: 'O email já está sendo usado!'})
        }

        let user = new User({ name, email });
        user.setPassword(password);
        await user.save();

        let token = await user.generateJwt();

        let response = {
            _id: user._id,
            name: user.name,
            email: user.email,
            token
        }

        sendJSONResponse(res, httpStatus.OK, response);
        
        return response;
    } catch (err) {
        console.error(err);
        sendJSONResponse(res, httpStatus.INTERNAL_SERVER_ERROR, 
            { message: `Erro ao criar usuário: ${err.message}`})
    }
}

/**
 * Logs the user in, returning a token
 * @param {string} email
 * @param {string} password
 */
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

/**
 * Gets all users.
 * Only available for testing/debugging, not for production.
 */
const getUsers = async (req, res) => {
    try {
        let users = await User.find();
        sendJSONResponse(res, httpStatus.OK, users)
    } catch (err) {
        sendJSONResponse(res, httpStatus.OK, {message: err.message})
    }
}

/**
 * Returns an user by it's email address
 * @param {string} email 
 */
const getUserByEmail = async (email) => {
    try {
        let user = await User.findOne({ email });
        return user;
    } catch (err) {
        console.log(`Error getting user: ${err.message}`)
    }
}

/**
 * Sets a role for a specific user. Used to change user's role 
 * to manager/staff when it creates a store or is added as staff.
 * @param {string} userId 
 * @param {string} role 
 */
const setRole = async (userId, role) => {
    try {
        await User.updateOne({ _id: userId }, { $set: { role }})
    } catch (err) {
        console.log(`Error setting role: ${err.message}`)
    }
}

module.exports = {
    login,
    register,
    getUsers,
    setRole,
    getUserByEmail
}