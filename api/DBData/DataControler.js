const transactionModel = require('./DataModel');
const userModel = require('../user/user.model');

async function getTransaction(req, res, next) {
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

        const dateString = dateToString()

        const user = await transactionModel
            .find({
                userOwner: _id,
            })
            .exec();
        const userDateFilter = user.filter(el => {
            return el.date === dateString

        })

        res.status(200).send(userDateFilter);
    } catch (error) {
        console.log(error);
    }
}

async function postTransaction(req, res, next) {
    try {
        const {
            date,
            type,
            category,
            sum,
            comment
        } = req.body;
        const {
            _id
        } = req.user;

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
            _id, {
                $push: {
                    transaction: {
                        _id: newTransaction._id,
                    },
                },
                userBalance: totalUserBalance,
            }, {
                new: true,
            },
        );

        const sendUser = [updatedUser, newTransaction._id]

        res.status(201).send(sendUser);
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
            return res.status(404).send('transaction not found');
        }
        await UpdateBalance(_id);
        const totalUserBalance = await updateTotalBalance(_id);

        const updatedUser = await userModel.findByIdAndUpdate(
            _id, {
                $pull: {
                    transaction: {
                        _id: transactionId,
                    },
                },
                userBalance: totalUserBalance,
            }, {
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
        const {
            _id
        } = req.user;
        const {
            sum,
            comment,
            transactionId
        } = req.body;

        const oldTransaction = await transactionModel.findOne({
            _id: transactionId,
        });

        const newTransaction = {
            sum: sum || oldTransaction.sum,
            comment: comment || oldTransaction.comment,
        };

        const transactionUpdate = await transactionModel.findByIdAndUpdate({
                _id: transactionId,
            },
            newTransaction, {
                new: true,
            },
        );
        await UpdateBalance(_id);
        const totalUserBalance = await updateTotalBalance(_id);
        const updatedUser = await userModel.findByIdAndUpdate(
            _id, {
                userBalance: totalUserBalance,
            }, {
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

function dateToString() {

    const dateNow = new Date();
    let month = dateNow.getMonth() + 1
    if (month < 10) {
        month = '0' + month
    }
    let year = dateNow.getFullYear()
    let date = dateNow.getDate()
    if (date < 10) {
        date = '0' + date
    }
    const arr = []
    arr.push(date)
    arr.push(month)
    arr.push(year)
    const string = arr.join('/')
    return string
}

module.exports = {
    getTransaction,
    postTransaction,
    deleteTransaction,
    updateTransaction,
    getTransactionDateFillter
};