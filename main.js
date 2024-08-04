const { StatusCodes } = require('http-status-codes');
const conn = require('./mariadb');
const dotenv = require('dotenv');
const axios = require('axios');
const xml2js = require('xml2js'); // xml -> json 변환 모듈
dotenv.config();

// 메인화면 공연 목록 리스팅
const listPerformances = async (req, res) => {
    // 공연 전체 목록(공연 중), 한 페이지 당 8개의 공연 리스팅
    //const apiUrl = 'http://www.kopis.or.kr/openApi/restful/pblprfr?service=a417ad94dc8e4af58818166c3fdbe05a&cpage=1&rows=8&prfstate=02&newsql=Y';
    const page = 1;
    const apiUrl = `http://www.kopis.or.kr/openApi/restful/pblprfr?service=a417ad94dc8e4af58818166c3fdbe05a&cpage=${page}&rows=8&prfstate=02&newsql=Y`;

    try {
        // 공연 목록 가져오기
        const response = await axios.get(apiUrl);
        const xmlData = response.data;

        // XML 데이터를 JSON으로 변환
        const jsonData = await xml2js.parseStringPromise(xmlData, { explicitArray: false });
        const performances = jsonData.dbs.db; // 공연 목록
        console.log('performances: ', performances);

        // 공연 이름 추출 후 배열 생성(루프 대신 map)
        const performanceNames = performances.map(performance => performance.prfnm);
        console.log('performanceNames:', performanceNames);

        // 공연 평점 조회
        const query = 'SELECT prfnm, AVG(rating) as avgRating FROM review WHERE prfnm IN (?) GROUP BY prfnm';
        const result = await conn.query(query, [performanceNames]);
        const rows = Array.isArray(result) ? result : [result];
        console.log('rows:', rows);

        // 공연 이름과 평균 평점 매핑(forEach: 각 요소에 대해 함수 실행 후 반환값X, map: 각 요소에 대해 함수 실행 후 반환값O)
        const ratingMap = {};
        rows.forEach(row => {
            ratingMap[row.prfnm] = parseFloat(row.avgRating).toFixed(1); // 소수점 이하 첫째 자리까지
        });
        console.log('ratingMap: ', ratingMap);

        // 공연 목록에 평점 추가
        const performancesWithRatings = performances.map(performance => {
            const rating = ratingMap[performance.prfnm] || 0.0;
            return {
                poster: performance.poster,
                prfnm: performance.prfnm,
                rating: rating
            };
        });

        return res.status(StatusCodes.OK).json(performancesWithRatings);

    } catch (err) {
        console.error(err);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: '공연 목록을 불러오는 중 오류가 발생했습니다.' });
    }
};

module.exports = {
    listPerformances
};
