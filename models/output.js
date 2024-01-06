const mongoose = require('mongoose');

const outputSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },  
  pdfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pdf',
    required: true,
  },
  textInput: String,
  posOutput: String,
  generationTime: Date,
});

module.exports = mongoose.model('Output', outputSchema);
