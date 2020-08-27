const bcrypt = require('bcrypt');
const userModel = require('../user/user.model');
const { sault } = require('../config');
const {
  creatToken,
  getUserInfoFromGoogle,
  getUserInfoFromFacebook,
} = require('../services/auth.services');
const { SendVerificationMail } = require('../services/email.sender');
// const errorHandler = require('../helper/errors.constructors');

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
        id: user._id,
        status: user.status,
        verificationToken: user.verificationToken,
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
        name: userWithToken.name,
        id: userWithToken._id,
        token: newToken,
        transactions: userWithToken.transactions,
        userBalance: user.userBalance,
        status: user.status
      });
    } catch (error) {
      res.status(500).send('Server error');
    }
  }

  async googleOAuth(req, res) {
    try {
      const { accessToken } = req.body;

      const userInfoResponse = await getUserInfoFromGoogle(accessToken);

      const { email, sub, name } = userInfoResponse;

      const user = await userModel.initUserFromGoogle(email, name, sub);

      const newToken = await creatToken(user._id);

      user.token = newToken;
      user.status = 'Verified';

      await user.save();

      return res.status(201).json({
        email: user.email,
        name: user.name,
        id: user._id,
        token: newToken,
        transactions: user.transactions,
        userBalance: user.userBalance,
        status: user.status
      });
    } catch (error) {
      return res.status(500).send('Server error');
    }
  }

  async facebookOAuth(req, res) {
    try {
      const { accessToken } = req.body;

      const userInfoResponse = await getUserInfoFromFacebook(accessToken);

      const { email, id, name } = userInfoResponse;

      const user = await userModel.initUserFromFacebook(email, name, id);

      const newToken = await creatToken(user._id);

      user.token = newToken;
      user.status = 'Verified';

      await user.save();

      return res.status(201).json({
        email: user.email,
        name: user.name,
        id: user._id,
        token: newToken,
        transactions: user.transactions,
        userBalance: user.userBalance,
        status: user.status
      });
    } catch (error) {
      return res.status(500).send('Server error');
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
        return console.log('test'); 
      }

      await userModel.verifyUser(userToVerify._id);
      res.redirect('https://wallet-fp-28.netlify.app/login');
      return res.status(200).send('Your mail successfully verified');
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






// class AuthController {
//   async registerUser(req, res) {
//     try {
//       const { email, password, name, confirmPassword } = req.body;

//       if (password !== confirmPassword) {
//         throw new Error ("Password do not match")
//       }
//       const userEmail = await userModel.findOne({ email });
//       if (userEmail) {
//         return res
//           .status(409)
//           .send('User with such email already exists');
//       }
//       const userName = await userModel.findOne({ name });
//       if (userName) {   throw new Error("User with such name already exists");
//       }

//       const hashPassword = await bcrypt.hash(password, sault);

//       const userData = { ...req.body, password: hashPassword };

//       const user = await userModel.create(userData);
//       if (!user) {
//         throw new Error("User not create");
//       }

//       const verificationToken = await creatToken(user._id);
//       await userModel.updateUser(user._id, { verificationToken });
//       await SendVerificationMail(verificationToken, user.email);

//       return res.status(201).send({
//         email: user.email,
//         name: user.name,
//         id: user._id,
//         status: user.status,
//         verificationToken: user.verificationToken,
//       });
//     } catch (e) {
//       errorHandler(e, req, res)
//     }
//   }

//   async loginUser(req, res) {
//     try {
//       const { email, password } = req.body;
//       const user = await userModel.findOne({ email });
//       if (!user) {
//         return res.status(401).send({ message: 'Email or password is wrong' });
//       }
//       const isValidPassword = await bcrypt.compare(password, user.password);
//       if (!isValidPassword) {
//         return res.status(401).send({ message: 'Email or password is wrong' });
//       }

//       if (!user.verificationToken === 'Verified') {
//         return res.status(403).send('User is not active');
//       }
//       const newToken = await creatToken(user._id);
//       const userWithToken = await userModel.findByIdAndUpdate(user._id, {
//         token: newToken,
//       });
//       res.status(200).json({
//         email: userWithToken.email,
//         name: userWithToken.name,
//         id: userWithToken._id,
//         token: newToken,
//         transactions: userWithToken.transactions,
//         userBalance: user.userBalance,
//         status: user.status
//       });
//     } catch (error) {
//       res.status(500).send('Server error');
//     }
//   }

//   async googleOAuth(req, res) {
//     try {
//       const { accessToken } = req.body;

//       const userInfoResponse = await getUserInfoFromGoogle(accessToken);

//       const { email, sub, name } = userInfoResponse;

//       const user = await userModel.initUserFromGoogle(email, name, sub);

//       const newToken = await creatToken(user._id);

//       user.token = newToken;
//       user.status = 'Verified';

//       await user.save();

//       return res.status(201).json({
//         email: user.email,
//         name: user.name,
//         id: user._id,
//         token: newToken,
//         transactions: user.transactions,
//         userBalance: user.userBalance,
//         status: user.status
//       });
//     } catch (error) {
//       return res.status(500).send('Server error');
//     }
//   }

//   async facebookOAuth(req, res) {
//     try {
//       const { accessToken } = req.body;

//       const userInfoResponse = await getUserInfoFromFacebook(accessToken);

//       const { email, id, name } = userInfoResponse;

//       const user = await userModel.initUserFromFacebook(email, name, id);

//       const newToken = await creatToken(user._id);

//       user.token = newToken;
//       user.status = 'Verified';

//       await user.save();

//       return res.status(201).json({
//         email: user.email,
//         name: user.name,
//         id: user._id,
//         token: newToken,
//         transactions: user.transactions,
//         userBalance: user.userBalance,
//         status: user.status
//       });
//     } catch (error) {
//       return res.status(500).send('Server error');
//     }
//   }

//   async logoutUser(req, res) {
//     try {
//       const { user } = req;
//       await userModel.findByIdAndUpdate(user._id, { token: null });
//       // res.redirect('Login_page') ;
//       return res.status(204).send();
//     } catch (error) {
//       res.status(500).send('Server error');
//     }
//   }

//   async verifyEmail(req, res) {
//     try {
//       const { verificationToken } = req.params;

//       const userToVerify = await userModel.findByVerificationToken(
//         verificationToken,
//       );

//       if (!userToVerify) {
//         return console.log('test'); //змінити на throw Error
//       }

//       await userModel.verifyUser(userToVerify._id);
//       res.redirect('https://wallet-fp-28.netlify.app/login');
//       return res.status(200).send('Your mail successfully verified');
//     } catch (error) {
//       res.status(500).send('Server error');
//     }
//   }

//   getCurrentUser(req, res) {
//     const { user } = prepareUserResponse(req.user);
//     return res.status(200).send(user);
//   }
// }

// module.exports = new AuthController();
