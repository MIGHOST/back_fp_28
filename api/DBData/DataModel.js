const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DataShema = new Schema({
  date: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    required: false,
  },
  sum: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
    required: false,
  },
  userOwner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

const transactionModel = mongoose.model('TransactionData', DataShema);

module.exports = transactionModel;
