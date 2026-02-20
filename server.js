const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3333;

app.use(express.static(__dirname));

app.listen(port, '0.0.0.0', () => {
  console.log('Survey app listening on port', port);
});
