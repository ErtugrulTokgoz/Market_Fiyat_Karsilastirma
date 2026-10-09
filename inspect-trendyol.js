const axios = require('axios');
const fs = require('fs');

async function downloadTrendyol() {
  try {
    const { data } = await axios.get('https://www.trendyol.com/sr?q=sut', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    fs.writeFileSync('trendyol.html', data);
    console.log('Trendyol HTML saved. Length:', data.length);
  } catch (err) {
    console.error(err.message);
  }
}

downloadTrendyol();
