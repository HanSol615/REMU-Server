const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.set('PORT', process.env.PORT);

app.use(express.json());

const authRouter = require('./routes/auth');

app.use('/auth', authRouter);

app.listen(app.get('PORT'), ()=>{
    console.log('Server is running on port', app.get('PORT'))
});