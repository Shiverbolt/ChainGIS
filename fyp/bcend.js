const {create} = require("ipfs-http-client"); //(pain:1)this is giving me trouble, here if i do "import" instead of "require" the error goes to (pain:2)
const express = require('express');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');

async function ipfsClient(){
const ipfs = await create(              //(pain:2)
    { 
        host: 'localhost', 
        port: '5001', 
        protocol: 'http',
    });
}

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(fileUpload());

app.get('/',(req, res) =>{
    res.render('home');
});

app.post('/upload', (req, res)=>{
    const file = req.files.file;
    const fileName = req.body.fileName;
    const filePath = 'files/' + fileName;

    file.mv(filePath, async(err)=>{
        if (err){
            console.log('Error:failure');
            return res.status(500).send(err);
        }

        const fileHash = await addFile(fileName, filePath);
        fs.unlink(filePath, (err) => {
            if (err) console.log("error");
        });

        res.render('upload', { fileName, fileHash});
    })

});

const addFile = async (fileName, filePath) => {
    const file = fs.readFileSync(filePath);
    const fileAdded = await ipfs.add({path: fileName, content: file});
    const flleHash= fileAdded[0].hash;

    return fileHash;
};

app.listen(3000, ()=>{
    console.log('Server is listening on port 3000');
});