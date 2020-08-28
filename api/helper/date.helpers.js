const getMonth = date => Number(date.slice(3, 5));

const getYear = date => Number(date.slice(6, 10));

module.exports = {
  getMonth,
  getYear,
};
