const transactionModel = require('./DataModel');
const userModel = require('../user/user.model');

async function getTransaction(req, res, next) {
<<<<<<< HEAD
    try {
        const {
            _id
        } = req.user;

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

async function getTransactionDateFillter(req, res, next) {
    try {
        const {
            _id
        } = req.user;
              const user = await transactionModel
            .find({
                userOwner: _id,
            })
            .exec();

        const userDateFilter = user.sort((a, b) => {
            const stringA = a.date.split('/').reverse().join(',')
            const stringB = b.date.split('/').reverse().join(' ')
            let dateA = new Date(stringA)
            let dateB = new Date(stringB)

            return dateA - dateB
        });

        res.status(200).send(userDateFilter);
    } catch (error) {
        console.log(error);
    }
=======
  try {
    const { _id } = req.user;

    const user = await transactionModel
      .find({
        userOwner: _id,
      })
      .exec();
    res.status(200).send(user);
  } catch (error) {
    next(error);
  }
>>>>>>> 9d093fa311e8b259ce8588ee9b2f307f3249d15a
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
    next(error);
  }
}

async function postTransaction(req, res, next) {
  try {
    const { date, type, category, sum, comment } = req.body;
    const { _id } = req.user;
    if (!req.body) {
      res.status(400).send('Transaction data missing');
    }

    const user = await transactionModel
      .find({
        userOwner: _id,
      })
      .exec();
    if (!user) {
      res.status(404).send('Transactions not found');
    }

    const lastUser = user[user.length - 1];
    if (!type) {
      res.status(400).send('Type of transaction missing');
    }
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

    res.status(201).json(updatedUser);
  } catch (error) {
    next(error);
  }
}

async function deleteTransaction(req, res, next) {
    try {
        const {
            transactionId
        } = req.body;
        const {
            _id
        } = req.user;

        const removedTransaction = await transactionModel.findByIdAndDelete(
            transactionId,
        );

    if (!removedTransaction) {
      return res.status(404).send('Transaction not found');
    }
}

async function updateTransaction(req, res, next) {
  try {
    const { _id } = req.user;
    const { sum, comment, transactionId } = req.body;

    const oldTransaction = await transactionModel.findOne({
      _id: transactionId,
    });
    if (!oldTransaction) {
      res.status(404).send('Transaction not found');
    }

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
    await UpdateBalance(_id);
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
    next(error);
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

async function UpdateBalance(userId) {
    try {
        const user = await transactionModel
            .find({
                userOwner: userId,
            })
            .exec();

        user.map(async el => {
            const prev = user.indexOf(el);

            if (prev === 0) {
                switch (el.type) {
                    case '+':
                        el.balance = 0 + el.sum;

                        const updateEl = await transactionModel.findByIdAndUpdate(el._id, {
                            balance: el.balance,
                        });

                        return;
                    case '-':
                        el.balance = 0 - el.sum;
                        const updateE = await transactionModel.findByIdAndUpdate(el._id, {
                            balance: el.balance,
                        });
                        return;
                    default:
                        return console.log('not type');
                }
            } else {
                switch (el.type) {
                    case '+':
                        user[prev].balance = user[prev - 1].balance += el.sum;
                        const updateEl1 = await transactionModel.findByIdAndUpdate(el._id, {
                            balance: el.balance,
                        });
                        return;
                    case '-':
                        user[prev].balance = user[prev - 1].balance -= el.sum;
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
async function updateTotalBalance(userId) {
<<<<<<< HEAD
    const transactions = await transactionModel
        .find({
            userOwner: userId
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
function filterBalance(globalType, month, year, arr){
=======
  const transactions = await transactionModel
    .find({ userOwner: userId })
    .exec();
  const totalBalance = transactions.reduce((acc, transaction) => {
    if (transaction.type === '-') {
      acc -= transaction.sum;
    } else {
      acc += transaction.sum;
    }
    const arr = []
    arr.push(date)
    arr.push(month)
    arr.push(year)
    const string = arr.join('/')
    return string
}
function filterBalance(globalType, month, year, arr) {
>>>>>>> 9d093fa311e8b259ce8588ee9b2f307f3249d15a
  function unique(arr) {
    let result = [];
    let newResult = [];
    arr.forEach(el => {
      if (!result.includes(el.join(','))) {
        result.push(el.join(','));
      }
    });
    result.forEach(el => newResult.push(el.split(',')));
    return newResult;
  }
  function getMonth(date) {
    const month = Number(date.slice(3, 5));
    return month;
  }
  function getYear(date) {
    const year = Number(date.slice(6, 10));
    return year;
  }
  function getBalanceAll(value) {
    const ArrCategory = arr.filter(
      el =>
        el.type === value &&
        getMonth(el.date) === month &&
        getYear(el.date) === year,
    );
    return ArrCategory.reduce((acc, el) => {
      return acc + el['sum'];
    }, 0);
  }
  function getBalanceArray(value) {
    const ArrCategory = arr.filter(
      el =>
        el.category === value[0] &&
        el.type === value[1] &&
        getMonth(el.date) === month &&
        getYear(el.date) === year,
    );
    return ArrCategory.reduce((acc, val) => {
      if (value[1] === globalType) {
        if (month === getMonth(val['date']) && year === getYear(val['date'])) {
          return acc + val['sum'];
        }
      } else if ('all' === globalType) {
        if (month === getMonth(val['date']) && year === getYear(val['date'])) {
          return acc + val['sum'];
        }
      }
      return acc + val['sum'];
    }, 0);
  }
  const category = arr.reduce((acc, val) => {
    if (val.type === globalType) {
      if (month === getMonth(val['date']) && year === getYear(val['date'])) {
        acc.push([val.category, val.type]);
      }
    } else if ('all' === globalType) {
      if (month === getMonth(val['date']) && year === getYear(val['date'])) {
        acc.push([val.category, val.type]);
      }
    }
    return unique(acc);
  }, []);
  const arrayCategory = category.reduce((acc, el) => {
    acc.push({
      category: el[0],
      type: el[1],
      sum: getBalanceArray(el),
    });
    return acc;
  }, []);
  const profit = getBalanceAll('+');
  const exes = getBalanceAll('-');
  const finalObject = {
    arr: arrayCategory,
    income: profit,
    expenses: exes,
  };
  return finalObject;
}

// function dateToString() {

//     const dateNow = new Date();
//     let month = dateNow.getMonth() + 1
//     if (month < 10) {
//         month = '0' + month
//     }
//     let year = dateNow.getFullYear()
//     let date = dateNow.getDate()
//     if (date < 10) {
//         date = '0' + date
//     }
//     const arr = []
//     arr.push(date)
//     arr.push(month)
//     arr.push(year)
//     const string = arr.join(' ')
//     return string
// }

module.exports = {
<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 9d093fa311e8b259ce8588ee9b2f307f3249d15a
  getTransaction,
  postTransaction,
  deleteTransaction,
  updateTransaction,
  getTransactionForStatistic,
};
<<<<<<< HEAD
=======
=======
    getTransaction,
    postTransaction,
    deleteTransaction,
    updateTransaction,
    getTransactionDateFillter
};
>>>>>>> origin/B8-1
>>>>>>> 9d093fa311e8b259ce8588ee9b2f307f3249d15a
