const mongoose = require('mongoose');
const { Schema } = require('mongoose');


const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  name: { type: String, required: true, unique: true },
  token: { type: String, required: false },
  transaction: [
    {
      type: {
        type: Schema.Types.ObjectId,
        ref: 'TransactionData',
      },
    },
  ],
  status: {
    type: String,
    required: true,
    enum: ['Verified', 'Created'],
    default: 'Created',
  },
  verificationToken: { type: String, required: false },
  googleId: { type: String, required: false },
  facebookId: { type: String, required: false },
  userBalance: { type: Number, required: false },
});
userSchema.static('updateUser', async function(id, updateParams) {
  const user = await this.findById(id);
  if (!user) throw new Error('User not found');

  Object.keys(updateParams).forEach(name => {
    user[name] = updateParams[name];
  });

  return user.save();
});

userSchema.static('initUserFromGoogle', async function(email, name, googleId) {
  const user = await this.findOne({ googleId });

  if (user) return user;

  return new this({
    email,
    name: name.replace(/\s/gim, '_').toLowerCase(),
    googleId,
  });
});

userSchema.static('initUserFromFacebook', async function(
  email,
  name,
  facebookId,
) {
  const user = await this.findOne({ facebookId });

  if (user) return user;

  return new this({
    email,
    name: name.replace(/\s/gim, '_').toLowerCase(),
    facebookId,
  });
});

userSchema.static('findByVerificationToken', async function(verificationToken) {
  return this.findOne({
    verificationToken,
  });
});

userSchema.static('verifyUser', async function(id) {
  return this.findByIdAndUpdate(
    id,
    {
      status: 'Verified',
      verificationToken: null,
    },
    {
      new: true,
    },
  );
});

const userModel = mongoose.model('User', userSchema);
module.exports = userModel;
