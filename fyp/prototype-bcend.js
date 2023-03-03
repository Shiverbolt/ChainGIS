const ipfsClient = require('ipfs-http-client');
const FormData = require('form-data');
const fetch = require('node-fetch');
const express = require('express');
const bodyParser = require('body-parser');
const { parse: multipart } = require('multipart-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');

function getIpfsClient() {
  const ipfs = ipfsClient.create({
    host: 'localhost',
    port: '5001',
    protocol: 'http', 
  });
  return ipfs;
}

function parseMultipartResponse(body) {
  const parts = multipart(body, { headerless: true });
  const hashPart = parts.find(part => part.name === 'Hash');
  return hashPart ? hashPart.data.toString('utf8') : null;
}

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

app.get('/', (req, res) => {
  res.render('home');
});

app.post('/upload', (req, res) => {
  const file = req.files.file;
  const fileName = req.body.fileName;
  const filePath = 'files/' + fileName;

  file.mv(filePath, async (err) => {
    if (err) {
      console.log('Error:failure');
      return res.status(500).send(err);
    }

    const fileHash = await addFile(fileName, filePath);
    fs.unlink(filePath, (err) => {
      if (err) console.log('error');
    });

    res.render('upload', { fileName, fileHash });
  });
});

const addFile = async (fileName, filePath) => {
  const file = fs.readFileSync(filePath);
  const formData = new FormData();
  formData.append('file', file, fileName);

  const options = {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data', 
    },
    duplex: true, 
  };

  const response = await fetch('http://localhost:5001/api/v0/add', options); /
  const data = await response.text();
  const fileHash = parseMultipartResponse(data);
  return fileHash;
};
app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
