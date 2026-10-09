const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'tr-TR,tr;q=0.9',
};

// Try Macrocenter (formerly Carrefour premium)
async function tryMacrocenter(query) {
  try {
    const { data, status } = await axios.get(
      `https://www.macrocenter.com.tr/arama?q=${encodeURIComponent(query)}`,
      { headers: HEADERS, timeout: 10000 }
    );
    const $ = cheerio.load(data);
    const name = $('[class*="product"] [class*="name"]').first().text().trim() ||
                 $('.product-name').first().text().trim();
    const price = $('[class*="price"]').first().text().trim();
    console.log(`Macrocenter (${status}): name="${name.substring(0,40)}" price="${price}" len=${data.length}`);
  } catch(e) { console.log('Macrocenter ERR:', e.response?.status, e.message.substring(0,60)); }
}

// Try Kiler
async function tryKiler(query) {
  try {
    const { data, status } = await axios.get(
      `https://www.kiler.com.tr/arama/${encodeURIComponent(query)}`,
      { headers: HEADERS, timeout: 10000 }
    );
    const $ = cheerio.load(data);
    const name = $('.product-name').first().text().trim();
    const price = $('.price').first().text().trim();
    console.log(`Kiler (${status}): name="${name.substring(0,40)}" price="${price}" len=${data.length}`);
  } catch(e) { console.log('Kiler ERR:', e.response?.status, e.message.substring(0,60)); }
}

// Try Hakmar
async function tryHakmar(query) {
  try {
    const { data, status } = await axios.get(
      `https://www.hakmar.com.tr/?s=${encodeURIComponent(query)}`,
      { headers: HEADERS, timeout: 10000 }
    );
    const $ = cheerio.load(data);
    const name = $('.product-name').first().text().trim() ||
                 $('[class*="woocommerce"] h2').first().text().trim();
    const price = $('[class*="price"]').first().text().trim();
    console.log(`Hakmar (${status}): name="${name.substring(0,40)}" price="${price}" len=${data.length}`);
  } catch(e) { console.log('Hakmar ERR:', e.response?.status, e.message.substring(0,60)); }
}

// Try Migros API for more products to understand sorting
async function tryMigrosFull(query) {
  const { data } = await axios.get(
    `https://www.migros.com.tr/rest/products/search?q=${encodeURIComponent(query)}&page=0&display=3`,
    { headers: { ...HEADERS, Accept: 'application/json', 'x-requested-with': 'XMLHttpRequest', Referer: 'https://www.migros.com.tr' }, timeout: 8000 }
  );
  const products = data.data.storeProductInfos;
  console.log(`Migros (${products.length} products):`);
  products.slice(0, 3).forEach(p => {
    console.log(` - "${p.name}" = ${(p.shownPrice/100).toFixed(2)}₺`);
  });
}

// Try Gratis (personal care)
async function tryGratis(query) {
  try {
    const { data, status } = await axios.get(
      `https://www.gratis.com/c/?search=${encodeURIComponent(query)}`,
      { headers: HEADERS, timeout: 10000 }
    );
    const $ = cheerio.load(data);
    const name = $('[class*="product-name"]').first().text().trim();
    const price = $('[class*="price"]').first().text().trim();
    console.log(`Gratis (${status}): name="${name.substring(0,40)}" price="${price}" len=${data.length}`);
  } catch(e) { console.log('Gratis ERR:', e.response?.status, e.message.substring(0,60)); }
}

async function main() {
  const query = 'süt';
  console.log('=== Macrocenter ==='); await tryMacrocenter(query);
  console.log('\n=== Kiler ==='); await tryKiler(query);
  console.log('\n=== Hakmar ==='); await tryHakmar(query);
  console.log('\n=== Migros ==='); await tryMigrosFull(query);
  console.log('\n=== Gratis (personal care) ==='); await tryGratis('şampuan');
}
main();
