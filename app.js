const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

app.set('PORT', process.env.PORT);

app.listen(app.get('PORT'), ()=>{
    console.log('Server is running on port', app.get('PORT'))
});

app.get('/', (req, res) => {
    res.send('hello world!');
});