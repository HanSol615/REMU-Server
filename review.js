const { StatusCodes } = require('http-status-codes');
const conn = require('./mariadb');
const dotenv = require('dotenv');

dotenv.config();

const addition = async (req, res) => {
    try {
        // 토큰을 통해 얻은 user_id
        const userId = req.decoded.id;

        // 요청에서 받아온 공연 정보
        const { prfnm, pf_id, title, content, rating } = req.body;

        // 필수 필드 검증
        if (!title || !content || !rating || !prfnm || !pf_id) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: "모든 필드를 입력해주세요."
            });
        }

        // 리뷰 데이터 삽입
        const insertQuery = `INSERT INTO review (user_id, title, content, rating, prfnm, pf_id) VALUES (?, ?, ?, ?, ?, ?)`;
        await conn.query(insertQuery, [userId, title, content, rating, prfnm, pf_id]);

        return res.status(StatusCodes.CREATED).json({message: "리뷰가 성공적으로 작성되었습니다."});

    } catch (error) {
        console.error('오류 발생:', error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({message: '리뷰를 작성하는 중 오류가 발생했습니다.' });
    }
};

module.exports = {
    addition
};
