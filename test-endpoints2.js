const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'tr-TR,tr;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

async function tryMigrosApiV2(query) {
  const endpoints = [
    `https://www.migros.com.tr/rest/catalogs/urunler/searches?search-text=${encodeURIComponent(query)}&catalog-type=ecommerce&page=0&page-size=5`,
    `https://www.migros.com.tr/rest/products/search?q=${encodeURIComponent(query)}&page=0&display=5`,
    `https://www.migros.com.tr/rest/v2/catalogs/urunler/searches?search-text=${encodeURIComponent(query)}&page=0&page-size=5`,
  ];
  for (const url of endpoints) {
    try {
      const { data, status } = await axios.get(url, { headers: { ...HEADERS, Accept: 'application/json', 'x-requested-with': 'XMLHttpRequest', Referer: 'https://www.migros.com.tr' }, timeout: 8000 });
      const raw = JSON.stringify(data);
      console.log('Migros:', url.substring(0, 70), '=> status:', status, 'length:', raw.length, 'products?:', raw.includes('name') && raw.includes('price'));
      if (raw.includes('name') && raw.includes('price')) {
        console.log('  SAMPLE:', raw.substring(0, 400));
      }
    } catch(e) {
      console.log('Migros ERR:', url.substring(0, 70), '=>', e.response?.status || e.message);
    }
  }
}

async function tryCarrefour(query) {
  const endpoints = [
    `https://www.carrefoursa.com/api/v1/product/search?query=${encodeURIComponent(query)}&pageSize=5`,
    `https://www.carrefoursa.com/search/api/2/productSearch?q=${encodeURIComponent(query)}&pageSize=5`,
    `https://www.carrefoursa.com/tr/c/sut/?q=${encodeURIComponent(query)}%3Arelevance&pageSize=5`,
  ];
  for (const url of endpoints) {
    try {
      const { data, status } = await axios.get(url, { headers: { ...HEADERS, Accept: 'application/json' }, timeout: 8000 });
      const raw = JSON.stringify(data);
      console.log('\nCarrefour:', url.substring(0, 70), '=> status:', status, 'length:', raw.length);
      if (raw.includes('name') && raw.includes('price')) console.log('  SAMPLE:', raw.substring(0, 400));
    } catch(e) {
      console.log('\nCarrefour ERR:', url.substring(0, 70), '=>', e.response?.status || e.message);
    }
  }
}

async function tryN11Grocery(query) {
  try {
    const { data, status } = await axios.get(`https://www.n11.com/arama?q=${encodeURIComponent(query)}&category=1003029`, {
      headers: HEADERS, timeout: 8000
    });
    const $ = cheerio.load(data);
    const name = $('[class*="productName"]').first().text().trim() || $('.productName').first().text().trim();
    const price = $('[class*="price"]').first().text().trim();
    console.log('\nN11:', status, name, '|', price);
  } catch(e) {
    console.log('\nN11 ERR:', e.response?.status || e.message);
  }
}

async function tryTrendyolGrocery(query) {
  const urls = [
    `https://public.trendyol.com/discovery-web-searchgw-service/api/filter/search?q=${encodeURIComponent(query)}&pi=1&culture=tr-TR&userGenderId=1&sc=1&lc=0&os=1&googleabt=`,
    `https://www.trendyol.com/api/search/v2/products?q=${encodeURIComponent(query)}&pi=1&filters=`,
  ];
  for (const url of urls) {
    try {
      const { data, status } = await axios.get(url, { headers: { ...HEADERS, Accept: 'application/json', Referer: 'https://www.trendyol.com' }, timeout: 8000 });
      const raw = JSON.stringify(data);
      console.log('\nTrendyol:', url.substring(0, 70), '=> status:', status, 'length:', raw.length);
      if (raw.includes('name') && raw.length > 1000) console.log('  SAMPLE:', raw.substring(0, 500));
    } catch(e) {
      console.log('\nTrendyol ERR:', url.substring(0, 70), '=>', e.response?.status || e.message);
    }
  }
}

async function tryGetirMarket(query) {
  const urls = [
    `https://getir.com/market/search/${encodeURIComponent(query)}`,
    `https://peregrine-web-backend.getirapi.com/api/v1/catalog/products/search?q=${encodeURIComponent(query)}`,
  ];
  for (const url of urls) {
    try {
      const { data, status } = await axios.get(url, {
        headers: { ...HEADERS, Accept: 'application/json' },
        timeout: 10000
      });
      const raw = JSON.stringify(data);
      console.log('\nGetir:', url.substring(0, 70), '=> status:', status, 'length:', raw.length);
    } catch(e) {
      console.log('\nGetir ERR:', url.substring(0, 70), '=>', e.response?.status || e.message);
    }
  }
}

async function tryBimGelsin(query) {
  const urls = [
    `https://www.bizimgelsin.com/search?q=${encodeURIComponent(query)}`,
    `https://bizimgelsin.com/api/products?q=${encodeURIComponent(query)}`,
  ];
  for (const url of urls) {
    try {
      const { data, status } = await axios.get(url, { headers: HEADERS, timeout: 12000 });
      console.log('\nBizimGelsin:', url.substring(0, 70), '=> status:', status, 'length:', (typeof data === 'string' ? data.length : JSON.stringify(data).length));
      if (typeof data === 'string') {
        const $ = cheerio.load(data);
        const name = $('[class*="product"] [class*="name"]').first().text().trim();
        const price = $('[class*="product"] [class*="price"]').first().text().trim();
        console.log('  name:', name, '| price:', price);
      }
    } catch(e) {
      console.log('\nBizimGelsin ERR:', url.substring(0, 70), '=>', e.response?.status || e.message);
    }
  }
}

async function main() {
  const query = 'süt';
  console.log('=== MIGROS ===');
  await tryMigrosApiV2(query);
  console.log('\n=== CARREFOUR ===');
  await tryCarrefour(query);
  console.log('\n=== N11 ===');
  await tryN11Grocery(query);
  console.log('\n=== TRENDYOL ===');
  await tryTrendyolGrocery(query);
  console.log('\n=== GETIR ===');
  await tryGetirMarket(query);
  console.log('\n=== BIZIMGELSIN ===');
  await tryBimGelsin(query);
}

main();
