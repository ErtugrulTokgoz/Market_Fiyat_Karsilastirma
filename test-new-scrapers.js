const axios = require('axios');
const cheerio = require('cheerio');

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

function parseTRPrice(raw) {
  const cleaned = raw.replace(/[₺TL\s]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

async function testHappy(query) {
  try {
    const { data } = await axios.get(
      `https://www.happycenter.com.tr/arama?q=${encodeURIComponent(query)}`,
      { headers: BROWSER_HEADERS, timeout: 12000 }
    );
    const $ = cheerio.load(data);
    let productName = '';
    let priceText = '';
    const selectors = ['.product-item', '.product-list-item', '.product-card', '[class*="product-item"]'];
    for (const selector of selectors) {
      const el = $(selector).first();
      if (el.length > 0) {
        productName = el.find('.product-name, .title, [class*="title"]').first().text().trim();
        priceText = el.find('.price, [class*="price"]').first().text().trim();
        if (productName && priceText) break;
      }
    }
    console.log('Happy:', productName, priceText);
  } catch (e) {
    console.log('Happy Error:', e.message);
  }
}

async function testBizim(query) {
  try {
    const { data } = await axios.get(
      `https://www.bizimtoptan.com.tr/arama?q=${encodeURIComponent(query)}`,
      { headers: BROWSER_HEADERS, timeout: 12000 }
    );
    const $ = cheerio.load(data);
    let productName = '';
    let priceText = '';
    $('[class*="product-item"], .product-card').each((_, el) => {
      if (productName) return false;
      productName = $(el).find('[class*="name"], .title').text().trim();
      priceText = $(el).find('[class*="price"]').first().text().trim();
    });
    console.log('Bizim:', productName, priceText);
  } catch (e) {
    console.log('Bizim Error:', e.message);
  }
}

async function main() {
  await testHappy('sut');
  await testBizim('sut');
}

main();
