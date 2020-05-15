const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const bodyParser = require('body-parser');
const logger = require('morgan');
const { db } = require('./models');
const routes = require('./routes');
const { passportConfig } = require('./config/passport')

const app = express();

if (process.env.NODE_ENV !== 'test') {
    app.use(logger('dev'))
}

app.use(helmet())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors());
app.options('*', cors());

app.use(passport.initialize());

app.use('/api', routes);
app.get('/', (req, res) => {
    let htmlResponse = `
        <H2>SS Products Service</H2>
        <small>(I'm running)</small>
        <br>
        <p>Veja a especificação desta API <a target="_blank" href="https://documenter.getpostman.com/view/2773219/Szmk1Fi4">neste</a> link</p>
        <br>
        <p>Qualquer dúvida, solte um grito <a target="_blank" href="https://github.com./dmkorb/ss-products-service">aqui</a></p>
    `
    res.status(200).send(htmlResponse)
});

// catch 404 
app.use((req, res, next) => {
    var err = new Error('Route not found');
    res.status(404);
    res.json({"message" : err.name + ": " + err.message});
});

// Catch unauthorised errors
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
      res.status(401);
      res.json({"message" : err.name + ": " + err.message});
    }
});

module.exports = app;