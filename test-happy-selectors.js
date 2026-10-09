const axios = require('axios');
const cheerio = require('cheerio');

async function testHappy() {
  try {
    const { data } = await axios.get('https://www.happycenter.com.tr/arama?q=sut', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    const $ = cheerio.load(data);
    
    console.log('Page Title:', $('title').text());
    
    $('.product-item').each((i, el) => {
      if (i < 3) {
        const title = $(el).find('.product-name').text().trim();
        const price = $(el).find('.price').text().trim();
        const img = $(el).find('img').attr('src');
        console.log(`Product ${i}:`, { title, price, img });
      }
    });
    
    if ($('.product-item').length === 0) {
      console.log('No product-item found. Printing some class names...');
      $('*').slice(0, 100).each((i, el) => {
        const cls = $(el).attr('class');
        if (cls) console.log(cls);
      });
    }
  } catch (err) {
    console.error(err.message);
  }
}

testHappy();
