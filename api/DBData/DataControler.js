const transactionModel = require('./DataModel');
const userModel = require('../user/user.model');

async function getTransaction(req, res, next) {
  try {
    const { _id } = req.user;

    const user = await transactionModel
      .find({
        userOwner: _id,
      })
      .exec();

    res.status(200).send(user);
  } catch (error) {
    console.log(error);
  }
}

async function getTransactionForStatistic(req, res) {
    try {
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
      const { _id } = req.user;
  
      const user = await transactionModel
        .find({
          userOwner: _id,
        })
        .exec();
  
      const filterUser = filterBalance(type, month, year, user);
  
      res.status(200).send(filterUser);
    } catch (error) {
      console.log(error);
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

    const userDateFilter = user.sort((a, b) => {
      const stringA = a.date.split('/').reverse().join(',');
      const stringB = b.date.split('/').reverse().join(' ');
      let dateA = new Date(stringA);
      let dateB = new Date(stringB);

      return dateA - dateB;
    });

    await UpdateBalance2(userDateFilter);
    const transactions = await transactionModel
      .find({
        userOwner: _id,
      })
      .exec();

    res.status(200).send(transactions);
  } catch (error) {
    console.log(error);
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
    const updatedUser = await userModel.findByIdAndUpdate(
      _id,
      {
        userBalance: totalUserBalance,
      },
      {
        new: true,
      },
    );

    res.status(200).send(transactionUpdate);
  } catch (error) {
    console.log('Error', error);
  }
}

function balanceLastTransaction(lastTransaction, type, sum) {
  switch (type) {
    case '+':
      if (lastTransaction == undefined) {
        return +sum;
      }
      return (lastTransaction.balance += sum);
    case '-':
      if (lastTransaction.balance === undefined) {
        return -sum;
      }
      return (lastTransaction.balance -= sum);
    default:
      return console.log('not type');
  }
}

async function updateTotalBalance(userId) {
  const transactions = await transactionModel
    .find({
      userOwner: userId,
    })
    .exec();

  const totalBalance = transactions.reduce((acc, transaction) => {
    if (transaction.type === '-') {
      acc -= transaction.sum;
    } else {
      acc += transaction.sum;
    }
    return acc;
  }, 0);
  return totalBalance;
}

function dateToString() {
  const dateNow = new Date();
  let month = dateNow.getMonth() + 1;
  if (month < 10) {
    month = '0' + month;
  }
  let year = dateNow.getFullYear();
  let date = dateNow.getDate();
  if (date < 10) {
    date = '0' + date;
  }
  const arr = [];
  arr.push(date);
  arr.push(month);
  arr.push(year);
  const string = arr.join('/');
  return string;
}

async function UpdateBalance2(arr) {
  try {
    arr.map(async el => {
      const prev = arr.indexOf(el);

      if (prev === 0) {
        switch (el.type) {
          case '+':
            el.balance = 0 + el.sum;

            const updateEl = await transactionModel.findByIdAndUpdate(el._id, {
              balance: el.balance,
            });
            console.log(updateEl);
            return;
          case '-':
            el.balance = 0 - el.sum;
            const updateE = await transactionModel.findByIdAndUpdate(el._id, {
              balance: el.balance,
            });
            console.log(updateE);
            return;
          default:
            return console.log('not type');
        }
      } else {
        switch (el.type) {
          case '+':
            arr[prev].balance = arr[prev - 1].balance += el.sum;
            const updateEl1 = await transactionModel.findByIdAndUpdate(el._id, {
              balance: el.balance,
            });
            return;
          case '-':
            arr[prev].balance = arr[prev - 1].balance -= el.sum;
            const updateEl2 = await transactionModel.findByIdAndUpdate(el._id, {
              balance: el.balance,
            });
            return;
          default:
            return console.log('not type');
        }
      }
    });
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  getTransaction,
  postTransaction,
  deleteTransaction,
  updateTransaction,
  getTransactionDateFillter,
  getTransactionForStatistic
};
