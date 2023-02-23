const IPFS = require("ipfs");
const node = new IPFS();
node.files.add(Buffer.from("Hello, IPFS!"), (error, result) => {
    if (error) {
      console.error(error);
      return;
    }
  
    console.log(result);
  });
  node.files.add(Buffer.from("Hello, IPFS!"), (error, result) => {
    if (error) {
      console.error(error);
      return;
    }
  
    console.log("IPFS address:", result[0].hash);
  });