const ipfsClient = require('ipfs-http-client'); 
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');

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
app.use(fileUpload());                               

app.get('/',(req, res) =>{            
    res.render('home');              
});
app.post('/upload', (req, res)=>{    
    const file = req.files.file;
    const fileName = req.body.fileName;
    const filePath = 'files/' + fileName;

    file.mv(filePath, async (err) => {     
        if (err){
            console.log('Error:failure');
            return res.status(500).send(err);
        }

        const fileHash = await addFile(fileName, filePath);
        fs.unlink(filePath, (err) => {
            if (err) console.log(err);
        });

        const fileUrl = `http://localhost:8080/ipfs/${fileHash}`;

        res.render('upload', { fileName, fileHash, fileUrl });            
    })

})
    const addFile = async (fileName, filePath) => {
    const ipfs = getipfsClient(); 
    const file = fs.readFileSync(filePath);
    const fileAdded = await ipfs.add({path: fileName, content: file}); 
    const fileHash = fileAdded.cid.toString(); 
  
    return fileHash;
};

app.listen(3000, ()=>{
    console.log('Server is listening on port 3000');
});