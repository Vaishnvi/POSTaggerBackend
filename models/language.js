const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema({
  languageName: String,
  languageCode: String,
  description: String,
});

module.exports = mongoose.model('Language', languageSchema);
