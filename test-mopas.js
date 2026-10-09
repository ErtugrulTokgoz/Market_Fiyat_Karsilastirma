const axios = require('axios');
const cheerio = require('cheerio');

async function testMopas() {
  try {
    const { data } = await axios.get('https://mopas.com.tr/arama?q=sut', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    console.log('Mopas length:', data.length);
    const $ = cheerio.load(data);
    $('.product-item').each((i, el) => {
       console.log($(el).find('.product-name').text().trim(), $(el).find('.price').text().trim());
    });
  } catch (err) {
    console.error('Mopas Error:', err.message);
  }
}

testMopas();
