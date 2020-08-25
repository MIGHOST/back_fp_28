const userModel = require('./user.model');

class UserController {
  async getUsers(req, res) {
    try {
      const {token} = req.user;
      const user = await userModel.find({token});
      if (!user) {
        return res.status(400).send({ message: 'User not founded' });
      }
      return res.status(201).send(user);
    } catch (error) {
      res.status(500).send('Server error');
    }
  }


}

module.exports = new UserController();
