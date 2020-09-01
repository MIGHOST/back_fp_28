const transactionModel = require('./DataModel');
const userModel = require('../user/user.model');
const {
  sortTransactions,
  balanceLastTransaction,
  updateTotalBalance,
  filterBalance,
  updateBalance,
} = require('../helper/transactionController.helpers');

async function getTransaction(req, res, next) {
  try {
    const { _id } = req.user;

    const user = await transactionModel
      .find({
        userOwner: _id,
      })
      .exec();

    return res.status(200).send(user);
  } catch (error) {
    next(error);
  }
}

async function getTransactionDateFillter(req, res, next) {
  try {
    const { _id } = req.user;

    const user = await transactionModel
      .find({
        userOwner: _id,
      })
      .exec();

    const userDateSort = sortTransactions(user);

    await updateBalance(userDateSort);

    const transactions = await transactionModel
      .find({
        userOwner: _id,
      })
      .exec();

    const userTransactionsSort = sortTransactions(transactions);

    res.status(200).send(userTransactionsSort);
  } catch (error) {
    next(error);
  }
}

async function getTransactionForStatistic(req, res, next) {
  try {
    const { _id } = req.user;
    let { type, month, year } = req.query;

    month = Number(month);
    year = Number(year);
    if (Number.isNaN(month) || Number.isNaN(year)) {
      res
        .status(400)
        .send({ message: 'Bad request: month and year must be a number' });
    }
    if (month > 12) {
      res.status(400).send({ message: 'Bad request: uncorrect month' });
    }

    const dateNow = new Date();

    if (month === undefined) {
      month = dateNow.getMonth() + 1;
    }

    if (year === undefined) {
      year = dateNow.getFullYear();
    }

    if (type === undefined) {
      type = '-';
    }

    const user = await transactionModel
      .find({
        userOwner: _id,
      })
      .exec();

    const filterUser = filterBalance(type, month, year, user);

    res.status(200).send(filterUser);
  } catch (error) {
    next(error);
  }
}

async function postTransaction(req, res, next) {
  try {
    const { date, type, category, sum, comment } = req.body;
    const { _id } = req.user;

    const user = await transactionModel
      .find({
        userOwner: _id,
      })
      .exec();
    const lastUser = user[user.length - 1];
    const balance = balanceLastTransaction(lastUser, type, sum);

    const transaction = {
      date,
      type,
      category,
      sum,
      comment,
      balance: balance,
      userOwner: _id,
    };

    const newTransaction = await transactionModel.create(transaction);
    const totalUserBalance = await updateTotalBalance(_id);

    const updatedUser = await userModel.findByIdAndUpdate(
      _id,
      {
        $push: {
          transaction: {
            _id: newTransaction._id,
          },
        },
        userBalance: totalUserBalance,
      },
      {
        new: true,
      },
    );

    res.status(201).send(updatedUser);
  } catch (error) {
    next(error);
  }
}

async function deleteTransaction(req, res, next) {
  try {
    const { transactionId } = req.body;
    const { _id } = req.user;

    const removedTransaction = await transactionModel.findByIdAndDelete(
      transactionId,
    );

    if (!removedTransaction) {
      return res.status(404).send('transaction not found');
    }

    const totalUserBalance = await updateTotalBalance(_id);

    const updatedUser = await userModel.findByIdAndUpdate(
      _id,
      {
        $pull: {
          transaction: {
            _id: transactionId,
          },
        },
        userBalance: totalUserBalance,
      },
      {
        new: true,
      },
    );

    return res.status(200).send(updatedUser);
  } catch (error) {
    next(error);
  }
}

async function updateTransaction(req, res, next) {
  try {
    const { _id } = req.user;
    const { sum, comment, transactionId } = req.body;

    const oldTransaction = await transactionModel.findOne({
      _id: transactionId,
    });

    const newTransaction = {
      sum: sum || oldTransaction.sum,
      comment: comment || oldTransaction.comment,
    };

    const transactionUpdate = await transactionModel.findByIdAndUpdate(
      {
        _id: transactionId,
      },
      newTransaction,
      {
        new: true,
      },
    );

    const totalUserBalance = await updateTotalBalance(_id);

    await userModel.findByIdAndUpdate(
      _id,
      {
        userBalance: totalUserBalance,
      },
      {
        new: true,
      },
    );

    return res.status(200).send(transactionUpdate);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTransaction,
  postTransaction,
  deleteTransaction,
  updateTransaction,
  getTransactionDateFillter,
  getTransactionForStatistic,
};
