const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
  modelName: String,
  description: String,
});

module.exports = mongoose.model('model', modelSchema);
