const ipfsClient = require('ipfs-http-client'); 
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const express = require('express');

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
app.use(fileUpload({createParentPath: true, useTempFiles : true, tempFileDir : '/tmp/', limits: { fileSize: 50 * 1024 * 1024 }, safeFileNames: true, preserveExtension: true, abortOnLimit: true, responseOnLimit: "File size limit has been reached"}));                               

app.get('/',(req, res) =>{            
    res.render('home');              
});

app.post('/upload', async (req, res) => {    
    const files = Array.isArray(req.files.file) ? req.files.file : [req.files.file];
    const fileHashes = await Promise.all(
        files.map(async (file) => {
            const fileTimestamp = Date.now().toString() + '_' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const fileName = `${fileTimestamp}_${file.name}`;
            const filePath = 'files/' + fileName;
    
            await file.mv(filePath);
            const fileHash = await addFile(fileName, filePath);
            fs.unlink(filePath, (err) => {
                if (err) console.log(err);
            });
    
            const fileUrl = `http://localhost:8080/ipfs/${fileHash}`;
            return {fileName, fileHash, fileUrl};
        })
    );
    
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
