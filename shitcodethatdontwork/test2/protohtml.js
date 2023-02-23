const input = document.getElementById("file-input");
const button = document.getElementById("upload-button");

button.addEventListener("click", () => {
  const file = input.files[0];

  node.files.add(Buffer.from(file), (error, result) => {
    if (error) {
      console.error(error);
      return;
    }

    console.log("IPFS address:", result[0].hash);
  });
});