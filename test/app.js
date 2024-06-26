const initBitMonX = require('../src/index');
const express = require('express');

const app = express();
initBitMonX(app);

app.get('/api/v1/products', (req, res) => {
  res.json({
    products: [
      {
        id: 1,
        name: 'Product 1',
        price: 100,
      },
      {
        id: 2,
        name: 'Product 2',
        price: 200,
      },
      {
        id: 3,
        name: 'Product 3',
        price: 300,
      },
    ],
  });
});

app.listen(8080, () => {
  console.log('Server is running on port 8080');
});
