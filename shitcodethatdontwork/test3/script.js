const ipfsClient = require('ipfs-http-client');
const ipfs = ipfsClient('http://localhost:5001');

const form = document.querySelector('form');
const status = document.querySelector('#status');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const fileInput = document.querySelector('#fileInput');
  const file = fileInput.files[0];

  const added = await ipfs.add(file);
  const url = `https://ipfs.io/ipfs/${added.cid.toString()}`;

  status.innerHTML = `File uploaded to IPFS! View it at <a href="${url}" target="_blank">${url}</a>`;
});
