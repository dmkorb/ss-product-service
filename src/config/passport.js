const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { User } = require('../models')

passport.use('user-local', new LocalStrategy({
		usernameField: 'email', 
    	passwordField: 'password'
	},
	function(username, password, done) {
        User
        .findOne({ email: username })
        .select('+salt +hash')
        .exec(function (err, user) {
			if (err) { return done(err); }
			if (!user) { 
				return done(null, false, { message: 'Email inválido!'}); 
			}

			if (!user.validPassword(password)) {
				return done(null, false, { message: 'Senha incorreta!' });
			}

			return done(null, user);
		});
	}
));