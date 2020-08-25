const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const sgMail = require('@sendgrid/mail');

const { PORT, SENDGRID_API_KEY } = process.env;

sgMail.setApiKey(SENDGRID_API_KEY);

exports.SendVerificationMail = async (verificationToken, email) => {

  const msg = {
    to: email,
    from: 'mih.s.sidorenko@gmail.com',
    subject: 'Verification',
    text: 'Verify your email',
    html: `<a href="https://powerful-waters-91620.herokuapp.com/auth/verify/${verificationToken}">Confirm your account</a>`, 
  };
  return await sgMail.send(msg);
};
