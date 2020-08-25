const { Router } = require('express');
const router = Router();
const authController = require('./auth.controller');
const { tokenMiddleware } = require('../middleware/auth.middleware');
<<<<<<< HEAD
const {userValidation} = require("../middleware/validation/index")
=======
const { userValidation } = require('../middleware/validation');

>>>>>>> a8955ef46721283b0126b544f9b7023648a319ab
// const { RegValidateMiddleware } = require('./auth.validator');

// authRouter.get('/current', tokenMiddleware, AuthController.getCurrentUser);
router.post('/register', userValidation, authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/logout', tokenMiddleware, authController.logoutUser);
router.get('/verify/:verificationToken', authController.verifyEmail);
router.post('/google', authController.googleOAuth);
router.post('/facebook', authController.facebookOAuth);

exports.authRouter = router;
