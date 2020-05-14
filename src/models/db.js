const mongoose = require('mongoose');

var dbURI = 'mongodb://localhost/ss-product';
if (process.env.NODE_ENV === 'production') {
    dbURI = process.env.MONGODB_URI;
}

dbURI = `${dbURI}${(process.env.NODE_ENV === 'test' ? '-test' : '')}`

const connection = mongoose.connect(dbURI, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// CONNECTION EVENTS
mongoose.connection.on('error', (err) => console.log('Mongoose connection error: ' + err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));
mongoose.connection.on('connected', async () => {
    console.log('Mongoose connected to ' + dbURI);

    if (process.env.NODE_ENV !== 'production') {
        let mock = await require('../mock');
        mock.insertMockData();
    }
});

// CAPTURE APP TERMINATION / RESTART EVENTS
// To be called when process is restarted or terminated
const gracefulShutdown = function(msg, callback) {
    mongoose.connection.close(function() {
        console.log('Mongoose disconnected through ' + msg);
        callback();
    });
};

// For nodemon restarts
process.once('SIGUSR2', () => gracefulShutdown('nodemon restart', () => process.kill(process.pid, 'SIGUSR2')));

// For app termination
process.on('SIGINT', () => gracefulShutdown('app termination', () => process.exit(0)));

// For Heroku app termination
process.on('SIGTERM', () => gracefulShutdown('app termination', () => process.exit(0)));

module.exports = connection;