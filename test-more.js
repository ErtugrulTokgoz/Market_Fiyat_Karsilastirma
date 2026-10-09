const axios = require('axios');
const cheerio = require('cheerio');
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
  'Accept-Language': 'tr-TR,tr;q=0.9',
};

async function inspectHakmar(query) {
  const { data } = await axios.get(
    `https://www.hakmar.com.tr/?s=${encodeURIComponent(query)}`,
    { headers: HEADERS, timeout: 10000 }
  );
  const $ = cheerio.load(data);
  
  // WooCommerce
  const name = $('.woocommerce-loop-product__title').first().text().trim();
  const price = $('.woocommerce-Price-amount').first().text().trim();
  console.log('Hakmar (WooCommerce): name=', name.substring(0,50), '| price=', price);
  
  // print all h2 texts
  const h2s = [];
  $('h2').each((i, el) => { if(i < 5) h2s.push($(el).text().trim()); });
  console.log('H2s:', h2s);
}

async function testLocalSupers(query) {
  const sites = [
    { name: 'Tarım Kredi Market', url: `https://tarimkredikoop.com.tr/?s=${encodeURIComponent(query)}` },
    { name: 'Özdilek Market', url: `https://www.ozdilek.com.tr/arama?q=${encodeURIComponent(query)}` },
    { name: 'Koçtaş', url: `https://www.koctas.com.tr/search?searchText=${encodeURIComponent(query)}` },
  ];
  
  for (const site of sites) {
    try {
      const { data, status } = await axios.get(site.url, { headers: HEADERS, timeout: 8000 });
      const $ = cheerio.load(data);
      const priceText = $('[class*="price"]').first().text().trim();
      const name = $('[class*="product"] [class*="name"]').first().text().trim() ||
                   $('[class*="title"]').first().text().trim();
      console.log(`${site.name} (${status}): name="${name.substring(0,30)}" price="${priceText}" len=${data.length}`);
    } catch(e) {
      console.log(`${site.name} ERR:`, e.response?.status || e.code, e.message.substring(0,50));
    }
  }
}

// Look for an open grocery API
async function testOpenApis(query) {
  const apis = [
    // Open Food Facts - has product data but NOT prices
    // Try some public grocery APIs
    { name: 'OpenFoodFacts', url: `https://tr.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1` },
    { name: 'Pazarama', url: `https://www.pazarama.com/search?keyword=${encodeURIComponent(query)}` },
    { name: 'Akakce', url: `https://www.akakce.com/${encodeURIComponent(query)}-fiyatlari.html` },
  ];
  
  for (const api of apis) {
    try {
      const { data, status } = await axios.get(api.url, { headers: HEADERS, timeout: 8000 });
      const raw = typeof data === 'string' ? data : JSON.stringify(data);
      const $ = cheerio.load(typeof data === 'string' ? data : '');
      const price = $('[class*="price"]').first().text().trim();
      console.log(`${api.name} (${status}): len=${raw.length} price="${price}"`);
    } catch(e) {
      console.log(`${api.name} ERR:`, e.response?.status || e.code);
    }
  }
}

async function main() {
  console.log('=== Hakmar (WooCommerce) ===');
  await inspectHakmar('süt').catch(e => console.log(e.message));
  console.log('\n=== Local Supers ===');
  await testLocalSupers('süt');
  console.log('\n=== Open APIs ===');
  await testOpenApis('süt');
}
main();
