const transactionModel = require('../DBData/DataModel');
const { getMonth, getYear } = require('./date.helpers');

const sortTransactions = user => {
  const sort = [
    ...user.sort((a, b) => {
      const stringA = a.date.split('/').reverse().join(',');
      const stringB = b.date.split('/').reverse().join(' ');
      let dateA = new Date(stringA);
      let dateB = new Date(stringB);

      return dateA - dateB;
    }),
  ];

  return sort;
};

const balanceLastTransaction = (lastTransaction, type, sum) => {
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
};

const updateTotalBalance = async userId => {
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
};

const unique = arr => {
  let result = [];
  let newResult = [];

  arr.forEach(el => {
    if (!result.includes(el.join(','))) {
      result.push(el.join(','));
    }
  });

  result.forEach(el => newResult.push(el.split(',')));

  return newResult;
};

const getBalanceAll = (value, arr, month, year) => {
  const balance = arr
    .filter(
      el =>
        el.type === value &&
        getMonth(el.date) === month &&
        getYear(el.date) === year,
    )
    .reduce((acc, el) => acc + el['sum'], 0);

  return balance;
};

const getBalanceArray = (value, arr, month, year, globalType) => {
  const balanseArray = arr
    .filter(
      el =>
        el.category === value[0] &&
        el.type === value[1] &&
        getMonth(el.date) === month &&
        getYear(el.date) === year,
    )
    .reduce((acc, val) => {
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

  return balanseArray;
};

const filterBalance = (globalType, month, year, arr) => {
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
      sum: getBalanceArray(el, arr, month, year, globalType),
    });

    return acc;
  }, []);

  const profit = getBalanceAll('+', arr, month, year);

  const exes = getBalanceAll('-', arr, month, year);

  const finalObject = {
    arr: arrayCategory,
    income: profit,
    expenses: exes,
  };

  return finalObject;
};

const updateBalance = arr => {
  try {
    arr.map(async el => {
      const prev = arr.indexOf(el);

      if (prev === 0) {
        switch (el.type) {
          case '+':
            el.balance = 0 + el.sum;

            await transactionModel.findByIdAndUpdate(el._id, {
              balance: el.balance,
            });

            return;
          case '-':
            el.balance = 0 - el.sum;

            await transactionModel.findByIdAndUpdate(el._id, {
              balance: el.balance,
            });

            return;
          default:
            return console.log('not type');
        }
      } else {
        switch (el.type) {
          case '+':
            arr[prev].balance = arr[prev - 1].balance += el.sum;

            await transactionModel.findByIdAndUpdate(el._id, {
              balance: el.balance,
            });

            return;
          case '-':
            arr[prev].balance = arr[prev - 1].balance -= el.sum;

            await transactionModel.findByIdAndUpdate(el._id, {
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
};

module.exports = {
  sortTransactions,
  balanceLastTransaction,
  updateTotalBalance,
  filterBalance,
  updateBalance,
};
