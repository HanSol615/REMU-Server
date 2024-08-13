const { StatusCodes } = require('http-status-codes');
const conn = require('./mariadb');
const dotenv = require('dotenv');
const axios = require('axios');
const xml2js = require('xml2js'); // xml -> json 변환 모듈

dotenv.config();

const getDetails = async (req, res) => {
    const serviceKey = process.env.SERVICE_KEY;
    const prfId = req.query.prfId;

    try{
        const apiUrl = `https://www.kopis.or.kr/openApi/restful/pblprfr/${prfId}?service=${serviceKey}&newsql=Y`;
        const response = await axios.get(apiUrl);
        const xmlData = response.data;
        const jsonData = await xml2js.parseStringPromise(xmlData, { explicitArray: false });
        let performance = jsonData.dbs.db;

        if (!Array.isArray(performance)) {
            performance = [performance];
        }

        // 공연 평점 조회
        const query = 'SELECT AVG(rating) as avgRating FROM review WHERE pf_id IN (?) GROUP BY pf_id';
        const result = await conn.query(query, prfId);

        // 공연 아이디와 평균 평점 매핑
        const ratingMap = {};
        ratingMap[prfId] = parseFloat(result[0].avgRating).toFixed(1); // 소수점 이하 첫째 자리까지

        return res.status(StatusCodes.OK).json({
            prfnm: performance[0].prfnm,
            genrenm: performance[0].genrenm,
            prfpdfrom: performance[0].prfpdfrom,
            prfpdto: performance[0].prfpdto,
            poster: performance[0].poster,
            prfstate: performance[0].prfstate,
            rating_avg: ratingMap[prfId]
        });

    } catch{
        console.log(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: '공연 세부정보를 불러오는 중 오류가 발생했습니다.' });
    }
}

module.exports = {
    getDetails
};