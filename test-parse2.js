const axios = require('axios');
const cheerio = require('cheerio');

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
};

// A101 - detailed parse
async function testA101(query) {
  const { data, status } = await axios.get(
    `https://www.a101.com.tr/arama/?search_text=${encodeURIComponent(query)}`,
    { headers: HEADERS, timeout: 10000 }
  );
  const $ = cheerio.load(data);
  
  // Look for JSON in script tags
  let found = false;
  $('script').each((i, el) => {
    const src = $(el).html() || '';
    if (src.includes('"price"') || src.includes('"salePrice"') || src.includes('"listPrice"')) {
      if (!found) {
        found = true;
        console.log('A101 price script (first 800):', src.substring(0, 800));
      }
    }
  });
  
  if (!found) {
    // Check window.__STATE__ or similar
    $('script').each((_, el) => {
      const src = $(el).html() || '';
      if (src.includes('window.') && src.length > 200) {
        console.log('A101 window script (first 400):', src.substring(0, 400));
      }
    });
  }
  
  console.log('Status:', status, 'Length:', data.length);
}

// Trendyol - with proper selectors
async function testTrendyol(query) {
  const { data, status } = await axios.get(
    `https://www.trendyol.com/sr?q=${encodeURIComponent(query)}&pi=1`,
    { headers: HEADERS, timeout: 10000 }
  );
  const $ = cheerio.load(data);
  
  // Try product list
  const cards = $('[class*="product-card"]');
  console.log('Trendyol cards:', cards.length);
  
  // Parse structured data
  $('script[type="application/ld+json"]').each((i, el) => {
    const json = $(el).html();
    try {
      const parsed = JSON.parse(json);
      if (parsed['@type'] === 'Product' || (Array.isArray(parsed) && parsed[0]?.['@type'] === 'Product')) {
        console.log('Trendyol LD+JSON product:', JSON.stringify(parsed).substring(0, 400));
      }
    } catch(e) {}
  });
  
  // Price direct selectors
  const prdctName = $('.prdct-desc-cntnr-name').first().text().trim();
  const newPrice = $('[class="price-new"]').first().text().trim() ||
                   $('[class*="prc-box-dsc"]').first().text().trim() ||
                   $('[class*="prc-box-orgnl"]').first().text().trim();
  console.log('Trendyol: name=', prdctName.substring(0,40), '| price=', newPrice, '| len:', data.length);
  
  // Print ALL price-related texts (first 5)
  const priceCandidates = [];
  $('[class*="prc"], [class*="price"]').each((i, el) => {
    if (i < 8) {
      const txt = $(el).text().trim();
      if (txt && txt.match(/\d/)) priceCandidates.push({ class: $(el).attr('class'), text: txt.substring(0, 30) });
    }
  });
  console.log('Price candidates:', priceCandidates);
}

async function main() {
  console.log('=== A101 ===');
  await testA101('süt').catch(e => console.log('A101 ERR:', e.message));
  console.log('\n=== TRENDYOL ===');
  await testTrendyol('süt').catch(e => console.log('TRENDYOL ERR:', e.message));
}
main();
