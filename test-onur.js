const axios = require('axios');
const cheerio = require('cheerio');

async function testOnur() {
  try {
    const { data } = await axios.get('https://www.onurmarket.com/arama?q=sut', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const $ = cheerio.load(data);
    console.log('Products found:', $('.product-item').length);
    if ($('.product-item').length === 0) {
        $('[class*="product"]').each((i, el) => {
            if (i < 5) console.log($(el).attr('class'), $(el).text().trim().substring(0, 50));
        });
    }
  } catch (err) {
    console.error('Onur Error:', err.message);
  }
}

testOnur();
