const express = require('express');
const {
  getTransaction,
  postTransaction,
  deleteTransaction,
  updateTransaction,getTransactionDateFillter
} = require('./DataControler');
const { tokenMiddleware } = require('../middleware/auth.middleware');

const route = express.Router();

route.get('/get', tokenMiddleware, getTransaction);
route.get('/getToday', tokenMiddleware, getTransactionDateFillter);
route.post('/post', tokenMiddleware, postTransaction);
route.delete('/delete', tokenMiddleware, deleteTransaction);
route.patch('/update', tokenMiddleware, updateTransaction);

module.exports.transactionRouter = route;
