//const Model = require('../models/model');
//console.log("here", Model)
const express = require('express');
const router = express.Router()
const User = require('../models/user');
const PDF = require('../models/pdf');
const Output = require('../models/output');
const { GridFSBucket } = require('mongodb');
const { spawn } = require('child_process');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const multer = require('multer');
//const upload = require('../server');
const fs = require('fs');
//const database = require('../server'); // Path to your server.js file

const pdf = require('pdfkit');
const path = require('path');
/*
var beautify = require('js-beautify').js;
var pos = require('pos');
var words = new pos.Lexer().lex('This is some sample text. This text can contain anything.');
var tagger = new pos.Tagger();
var taggedWords = tagger.tag(words);
console.log(beautify(JSON.stringify(taggedWords), { indent_size: 2 }));
*/

// ******************************** INSERT MODELS IN DB ******************************

// Import your model
const Model = require('../models/model');

// Define your new model
let newModelData = {
  modelName: 'POS Tagger',
  description: 'An API to get POS tag for each word given text or file input',
};

// Use an async function to handle the database operations
async function checkAndSaveModel() {
    try {
      // Check if a model with the same modelName already exists
      let model = await Model.findOne({ modelName: newModelData.modelName });
  
      if (model) {
        console.log('A model with this name already exists');
      } else {
        // If the model doesn't exist, create a new one
        let newModel = new Model(newModelData);
        await newModel.save();
        console.log('Model saved successfully');
      }
    } catch (err) {
      console.log('Something went wrong:', err);
    }
  }
  
  // Call the function
  checkAndSaveModel();


// ******************************** Return all the models in db to frontend **********************

  // Create an API endpoint that returns all models
router.get('/models', async (req, res) => {
    try {
      const models = await Model.find({});
      //console.log("models",models)
      res.json(models);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });


// ******************************** SIGN IN ***************************************

router.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  console.log("Hi, this got called")

  // Find user by email id
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);

  //console.log(user, password, user.password, isMatch)

  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  console.log("this is session id",req.session);
  //console.log(req.session.id);

  // Set user_id in session
  req.session.email = user.email;
  req.session.user_id = user._id;

  req.session.save(err => {
    if(err) {
      console.log("error saving session")
    } else {
      console.log("session saved")
    }
  });
  console.log("user email", req.session.email, "user id",user._id, req.session)
  console.log(req.session.id);

  // User is authenticated
  //res.json({ message: 'User authenticated successfully' });
    res.json({ message: 'User authenticated successfully', user_id: user._id, user_email: user.email });
});


// ******************************** SIGN UP ********************************

router.post('/signup', async (req, res) => {
    const { username, password, email, fullName, location, phoneNumber } = req.body;
  
    // Check if user already exists
    const existingUser = await User.findOne({ email });
  
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
  
    // Hash password (already hashed in user.js)
    //const hashedPassword = await bcrypt.hash(password, 10);
  
    // Create new user
    const user = new User({
      username,
      password,
      email,
      fullName,
      location,
      phoneNumber,
      lastLogin: new Date(),
      accountCreationDate: new Date()
    });
  
    // Save user to database
    await user.save();
  
    res.json({ message: 'User registered successfully' });
  });

// ******************************** Pos Tagger API without Sign In ********************************

router.post('/upload-text', async (req, res) => {
    console.log("req.body",req.body)
    const text = req.body.text;
    console.log("text",text);

    // Run the POS tagger on the file or text
    const languageMap = {
      'Hindi': 'hin',
      'Punjabi': 'pan',
      'Telugu': 'tel',
      'Tamil': 'tam',
      'Malayalam': 'mal',
      'Kannada': 'kan',
      'Urdu': 'urd'
    };
    const languageName = req.body.language;
    const languageCode = languageMap[languageName];
    console.log("language name",languageName)
    console.log("language code",languageCode)
    let output;
    if (text !== null && text !== undefined) {
      const inputPath = '/Users/vaishnavikhindkar/Documents/PL/POSTagger_Backend/models/utils/input_file.txt'; //path.join(__dirname, '..', 'input.txt');
      fs.writeFileSync(inputPath, text);
      output = await runShallowParser(languageCode, inputPath);
      console.log(output)
      //fs.unlinkSync(inputPath);
    } else {
      return res.status(400).json({ error: 'Text must be provided' });
    }
  
    const outputBuffer = output;

    res.send(outputBuffer);
  
  });


// ******************************** Pos Tagger API using Sign In ********************************

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '/Users/vaishnavikhindkar/Documents/PL/POSTagger_Backend/models/utils/files') // Specify the path where you want to save the files.
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now()) // Specify the filename.
    }
  })
  
var upload = multer({ storage: storage })

router.post('/upload-file', upload.single('file'), async (req, res) => {
    console.log("req.body",req.body)
    const userId = req.body.userId; //req.session.user_id;
    console.log("User Id",userId)
    //console.log(req.session.id);
    //console.log("session", req.session, "userId",userId)
    const file = req.file;
    console.log("file",file);
    if(file || file!==undefined){
        const filePath = file.path;
        console.log("filePath",filePath);
        const fileName = file.name;
        console.log("fileName",fileName);
    }
    const text = req.body.text;
    console.log("text",text);

    // Run the POS tagger on the file or text
    const languageMap = {
      'Hindi': 'hin',
      'Punjabi': 'pan',
      'Telugu': 'tel',
      'Tamil': 'tam',
      'Malayalam': 'mal',
      'Kannada': 'kan',
      'Urdu': 'urd'
    };
    const languageName = req.body.language;
    const languageCode = languageMap[languageName];
    console.log("language name",languageName)
    console.log("language code",languageCode)
    let output;
    if (file || file!==undefined) {
      const inputPath = file.path;
      console.log(inputPath)
      output = await runShallowParser(languageCode, inputPath);
    } else if (text !== null && text !== undefined) {
      const inputPath = '/Users/vaishnavikhindkar/Documents/PL/POSTagger_Backend/models/utils/input_file.txt'; //path.join(__dirname, '..', 'input.txt');
      fs.writeFileSync(inputPath, text);
      output = await runShallowParser(languageCode, inputPath);
      console.log(output)
      //fs.unlinkSync(inputPath);
    } else {
      return res.status(400).json({ error: 'Either file or text must be provided' });
    }
  
    // Save the PDF file to MongoDB
    const pdfDoc = new PDF({
        userId,
        filename: file ? file.originalname : '/Users/vaishnavikhindkar/Documents/PL/POSTagger_Backend/models/utils/input_file.txt', //input.txt',
        contentType: file ? file.mimetype : 'text/plain',
        uploadDate: new Date(),
    });

    console.log(pdfDoc, "pdfDoc.userId:",pdfDoc.userId, "pdfDoc._id:",pdfDoc._id)

    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'pdfs' });
    const uploadStream = bucket.openUploadStream(pdfDoc.filename, { contentType: pdfDoc.contentType });
    const readStream = file ? fs.createReadStream(file.path) : new Readable({ read() { this.push(text); this.push(null); } });
    readStream.pipe(uploadStream);
  
    // Run the POS tagger on the PDF file
    const pdfId = uploadStream.id;
    console.log("pdfId", pdfId)
    //const pdfOutput = await runShallowParser(languageCode, pdfId);

    //const pdfId = pdfDoc._id;
  
    // Save the POS tagger output to MongoDB
    const outputDoc = new Output({
      userId,
      pdfId,
      textInput: file ? '' : text,
      posOutput: output,
      generationTime: new Date(),
    });

    console.log(outputDoc, "outputDoc.userId",outputDoc.userId, "outputDoc.pdfId",outputDoc.pdfId)

    //outputDoc.text(output);

    await outputDoc.save();

/*    const doc = new pdf();
    doc.pipe(fs.createWriteStream('output.pdf'));
    doc.text(output);

    doc.end();

    const file1 = `${__dirname}/output.pdf`;
    res.sendFile(file1);*/

    const outputBuffer = outputDoc.posOutput;

    //const blob = new Blob([outputBuffer], { type: 'application/pdf' });

    // Send the PDF file as a response to the client
    //res.setHeader('Content-Type', 'application/pdf');
    //res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
    res.send(outputBuffer);
  
    // Update the user's last login time
    try {
        const user = await User.findById(userId);
        console.log(user)
        user.lastLogin = new Date();
        await user.save();
    } catch (error) {
        console.error(error);
    }
      

    //const user = await User.findById(userId);
    //console.log(user)
    //user.lastLogin = new Date();
    //await user.save();
  
    // Send the response to the client
    //res.json({ success: true });
  });
  
  
  function runShallowParser(languageCode, inputPath) {
    return new Promise((resolve, reject) => {
      //console.log(inputPath)
      const scriptPath = '/Users/vaishnavikhindkar/Documents/PL/POSTagger_Backend/models/utils/run_shallow_parser_and_convert_into_conll.sh'; //path.join(__dirname, '..', 'utils', 'run_shallow_parser_and_convert_into_conll.sh');
      const args = [scriptPath, inputPath, languageCode, 1];
      const process = spawn('bash', args);
  
      let output = '';
      let error = '';
  
      process.stdout.on('data', (data) => {
        const str = data.toString();
        console.log("str",str)
        if (str.includes('sentencesList1')) {
            output = str.replace(/.*sentencesList1/, '')
            .replace(/.*inputFilePath/,'')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/sentencesList1/g, '')
            ;
        }
      });
      
      
      process.stderr.on('data', (data) => {
        error += data.toString();
      });
  
      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Process exited with code ${code}: ${error}`));
        } else {
          resolve(output);
        }
      });
    });
  }

  

  module.exports = router;



/*

//Get all Method
router.get('/getAll', (req, res) => {
    res.send('Get All API')
})


//Get by ID Method
router.get('/getOne/:id', (req, res) => {
    res.send(req.params.id)
})



//Update by ID Method
router.patch('/update/:id', (req, res) => {
    res.send('Update by ID API')
})

//Delete by ID Method
router.delete('/delete/:id', (req, res) => {
    res.send('Delete by ID API')
})



//Post method
router.post('/post', async (req, res) => {
    const data = new Model({
        name: req.body.name,
        age: req.body.age
    })

    try {
        const dataToSave = await data.save();
        res.status(200).json(dataToSave)
    }
    catch (error) {
        res.status(400).json({message: error.message})
    }
})

//GetAll method
router.get('/getAll', async (req, res) => {
    try{
        const data = await Model.find();
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

//Get by ID Method
router.get('/getOne/:id', async (req, res) => {
    try{
        const data = await Model.findById(req.params.id);
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

//Delete by ID Method
router.delete('/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const data = await Model.findByIdAndDelete(id)
        res.send(`Document with ${data.name} has been deleted..`)
    }
    catch (error) {
        res.status(400).json({ message: error.message })
    }
})

*/
