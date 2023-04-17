const ipfsClient = require('ipfs-http-client');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const dotenv = require('dotenv');

dotenv.config();

function getipfsClient() {
  const ipfs = ipfsClient.create({
    host: 'localhost',
    port: '5001',
    protocol: 'http',
  });
  return ipfs;
}

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  fileUpload({
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: '/tmp/',
    limits: { fileSize: 50 * 1024 * 1024 },
    safeFileNames: true,
    preserveExtension: true,
    abortOnLimit: true,
    responseOnLimit: 'File size limit has been reached',
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

//  Should Use a proper database like MongoDB, PostgreSQL, etc. for storing user data but here im just using a txt file cause its just ruuning om my local server
const userDataFile = 'users.txt';

const readUserData = () => {
  try {
    const data = fs.readFileSync(userDataFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(err);
    return [];
  }
};

const writeUserData = (data) => {
  fs.writeFileSync(userDataFile, JSON.stringify(data), 'utf8');
};

// Middleware for checking if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get('/', isAuthenticated, (req, res) => {
  res.redirect('/home');
});

app.get('/register', (req, res) => {
  res.render('register', { errorMessage: '' });
});

app.post('/register', async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const users = readUserData();
    const user = users.find((u) => u.username === username);
    if (user) {
      return res.render('register', { errorMessage: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username: username, password: hashedPassword });
    writeUserData(users);
    req.session.user = { username: username };
    res.redirect('/home');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.get('/login', (req, res) => {
  res.render('login', { errorMessage: '' });
});

app.post('/login', async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const users = readUserData();
    const user = users.find((u) => u.username === username);
    if (!user) {
      return res.render('login', { errorMessage: 'Invalid login credentials' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', { errorMessage: 'Invalid login credentials' });
    }
    req.session.user = { username: username };
    res.redirect('/home');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.get('/home', isAuthenticated, (req, res) => {
  res.render('home', { user: req.session.user });
});

// Routes for handling file uploads, etc.
app.post('/upload', async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const userFolder = `./users/${req.session.user.username}`;
  if (!fs.existsSync(userFolder)) {
    fs.mkdirSync(userFolder);
  }

  const files = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
  const fileHashes = await Promise.all(
    files.map(async (file) => {
      const fileTimestamp = Date.now().toString() + '_' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const fileName = `${fileTimestamp}_${file.name}`;
      const filePath = `${userFolder}/${fileName}`;

      await file.mv(filePath);
      const fileHash = await addFile(fileName, filePath);
      fs.unlink(filePath, (err) => {
        if (err) console.log(err);
      });

      const fileUrl = `http://localhost:8080/ipfs/${fileHash}`;
      return { fileName, fileHash, fileUrl };
    })
  );

  const fileInfo = fileHashes.map((file) => {
    return `${file.fileName}: ${file.fileHash} - ${file.fileUrl}`;
  }).join('\n');

  const userFile = `${userFolder}/${req.session.user.username}.txt`;
  fs.appendFileSync(userFile, fileInfo + '\n');

  res.render('upload', { files: fileHashes });
});


const addFile = async (fileName, filePath) => {
  const ipfs = getipfsClient(); 
  const file = fs.readFileSync(filePath);
  const fileAdded = await ipfs.add({path: fileName, content: file}); 
  const fileHash = fileAdded.cid.toString(); 
  return fileHash;
};

app.listen(process.env.PORT || 3000, () => {
  console.log('Server started on port 3000');
});

