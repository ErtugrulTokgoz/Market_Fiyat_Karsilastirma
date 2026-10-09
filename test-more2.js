const axios = require('axios');
const cheerio = require('cheerio');
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'tr-TR,tr;q=0.9',
};

// Hakmar proper URL
async function testHakmar(query) {
  const urls = [
    `https://www.hakmar.com.tr/?s=${encodeURIComponent(query)}&post_type=product`,
    `https://www.hakmar.com.tr/urunler/?s=${encodeURIComponent(query)}`,
    `https://hakmar.com.tr/?s=${encodeURIComponent(query)}`,
  ];
  for (const url of urls) {
    try {
      const { data, status } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
      const $ = cheerio.load(data);
      const name = $('.woocommerce-loop-product__title').first().text().trim() ||
                   $('h2.woocommerce-loop-product__title').first().text().trim() ||
                   $('h3.woocommerce-loop-product__title').first().text().trim();
      const price = $('[class*="woocommerce-Price-amount"]').first().text().trim() ||
                    $('bdi').first().text().trim();
      const allH = [];
      $('h2, h3').each((i,el) => { if(i<5) allH.push($(el).text().trim()); });
      console.log(`Hakmar (${status}): name="${name}" price="${price}" h2s=${JSON.stringify(allH)} len=${data.length}`);
    } catch(e) {
      console.log(`Hakmar ERR:`, e.response?.status, e.message.substring(0,50));
    }
  }
}

// Try OnlineMarket.com.tr (if exists)
async function testOtherMarkets(query) {
  const markets = [
    { name: 'Tarım Kredi', url: `https://tarimkredimarket.com.tr/?s=${encodeURIComponent(query)}` },
    { name: 'Nefis Gıda', url: `https://www.nefis.com/search?q=${encodeURIComponent(query)}` },
    { name: 'Çağrı Market', url: `https://www.cagrionline.com.tr/arama?q=${encodeURIComponent(query)}` },
    { name: 'Çetele', url: `https://www.cetele.com.tr/search?q=${encodeURIComponent(query)}` },
    { name: 'Yemeksepeti Market', url: `https://www.yemeksepeti.com/market-ara?q=${encodeURIComponent(query)}` },
    { name: 'Banabi (Hepsiburada)', url: `https://www.banabi.com.tr/search?q=${encodeURIComponent(query)}` },
  ];
  
  for (const m of markets) {
    try {
      const { data, status } = await axios.get(m.url, { headers: HEADERS, timeout: 8000 });
      const $ = cheerio.load(data);
      const price = $('[class*="price"]').first().text().trim().substring(0,30);
      const name = $('[class*="product"][class*="name"]').first().text().trim().substring(0,40) ||
                   $('[class*="title"]').first().text().trim().substring(0,40);
      console.log(`${m.name} (${status}): name="${name}" price="${price}" len=${data.length}`);
    } catch(e) {
      console.log(`${m.name} ERR:`, e.response?.status || e.code, e.message.substring(0,50));
    }
  }
}

async function main() {
  console.log('=== Hakmar ===');
  await testHakmar('süt');
  console.log('\n=== Other Markets ===');
  await testOtherMarkets('süt');
}
main();
