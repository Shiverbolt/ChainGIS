const { expect } = require('chai');
const fs = require('fs');
const ipfsClient = require('ipfs-http-client');
const { addFile } = require('./bcend.js');

describe('addFile function', () => {
  it('should add files to IPFS and return valid file hashes', async () => {
    const ipfs = ipfsClient.create({
      host: 'localhost',
      port: '5001',
      protocol: 'http',
    });
    const folderPath = 'dataset-test';
    const files = fs.readdirSync(folderPath);
    let totalLatency = 0;
    let numFilesProcessed = 0;
    let numFilesCorrect = 0;
    
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const filePath = folderPath + '/' + fileName;
      console.log('filePath:', filePath);
      const fileContent = fs.readFileSync(filePath);

      const startTime = new Date().getTime();
      const fileHash = await addFile(fileName, filePath);
      const endTime = new Date().getTime();
      const latency = endTime - startTime;
      totalLatency += latency;
      numFilesProcessed++;

      expect(fileHash).to.be.a('string');
      expect(fileHash.length).to.equal(46);

      const ipfsFile = await ipfs.cat(fileHash);
      const chunks = []
      for await (const chunk of ipfsFile) {
        chunks.push(chunk)
      }
      const fileContentFromIpfs = Buffer.concat(chunks)
      console.log('filecontentfromipfs:', fileContentFromIpfs);

      if (fileContentFromIpfs.equals(fileContent)) {
        numFilesCorrect++;
      }
    }

    const accuracy = numFilesCorrect / numFilesProcessed;
    const averageLatency = totalLatency / numFilesProcessed;
    console.log('Accuracy:', (accuracy * 100).toFixed(2) + '%');
    console.log('Average Latency:', averageLatency, 'ms');
  });
});
