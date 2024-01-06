const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

  const userSchema = new mongoose.Schema({
    username: { type: String, required: false },
    password: { type: String, required: true },
    email: { type: String, required: true },
    fullName: { type: String, required: false },
    location: { type: String, required: false },
    phoneNumber: { type: Number, required: false },
    lastLogin: { type: Date, default: Date.now },
    accountCreationDate: { type: Date, default: Date.now }
  });
  
  userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  });
  
  module.exports = mongoose.model('User', userSchema);