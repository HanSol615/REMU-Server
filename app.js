const express = require('express');
const cookieParser = require('cookie-parser');
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
app.use(cookieParser());

const authRouter = require('./routes/auth');
const mainRouter = require('./routes/main');
const userRouter = require('./routes/user');
const searchRouter = require('./routes/search');

app.use('/auth', authRouter);
app.use('/main', mainRouter);
app.use('/user', userRouter);
app.use('/search', searchRouter);

app.listen(app.get('PORT'), ()=>{
    console.log('Server is running on port', app.get('PORT'))
});
