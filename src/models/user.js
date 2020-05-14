const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
	email: {
		type: String,
		unique: true,
		required: true
	},
	name: {
		type: String,
		required: true
	},
	
	//JWT auth
	hash: { type: String, select: false },
	salt: { type: String, select: false },

    role: { 
        type: String, 
        enum: ['user', 'manager', 'staff'],
        default: 'user' 
    },
});

userSchema.methods.setPassword = function(password){
	this.salt = crypto.randomBytes(16).toString('hex');;
    this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');;
};

userSchema.methods.validPassword = function(password) {
  	var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512').toString('hex');
  	return this.hash === hash;
};

userSchema.methods.generateJwt = async function() {
	let sign = {
		_id: this._id,
		email: this.email,
		name: this.name,
		role: this.role
	}

	let response = jwt.sign(sign, process.env.JWT_SECRET || 'testsecret' );

	return response;
};

userSchema.statics.isEmailTaken = async function (email) {
    const user = await this.findOne({ email });
    return !!user;
};

userSchema.statics.findByEmail = function(email, cb) {
    return this.findOne({ email: email }, cb);
};

module.exports = mongoose.model('User', userSchema);
