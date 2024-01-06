require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE_URL;
const routes = require('./routes/routes');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
//const fileUpload = require('express-fileupload');

const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');

const SESSION_SECRET = 'my_random_secret_key_1234567890';

app.use(cookieParser());

const sessionStore = MongoStore.create({ mongoUrl: mongoString });

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { secure: true },
}));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
    console.log(error)
})

database.once('connected', () => {
    console.log('Database Connected');
})

//app.use(fileUpload());

//app.options('*', cors());

//app.use(cors()); // This will enable CORS for all routes


app.use(cors({
  origin: 'http://localhost:3000', // replace with your client's domain
  credentials: true
}));


app.use('/api', routes)

app.use(express.json());

app.listen(8000, () => {
    console.log(`Server Started at ${8000}`)
})  

//module.exports = upload; 
