// yt.js

const axios = require('axios');

// 非同期関数: データを取得
async function fetchData(url, type) {
  try {
    const response = await axios.get(
      `https://apis.caymankun.f5.si/ytdlpbot/?url=${encodeURIComponent(url)}&type=${type}`
    );
    return response.data;
  } catch (error) {
    console.error('An error occurred while fetching data:', error);
    throw new Error('Failed to fetch data');
  }
}

module.exports = fetchData;
