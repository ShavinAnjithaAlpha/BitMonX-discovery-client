const initBitMonX = require('../src/index');
const express = require('express');

const app = express();
initBitMonX(app);

app.get('/api/v1/products', (req, res) => {
  res.json({
    instance: 'this is from server instance 1' + randomStringGen(),
  });
});

app.post('/api/v1/products', (req, res) => {
  res.json({
    instance: randomStringGen(),
  });
});

function randomStringGen() {
  // return the arbitary string with arbitary length
  const length = Math.floor(Math.random() * 100);
  let str = '';
  for (let i = 0; i < length; i++) {
    str += String.fromCharCode(Math.floor(Math.random() * 100));
  }
  return str;
}

app.listen(9080, () => {
  console.log('Server is running on port 9080');
});
