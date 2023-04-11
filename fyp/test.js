const { expect } = require('chai');
const fs = require('fs');
const ipfsClient = require('ipfs-http-client');
const { addFile } = require('./bcend.js');

describe('addFile function', () => {
  it('should add a file to IPFS and return a valid file hash', async () => {
    const ipfs = ipfsClient.create({
      host: 'localhost',
      port: '5001',
      protocol: 'http',
    });
    const fileName = 'test-file.tiff';
    const filePath = 'test/' + fileName;
    console.log('filePath:', filePath);
    const fileContent = fs.readFileSync(filePath);

    const fileHash = await addFile(fileName, filePath);
    
    expect(fileHash).to.be.a('string');
    expect(fileHash.length).to.equal(46);

    const ipfsFile = await ipfs.cat(fileHash);
    const chunks = []
    for await (const chunk of ipfsFile) {
      chunks.push(chunk)
    }
    const fileContentFromIpfs = Buffer.concat(chunks)
    console.log('filecontentfromipfs:', fileContentFromIpfs);

    expect(fileContentFromIpfs).to.deep.equal(fileContent);
  });
});