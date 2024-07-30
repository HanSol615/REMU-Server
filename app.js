const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.set('PORT', process.env.PORT);

const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:3000', // React 앱이 실행되는 URL
  credentials: true
}));


app.use(express.json());

const authRouter = require('./routes/auth');

app.use('/auth', authRouter);

app.listen(app.get('PORT'), ()=>{
    console.log('Server is running on port', app.get('PORT'))
});