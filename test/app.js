const initBitMonX = require('../src/index');
const express = require('express');

const app = express();
initBitMonX(app);

app.get('/api/v1/products', (req, res) => {
  res.json({
    instance: 'this is from server instance 1',
  });
});

app.listen(9080, () => {
  console.log('Server is running on port 9080');
});
