const { StatusCodes } = require('http-status-codes'); // status code 모듈
const jwt = require('jsonwebtoken'); // jwt 모듈
const crypto = require('crypto'); // 암호화 모듈
const conn = require('./mariadb');
const dotenv = require('dotenv');
dotenv.config();

// 토큰 생성 함수
const generateToken = (user, secretKey, expiresIn) => {
  return jwt.sign({
    id: user.user_id,
    email: user.email
  }, secretKey, {
    expiresIn,
    issuer: 'remu'
  });
};

const join = async (req, res) => {

  const { nickname, email, password } = req.body;

  // 필드가 비어있는지 확인
  if (!nickname || !email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: '입력 필드는 비워둘 수 없습니다.' });
  }

  try{
    // 닉네임 중복 확인
    const [nicknameCheck] = await conn.query("SELECT EXISTS (SELECT * FROM user WHERE nickname=?) AS 'exist'", nickname);
    if(nicknameCheck.exist){
      return res.status(StatusCodes.CONFLICT).json({ message: '이미 사용중인 닉네임 입니다.' });
    }

    // 이메일 중복 확인
    const [emailCheck] = await conn.query("SELECT EXISTS (SELECT * FROM user WHERE email=?) AS 'exist'", email)
    if(emailCheck.exist){
      return res.status(StatusCodes.CONFLICT).json({ message: '이미 사용중인 이메일 입니다.' });
    }

    let sql = 'INSERT INTO user (nickname, email, password, salt) VALUES (?, ?, ?, ?)';

    // 암호화 된 비밀번호와 salt 값을 같이 DB에 저장
    const salt = crypto.randomBytes(10).toString('base64');
    const hashPassword = crypto.pbkdf2Sync(password, salt, 10000, 10, 'sha512').toString('base64');
  
    // 로그인 시, 이메일 & 비밀번호(암호화X) => salt 값 꺼내서 비밀번호 암호화 하고 => DB 비밀번호랑 비교
    let values = [nickname, email, hashPassword, salt];
    conn.query(sql, values);
    return res.status(StatusCodes.CREATED).json({ message: '회원가입을 완료하였습니다.' });
  } catch(err){
    console.log(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
  }
};

const login = async (req, res) => {
  const {email, password} = req.body;

    // 필드가 비어있는지 확인
    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: '입력 필드는 비워둘 수 없습니다.' });
    }

    try{
      // 이메일 존재 여부 확인
      const [emailCheck] = await conn.query("SELECT EXISTS (SELECT * FROM user WHERE email=?) AS 'exist'", email)
      if(!emailCheck.exist){
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: '없는 이메일 입니다.' });
      }
    
      const [user] = await conn.query('SELECT * FROM user WHERE email = ?', [email]);
      const loginUser = user;

      // 사용자가 존재하지 않는 경우
      if (!loginUser) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: '로그인에 실패하였습니다.' });
      }

      // 비밀번호 일치하지 않는 경우
      const hashPassword = crypto.pbkdf2Sync(password, loginUser.salt, 10000, 10, 'sha512').toString('base64');
      if (loginUser.password !== hashPassword) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: '비밀번호가 틀렸습니다.' });
      }

      const accessToken = generateToken(loginUser, process.env.PRIVATE_KEY, '1h');
      const refreshToken = generateToken(loginUser, process.env.PRIVATE_KEY, '7d');
      console.log(accessToken, refreshToken);

      // Refresh Token을 데이터베이스에 저장
      await conn.query('UPDATE user SET refresh_token = ? WHERE email = ?', [refreshToken, email]);

      // maxAge 설정X: 세션쿠키(브라우저 닫을 때 삭제됨), 604800: 10분(?) maxAge 단위 이상..확인 후 수정 필요
      res.cookie('refreshToken', refreshToken, { httpOnly : true, secure: process.env.NODE_ENV === 'production', maxAge: 604800 * 6 * 24 * 7});
      res.cookie('accessToken', accessToken, { httpOnly : true, secure: process.env.NODE_ENV === 'production', maxAge: 604800 * 3});

      return res.status(StatusCodes.OK).json({ message: '로그인에 성공하였습니다', accessToken: accessToken });
    } catch(err){
      console.error(err);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    }
};

const logout = async(req, res) => {
  const accessToken = req.cookies.accessToken;
  console.log(req.cookies);

  if (!accessToken) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Access Token이 만료되었습니다.' });
  }

  try {
    // Access Token 검증
    const decoded = jwt.verify(accessToken, process.env.PRIVATE_KEY);
    const email = decoded.email;

    // Refresh Token을 데이터베이스에서 삭제
    await conn.query('UPDATE user SET refresh_token = NULL WHERE email = ?', [email]);

    // 쿠키 삭제
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.status(StatusCodes.OK).json({ message: '로그아웃에 성공하였습니다.' });
  } catch (err) {
    console.error(err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: '로그아웃 중 오류가 발생하였습니다.' });
  }
}

module.exports = {
  join,
  login,
  logout
};