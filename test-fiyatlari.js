const axios = require('axios');
const cheerio = require('cheerio');

async function testFiyatlari() {
  try {
    const { data } = await axios.get('https://fiyatlari.com/search?q=sut', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    console.log('Fiyatlari length:', data.length);
    const $ = cheerio.load(data);
    $('.product-card').each((i, el) => {
       console.log($(el).find('.product-title').text().trim(), $(el).find('.price').text().trim());
    });
  } catch (err) {
    console.error('Fiyatlari Error:', err.message);
  }
}

testFiyatlari();
