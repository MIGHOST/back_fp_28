const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '.env'),
});
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { PORT, DB_URI } = process.env;
const { authRouter } = require('./auth/auth.router');
const { transactionRouter } = require('./DBData/route');

exports.AuthServer = class {
  constructor() {
    this.app = null;
  }
  async start() {
    this.initApp();
    await this.initDbConnection();
    this.initMiddleware();
    this.initRoutes();
    this.initErrorHandler();
    this.startListener();
  }
  initApp() {
    this.app = express();
  }

  async initDbConnection() {
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Database connection successful');
  }

  initMiddleware() {
    this.app.use(express.json());
    this.app.use(
      cors({
        origin: [
          'http://localhost:3000',
          'http://localhost:300',
          'https://wallet-fp-28.netlify.app',
          'https://wallet-fp-28.netlify.app/auth/login',
          'https://wallet-fp-28.netlify.app/auth/register',
          'https://alexeyshalkevych.github.io',
          'http://finalproject2020.zzz.com.ua',
          'https://alexeyshalkevych.github.io/test-project-auth/',
        ],
      }),
    );
  }

  initRoutes() {
    this.app.use('/auth', authRouter);
    this.app.use('/', transactionRouter);
  }

  initErrorHandler() {
    this.app.use((err, req, res, next) => {
      const statusCode = err.status || 500;
      return res.send(statusCode).send(err.message);
    });
  }

  startListener() {
    this.app.listen(PORT, err =>
      err
        ? console.error(err)
        : console.info(`Server has been started on ${PORT} port`),
    );
  }
};