const initBitMonX = require('../src/index');
const express = require('express');

const app = express();
initBitMonX(app);
app.listen(8080, () => {
  console.log('Server is running on port 8080');
});
