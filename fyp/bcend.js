const ipfsClient = require('ipfs-http-client'); 
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');

function getipfsClient(){
    const ipfs = ipfsClient.create(         
        { 
            host: 'localhost', 
            port: '5001', 
            protocol: 'http',
        });
    return ipfs;
}

const app = express();                  
app.set('view engine', 'ejs');                       
app.use(bodyParser.urlencoded({extended: true}));    
app.use(fileUpload({createParentPath: true, 
                    useTempFiles : true, 
                    tempFileDir : '/tmp/', 
                    limits: { fileSize: 50 * 1024 * 1024 }, 
                    safeFileNames: true, 
                    preserveExtension: true, 
                    abortOnLimit: true, 
                    responseOnLimit: "File size limit has been reached"
                }));                               

app.use(session({ 
    secret: 'myappsecret', 
    resave: false, 
    saveUninitialized: false 
}));

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

app.get('/', (req, res) => {
    if (req.session.user) {
      // if the user is already logged in, redirect to home page
      res.redirect('/home');
    } else {
      res.render('login', { errorMessage: '' });
    }
  });
  
  app.get('/register', (req, res) => {
    res.render('register', { errorMessage: '' });
  });
  
  app.post('/register', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
  
    const users = readUserData();
  
    // checking for existing data
    const user = users.find(u => u.username === username);
    if (user) {
      return res.render('register', { errorMessage: 'Username already exists' });
    }
  
    // hashing the password before storage
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // push a new user
    users.push({ username: username, password: hashedPassword });
    writeUserData(users);
  
    req.session.user = { username: username };
    res.redirect('/home');
  });
  app.get('/login', (req, res) => {
    res.render('login', { errorMessage: '' });
  });
  
  app.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
  
    const users = readUserData();
  
    // find the user in the stored data
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.render('login', { errorMessage: 'Invalid login credentials' });
    }
  
    // checking the hashed password against the one we stored
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', { errorMessage: 'Invalid login credentials' });
    }
  
    req.session.user = { username: username };
    res.redirect('/home');
  });
  
   app.get('/home', (req, res) => {
    if (req.session.user) {
      // if the user is logged in, render the home page
      const user = readUserData().find(u => u.username === req.session.user.username);
      res.render('home', { user: user });
    } else {
      // if the user is not logged in, redirect to the login page
      res.redirect('/');
    }
    
  });

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

module.exports = {addFile, getipfsClient};

app.listen(3000, ()=>{
  console.log('Server is listening on port 3000');
});
