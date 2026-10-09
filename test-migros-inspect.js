const axios = require('axios');

async function inspectMigros() {
  const { data } = await axios.get(
    `https://www.migros.com.tr/rest/products/search?q=s%C3%BCt&page=0&display=5`,
    { headers: { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Accept': 'application/json',
      'x-requested-with': 'XMLHttpRequest',
      'Referer': 'https://www.migros.com.tr'
    }, timeout: 8000 }
  );

  const products = data.data.storeProductInfos;
  
  // Print FULL first product
  console.log('=== FULL PRODUCT 0 ===');
  console.log(JSON.stringify(products[0], null, 2));
  
  console.log('\n=== FULL PRODUCT 1 ===');
  console.log(JSON.stringify(products[1], null, 2));
}

inspectMigros().catch(e => console.error(e.message));
