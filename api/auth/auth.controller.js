const bcrypt = require('bcrypt');
const userModel = require('../user/user.model');
const { sault } = require('../config');
const { creatToken } = require('../services/auth.services');
const { SendVerificationMail } = require('../services/email.sender');
// const { prepareUserResponse } = require('../../helpers/helpers');

class AuthController {
  async registerUser(req, res) {
    try {
      const { email, password, name, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        return res.status(401).send({ message: 'Passwords do not match' });
      }
      const userEmail = await userModel.findOne({ email });
      if (userEmail) {
        return res
          .status(409)
          .send({ message: 'User with such email already exists' });
      }
      const userName = await userModel.findOne({ name });
      if (userName) {
        return res
          .status(409)
          .send({ message: 'User with such name already exists' });
      }

      const hashPassword = await bcrypt.hash(password, sault);

      const userData = { ...req.body, password: hashPassword };

      const user = await userModel.create(userData);
      if (!user) {
        return res.status(400).send({ message: 'User not creat' });
      }

      const verificationToken = await creatToken(user._id);
      await userModel.updateUser(user._id, { verificationToken });
      await SendVerificationMail(verificationToken, user.email);

      return res.status(201).send({
        email: user.email,
        name: user.name,
        status: user.status,
      });
    } catch (error) {
      res.status(500).send('Server error');
    }
  }

  async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(401).send({ message: 'Email or password is wrong' });
      }
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).send({ message: 'Email or password is wrong' });
      }

      if (!user.verificationToken === 'Verified') {
        return res.status(403).send('User is not active');
      }
      const newToken = await creatToken(user._id);
      const userWithToken = await userModel.findByIdAndUpdate(user._id, {
        token: newToken,
      });
      res.status(200).json({
        email: userWithToken.email,
        subscription: userWithToken.subscription,
        token: newToken,
      });
    } catch (error) {
      res.status(500).send('Server error');
    }
  }

  async logoutUser(req, res) {
    try {
      const { user } = req;
      await userModel.findByIdAndUpdate(user._id, { token: null });
      return res.status(204).send();
    } catch (error) {
      res.status(500).send('Server error');
    }
  }

  async verifyEmail(req, res) {
    try {
      const { verificationToken } = req.params;

      const userToVerify = await userModel.findByVerificationToken(
        verificationToken,
      );
      if (!userToVerify) {
        throw new Error('User not found');
      }

      await userModel.verifyUser(userToVerify._id);
      res.redirect('http://localhost:3000');
      return res.status(200);
    } catch (error) {
      res.status(500).send('Server error');
    }
  }

  getCurrentUser(req, res) {
    const { user } = prepareUserResponse(req.user);
    return res.status(200).send(user);
  }
}

module.exports = new AuthController();
