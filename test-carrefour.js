const axios = require('axios');
const cheerio = require('cheerio');

async function testCarrefour() {
  try {
    const { data } = await axios.get('https://www.carrefoursa.com/search/?text=sut', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      }
    });
    console.log('Carrefour length:', data.length);
    const $ = cheerio.load(data);
    
    $('.product-item').each((i, el) => {
      if (i < 3) {
        const name = $(el).find('.item-name').text().trim();
        const price = $(el).find('.item-price').text().trim();
        console.log(`Product ${i}:`, { name, price });
      }
    });
    
    if ($('.product-item').length === 0) {
      console.log('No .product-item found.');
      // Print some classes
      $('[class]').slice(0, 50).each((i, el) => {
        console.log($(el).attr('class'));
      });
    }
  } catch (err) {
    console.error('Carrefour Error:', err.message);
  }
}

testCarrefour();
