const axios = require('axios');

async function testMigros() {
  try {
    const { data } = await axios.get(
      'https://www.migros.com.tr/rest/products/search?q=sut&page=0&display=10',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'x-requested-with': 'XMLHttpRequest',
          'Referer': 'https://www.migros.com.tr',
        },
        timeout: 12000,
      }
    );
    console.log('Migros Success:', data.data.storeProductInfos.length, 'products found.');
    console.log('First Product:', data.data.storeProductInfos[0].name, data.data.storeProductInfos[0].shownPrice);
  } catch (err) {
    console.error('Migros Error:', err.message);
  }
}

testMigros();
