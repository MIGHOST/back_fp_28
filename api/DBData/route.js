const express = require('express');
const {
  getTransaction,
  postTransaction,
  deleteTransaction,
  updateTransaction,
  getTransactionDateFillter,
  getTransactionForStatistic,
} = require('./DataControler');
const { tokenMiddleware } = require('../middleware/auth.middleware');

const route = express.Router();

route.get('/get', tokenMiddleware, getTransaction);
route.get('/getToday', tokenMiddleware, getTransactionDateFillter);
route.get('/get/stat', tokenMiddleware, getTransactionForStatistic);
route.post('/post', tokenMiddleware, postTransaction);
route.delete('/delete', tokenMiddleware, deleteTransaction);
route.patch('/update', tokenMiddleware, updateTransaction);

module.exports.transactionRouter = route;
