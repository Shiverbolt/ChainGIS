const ipfsClient = require('ipfs-http-client'); //importing packages
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs'); 
            //connecting to the local ipfs host, the instance here is ipfs with parameter given inside ipfsClient*
const ipfs = ipfsClient.create(         
    { 
        host: 'localhost', 
        port: '5001', 
        protocol: 'http',
    });
    return ipfs;


const app = express();                  //creation of the express app

app.set('view engine', 'ejs');                       // view engine is set to ejs because that is being used as the template language
app.use(bodyParser.urlencoded({extended: true}));    //init bodyparser
app.use(fileUpload());                               //init fileuploader

app.get('/',(req, res) =>{            //creation of the first route to render home.ejs
    res.render('home');              //renders the home.ejs file 
});
app.post('/upload', (req, res)=>{    //creation of the second route to render upload.ejs
    const file = req.files.file;
    const fileName = req.body.fileName;
    const filePath = 'files/' + fileName;

    file.mv(filePath, async(err)=>{     //error handelling 
        if (err){
            console.log('Error:failure');
            return res.status(500).send(err);
        }

        const fileHash = await addFile(fileName, filePath);
        fs.unlink(filePath, (err) => {
            if (err) console.log("error");
        });

        res.render('upload', { fileName, fileHash});            //renders the upload.ejs file with filename and hash
    })

})
    const addFile = async (fileName, filePath) => {
    const file = fs.readFileSync(filePath);                               //using the file system module(fs) to read the file
    const fileAdded = await ipfsClient().add({path: fileName, content: file}); // Call create.add() and await the result
    const fileHash = fileAdded.cid.toString(); // Get the CID of the added file
  
    return fileHash;
};

app.listen(3000, ()=>{
    console.log('Server is listening on port 3000');
});
