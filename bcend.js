const ipfsClient = require('ipfs-http-client');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const dotenv = require('dotenv');

var path = require('path');

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

// added for static files error - ayush
app.use(express.static(path.join(__dirname,'public')));

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
  try {
    fs.writeFileSync(userDataFile, JSON.stringify(data), 'utf8');
  } catch (err) {
    console.error(err);
  }
};

// Middleware for checking if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get('/', (req, res) => {
  res.render('login', { user: req.session.user, errorMessage: '' });
});

app.get('/home', (req, res) => {
  res.render('login', { errorMessage: '' });
});

app.get('/about', (req, res) => {
  res.render('about', { errorMessage: '' });
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
    res.redirect('/login');
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
    res.redirect('/upload');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});

app.post('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.status(400).send('Unable to log out');
      } else {
        res.redirect('/login');
      }
    });
  } else {
    res.end();
  }
});

app.get('/upload', isAuthenticated, (req, res) => {
  if (!req.session.user || !req.session.user.username) {
    return res.redirect('/login'); // Redirect to login if user is not authenticated
  }
  const userFolder = `./users/${req.session.user.username}`;
  fs.readFile(`${userFolder}/${req.session.user.username}.txt`, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }

    const fileList = data.split('\n').filter(line => line.trim() !== '');
    res.render('upload.ejs', { user: req.session.user, fileList });
  });
});

app.post('/delete/:index', (req, res) => {
  if (!req.session.user || !req.session.user.username) {
    return res.redirect('/login'); // Redirect to login if user is not authenticated
  }
  const userFolder = `./users/${req.session.user.username}`;
  fs.readFile(`${userFolder}/${req.session.user.username}.txt`, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }

    let fileList = data.split('\n').filter(line => line.trim() !== '');
    const index = parseInt(req.params.index, 10); // Get the index from the request parameters
    if (index >= 0 && index < fileList.length) {
      fileList.splice(index, 1);

      // Save the updated file list back to the text file
      fs.writeFile(`${userFolder}/${req.session.user.username}.txt`, fileList.join('\n'), 'utf8', (err) => {
        if (err) {
          console.error(err);
          return res.status(500).send('Internal Server Error');
        }

        res.redirect('/upload');
      });
    } else {
      res.status(404).send('Record not found');
    }
  });
});

// Routes for handling file uploads, etc.
app.post('/uploaded', async (req, res) => {
  if (!req.session.user || !req.session.user.username) {
    return res.redirect('/login'); // Redirect to login if user is not authenticated
  }
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
    return `${file.fileName} - ${file.fileHash} - ${file.fileUrl}`;
  }).join('\n');

  const userFile = `${userFolder}/${req.session.user.username}.txt`;
  fs.appendFileSync(userFile, fileInfo + '\n');

  res.render('uploaded', { files: fileHashes });
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

