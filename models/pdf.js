const mongoose = require('mongoose');

const pdfSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
  },
  uploadDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

module.exports = mongoose.model('pdf', pdfSchema);
