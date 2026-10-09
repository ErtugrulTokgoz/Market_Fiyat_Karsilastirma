const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'tr-TR,tr;q=0.9',
};

// Migros returned 200 with 68529 bytes - let's inspect it
async function inspectMigros() {
  try {
    const { data } = await axios.get(
      `https://www.migros.com.tr/rest/products/search?q=s%C3%BCt&page=0&display=5`,
      { headers: { ...HEADERS, Accept: 'application/json', 'x-requested-with': 'XMLHttpRequest', Referer: 'https://www.migros.com.tr' }, timeout: 8000 }
    );
    const raw = JSON.stringify(data);
    // Print key structure
    if (typeof data === 'object') {
      console.log('Top-level keys:', Object.keys(data));
      if (data.data) console.log('data.data keys:', Object.keys(data.data));
      if (data.data?.products) console.log('First product:', JSON.stringify(data.data.products[0], null, 2).substring(0, 600));
      if (data.products) console.log('First product:', JSON.stringify(data.products[0], null, 2).substring(0, 600));
    } else {
      console.log('Raw (first 1000):', raw.substring(0, 1000));
    }
  } catch(e) {
    console.log('ERR:', e.message);
  }
}

// Migros - try the actual mobile app API
async function tryMigrosMobileApi() {
  const endpoints = [
    'https://www.migros.com.tr/rest/catalogs/migros-online/searches?search-text=s%C3%BCt&page=0&page-size=5&sort=RECOMMENDED',
    'https://www.migros.com.tr/rest/catalogs/default/searches?search-text=s%C3%BCt&page=0&page-size=5&sort=RECOMMENDED',
  ];
  for (const url of endpoints) {
    try {
      const { data, status } = await axios.get(url, {
        headers: { ...HEADERS, Accept: 'application/json', 'x-requested-with': 'XMLHttpRequest', Referer: 'https://www.migros.com.tr' },
        timeout: 10000
      });
      const raw = JSON.stringify(data);
      console.log('Migros2:', url.substring(50, 110), '=> status:', status, 'len:', raw.length);
      if (raw.length > 100) console.log('Sample:', raw.substring(0, 500));
    } catch(e) {
      console.log('Migros2 ERR:', url.substring(50, 100), '=>', e.response?.status, e.message);
    }
  }
}

// Try ceptemigros / migros mobile
async function tryMigrosCepte() {
  try {
    const { data, status } = await axios.get(
      `https://ceptemigros.com.tr/rest/products/search?q=s%C3%BCt&page=0&display=5`,
      { headers: { ...HEADERS, Accept: 'application/json' }, timeout: 8000 }
    );
    const raw = JSON.stringify(data);
    console.log('\nCepteMigros status:', status, 'len:', raw.length, 'sample:', raw.substring(0, 400));
  } catch(e) {
    console.log('\nCepteMigros ERR:', e.response?.status, e.message);
  }
}

// Try market.sitesi.gen.tr type aggregators
async function tryAggregators() {
  const urls = [
    'https://api.marketfiyat.net/search?q=sut',
    'https://marketfiyatlari.net/api/search?q=sut',
    'https://ucuzmarket.com.tr/arama?q=sut',
    'https://fiyatlari.com/search?q=sut',
    'https://piyasayeri.com/search?q=sut',
  ];
  for (const url of urls) {
    try {
      const { data, status } = await axios.get(url, { headers: HEADERS, timeout: 8000 });
      console.log('\nAgg:', url, '=>', status, (typeof data === 'string' ? data.length : JSON.stringify(data).length));
    } catch(e) {
      console.log('\nAgg ERR:', url, '=>', e.response?.status || e.code, e.message.substring(0, 60));
    }
  }
}

// Try Migros Hemen (quick delivery)
async function tryMigrosHemen() {
  try {
    const { data, status } = await axios.get(
      `https://www.migroshemen.com/api/products?q=s%C3%BCt&page=0`,
      { headers: { ...HEADERS, Accept: 'application/json' }, timeout: 8000 }
    );
    console.log('\nMigrosHemen:', status, JSON.stringify(data).substring(0, 400));
  } catch(e) {
    console.log('\nMigrosHemen ERR:', e.response?.status, e.message);
  }
}

// Try Trendyol supermarket filter
async function tryTrendyolSupermarket() {
  try {
    const { data, status } = await axios.get(
      `https://www.trendyol.com/supermarket/arama?q=s%C3%BCt`,
      { headers: HEADERS, timeout: 8000 }
    );
    const $ = cheerio.load(data);
    const name = $('[class*="product-card"]').first().find('[class*="name"]').text().trim();
    const price = $('[class*="price"]').first().text().trim();
    console.log('\nTrendyol supermarket:', status, 'len:', data.length, 'name:', name, 'price:', price);
    if (!name) {
      // Show class names
      const allClasses = [];
      $('[class]').each((i, el) => {
        if (i < 20) allClasses.push($(el).attr('class'));
      });
      console.log('Classes:', allClasses.filter(c => c && c.includes('product')));
    }
  } catch(e) {
    console.log('\nTrendyol supermarket ERR:', e.response?.status, e.message);
  }
}

async function main() {
  console.log('=== Migros Rest API Inspect ===');
  await inspectMigros();
  console.log('\n=== Migros Rest API V2 ===');
  await tryMigrosMobileApi();
  console.log('\n=== CepteMigros ===');
  await tryMigrosCepte();
  console.log('\n=== Aggregators ===');
  await tryAggregators();
  console.log('\n=== Trendyol Supermarket ===');
  await tryTrendyolSupermarket();
}

main();
