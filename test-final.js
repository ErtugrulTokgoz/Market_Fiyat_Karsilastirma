const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'tr-TR,tr;q=0.9',
};

// Test Migros - NOW CONFIRMED WORKING
async function testMigros(query) {
  const { data } = await axios.get(
    `https://www.migros.com.tr/rest/products/search?q=${encodeURIComponent(query)}&page=0&display=5`,
    { headers: { ...HEADERS, Accept: 'application/json', 'x-requested-with': 'XMLHttpRequest', Referer: 'https://www.migros.com.tr' }, timeout: 8000 }
  );
  const products = data.data.storeProductInfos;
  const p = products[0];
  const price = (p.shownPrice / 100).toFixed(2); // kuruş -> TL
  console.log(`Migros: "${p.name}" = ${price}₺`);
  console.log(`  Image: ${p.images[0]?.urls?.PRODUCT_LIST}`);
  console.log(`  URL: https://www.migros.com.tr/${p.prettyName}`);
}

// Test A101 variations
async function testA101(query) {
  const variants = [
    `https://www.a101.com.tr/arama/?search_text=${encodeURIComponent(query)}`,
    `https://www.a101.com.tr/search?q=${encodeURIComponent(query)}`,
  ];
  for (const url of variants) {
    try {
      const { data, status } = await axios.get(url, {
        headers: {
          ...HEADERS,
          'Accept': 'text/html',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Cookie': '', // empty cookie
        },
        timeout: 10000
      });
      const $ = cheerio.load(data);
      const name = $('.product-card .name').first().text().trim() ||
                   $('[class*="ProductCard"] [class*="name"]').first().text().trim();
      const price = $('[class*="current"]').first().text().trim() ||
                    $('[class*="price"]').first().text().trim();
      console.log(`A101 (${status}): name="${name}" price="${price}" len=${data.length}`);
    } catch(e) {
      console.log(`A101 ERR: ${url.substring(0,60)} => ${e.response?.status} ${e.message.substring(0,50)}`);
    }
  }
}

// Test Trendyol (correct URL)
async function testTrendyol(query) {
  const urls = [
    `https://www.trendyol.com/arama?q=${encodeURIComponent(query)}&qt=${encodeURIComponent(query)}&st=${encodeURIComponent(query)}&os=1`,
    `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}&pi=1`,
  ];
  for (const url of urls) {
    try {
      const { data, status } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
      const $ = cheerio.load(data);
      const name = $('[class*="product-down"] [class*="name"]').first().text().trim();
      const price = $('[class*="prc-box-dsc"]').first().text().trim() ||
                    $('[class*="price"]').first().text().trim();
      console.log(`Trendyol (${status}): name="${name.substring(0,40)}" price="${price}" len=${data.length}`);
      if (!name) {
        // See all elements with price-like classes
        const classes = new Set();
        $('[class*="price"], [class*="prc"]').each((i,el) => {
          if(i < 5) classes.add($(el).attr('class') + ':' + $(el).text().trim().substring(0,20));
        });
        console.log('  Price classes:', [...classes].slice(0,5));
      }
    } catch(e) {
      console.log(`Trendyol ERR: ${e.response?.status} ${e.message.substring(0,60)}`);
    }
  }
}

// Test Hepsiburada with correct selectors
async function testHepsiburada(query) {
  try {
    const { data, status } = await axios.get(
      `https://www.hepsiburada.com/ara?q=${encodeURIComponent(query)}`,
      { headers: HEADERS, timeout: 10000 }
    );
    const $ = cheerio.load(data);
    // look for next.js __NEXT_DATA__
    const nextData = $('script#__NEXT_DATA__').text();
    if (nextData) {
      const parsed = JSON.parse(nextData);
      const products = parsed?.props?.pageProps?.ssrData?.products;
      if (products && products.length > 0) {
        const p = products[0];
        console.log(`Hepsiburada NEXT_DATA: "${p.name}" = ${p.price}₺`);
      } else {
        console.log('Hepsiburada NEXT_DATA found but no products. Keys:', Object.keys(parsed?.props?.pageProps || {}));
      }
    } else {
      const name = $('[data-test-id="product-card-name"]').first().text().trim() ||
                   $('[class*="productCard"] [class*="name"]').first().text().trim();
      const price = $('[data-test-id="product-card-price"]').first().text().trim();
      console.log(`Hepsiburada (${status}): name="${name.substring(0,40)}" price="${price}" len=${data.length}`);
    }
  } catch(e) {
    console.log(`Hepsiburada ERR: ${e.response?.status} ${e.message}`);
  }
}

// Test Getir market app
async function testGetirWebApp(query) {
  const urls = [
    `https://getir.com/kategori/market/arama/?q=${encodeURIComponent(query)}`,
    `https://getir.com/market/`,
  ];
  for (const url of urls) {
    try {
      const { data, status } = await axios.get(url, { headers: HEADERS, timeout: 10000 });
      console.log(`Getir (${status}): len=${data.length}`);
    } catch(e) {
      console.log(`Getir ERR: ${e.response?.status || e.code} ${e.message.substring(0,50)}`);
    }
  }
}

async function main() {
  const query = 'süt';
  console.log('=== MIGROS (CONFIRMED) ===');
  await testMigros(query);
  console.log('\n=== A101 ===');
  await testA101(query);
  console.log('\n=== TRENDYOL ===');
  await testTrendyol(query);
  console.log('\n=== HEPSIBURADA ===');
  await testHepsiburada(query);
  console.log('\n=== GETIR ===');
  await testGetirWebApp(query);
}

main();
