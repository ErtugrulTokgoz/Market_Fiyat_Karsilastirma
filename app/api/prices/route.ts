import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

export interface ProductResult {
  marketId: string;
  marketName: string;
  marketColor: string;
  price: number;
  priceText: string;
  productName: string;
  productImage?: string;
  productUrl?: string;
  available: boolean;
}

function parseTRPrice(raw: string): number | null {
  const cleaned = raw.replace(/[₺TL\s]/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function formatPrice(n: number): string {
  return n.toFixed(2).replace('.', ',') + '₺';
}

// ─── ŞOK Market ✅ ──────────────────────────────────────────────────────────
async function scrapeSOK(query: string): Promise<ProductResult | null> {
  try {
    const { data } = await axios.get(
      `https://www.sokmarket.com.tr/arama?q=${encodeURIComponent(query)}`,
      { headers: BROWSER_HEADERS, timeout: 12000 }
    );
    const $ = cheerio.load(data);

    let productName = '';
    let priceText = '';
    let productImage = '';
    const seen = new Set<string>();

    $('[class*="CProductCard-module"]').each((_, el) => {
      if (productName) return false;
      const title = $(el).find('[class*="title"]').text().trim();
      const price = $(el).find('[class*="price"]').first().text().trim();
      const img = $(el).find('img').first().attr('src') || '';

      if (title && price && !seen.has(title)) {
        seen.add(title);
        productName = title;
        priceText = price;
        productImage = img;
      }
    });

    if (!priceText) return null;
    const price = parseTRPrice(priceText);
    if (price === null) return null;

    return {
      marketId: 'sok',
      marketName: 'ŞOK Market',
      marketColor: '#F7C430',
      price,
      priceText: formatPrice(price),
      productName,
      productImage,
      productUrl: `https://www.sokmarket.com.tr/arama?q=${encodeURIComponent(query)}`,
      available: true,
    };
  } catch (e) {
    console.error('[SOK]', (e as Error).message);
    return null;
  }
}

// ─── Migros ✅ ───────────────────────────────────────────────────────────────
async function scrapeMigros(query: string): Promise<ProductResult | null> {
  try {
    const { data } = await axios.get(
      `https://www.migros.com.tr/rest/products/search?q=${encodeURIComponent(query)}&page=0&display=10`,
      {
        headers: {
          ...BROWSER_HEADERS,
          Accept: 'application/json',
          'x-requested-with': 'XMLHttpRequest',
          Referer: 'https://www.migros.com.tr',
        },
        timeout: 12000,
      }
    );

    const products: any[] = data?.data?.storeProductInfos || [];
    if (products.length === 0) return null;

    // En ucuz ürünü bul
    const sorted = products
      .filter((p: any) => p.shownPrice > 0)
      .sort((a: any, b: any) => a.shownPrice - b.shownPrice);

    if (sorted.length === 0) return null;
    const p = sorted[0];

    const price = p.shownPrice / 100;
    const imageUrl = p.images?.[0]?.urls?.PRODUCT_LIST || '';

    return {
      marketId: 'migros',
      marketName: 'Migros',
      marketColor: '#FF6600',
      price,
      priceText: formatPrice(price),
      productName: p.name || query,
      productImage: imageUrl,
      productUrl: p.prettyName
        ? `https://www.migros.com.tr/${p.prettyName}`
        : `https://www.migros.com.tr/arama?q=${encodeURIComponent(query)}`,
      available: true,
    };
  } catch (e) {
    console.error('[Migros]', (e as Error).message);
    return null;
  }
}

// ─── Happy Center (Olası Çalışıyor) ─────────────────────────────────────────
async function scrapeHappy(query: string): Promise<ProductResult | null> {
  try {
    const { data } = await axios.get(
      `https://www.happycenter.com.tr/arama?q=${encodeURIComponent(query)}`,
      { headers: BROWSER_HEADERS, timeout: 12000 }
    );
    const $ = cheerio.load(data);

    let productName = '';
    let priceText = '';
    let productImage = '';

    // Multiple selector attempt
    const selectors = ['.product-item', '.product-list-item', '.product-card', '[class*="product-item"]'];
    
    for (const selector of selectors) {
      const el = $(selector).first();
      if (el.length > 0) {
        productName = el.find('.product-name, .title, [class*="title"]').first().text().trim();
        priceText = el.find('.price, [class*="price"]').first().text().trim();
        productImage = el.find('img').first().attr('src') || '';
        if (productName && priceText) break;
      }
    }

    if (!priceText) return null;
    const price = parseTRPrice(priceText);
    if (price === null) return null;

    return {
      marketId: 'happy',
      marketName: 'Happy Center',
      marketColor: '#FFD700',
      price,
      priceText: formatPrice(price),
      productName: productName || query,
      productImage: productImage.startsWith('http') ? productImage : `https://www.happycenter.com.tr${productImage}`,
      productUrl: `https://www.happycenter.com.tr/arama?q=${encodeURIComponent(query)}`,
      available: true,
    };
  } catch (e) {
    return null;
  }
}

// ─── Bizim Toptan (Olası Çalışıyor) ──────────────────────────────────────────
async function scrapeBizim(query: string): Promise<ProductResult | null> {
  try {
    const { data } = await axios.get(
      `https://www.bizimtoptan.com.tr/arama?q=${encodeURIComponent(query)}`,
      { headers: BROWSER_HEADERS, timeout: 12000 }
    );
    const $ = cheerio.load(data);

    let productName = '';
    let priceText = '';
    let productImage = '';

    $('[class*="product-item"], .product-card').each((_, el) => {
      if (productName) return false;
      productName = $(el).find('[class*="name"], .title').text().trim();
      priceText = $(el).find('[class*="price"]').first().text().trim();
      productImage = $(el).find('img').first().attr('src') || '';
    });

    if (!priceText) return null;
    const price = parseTRPrice(priceText);
    if (price === null) return null;

    return {
      marketId: 'bizim',
      marketName: 'Bizim Toptan',
      marketColor: '#004A99',
      price,
      priceText: formatPrice(price),
      productName: productName || query,
      productImage: productImage.startsWith('http') ? productImage : `https://www.bizimtoptan.com.tr${productImage}`,
      productUrl: `https://www.bizimtoptan.com.tr/arama?q=${encodeURIComponent(query)}`,
      available: true,
    };
  } catch (e) {
    return null;
  }
}

// ─── Tarım Kredi ─────────────────────────────────────────────────────────────
async function scrapeTarimKredi(query: string): Promise<ProductResult | null> {
  const unavailableResult = {
    marketId: 'tarimkredi',
    marketName: 'Tarım Kredi',
    marketColor: '#00703C',
    price: 0,
    priceText: '-',
    productName: 'Fiyat bilgisi alınamadı',
    productUrl: `https://www.tkkoop.com.tr/arama?ara=${encodeURIComponent(query)}`,
    available: false,
  };

  try {
    const res = await fetch(
      `https://www.tkkoop.com.tr/arama?ara=${encodeURIComponent(query)}`,
      { headers: BROWSER_HEADERS }
    );
    if (!res.ok) {
       console.error('[Tarım Kredi] HTTP Hatası:', res.status);
       return unavailableResult;
    }
    const html = await res.text();
    const $ = cheerio.load(html);

    let productName = '';
    let priceText = '';
    let productImage = '';

    // Yeni tespit edilen HTML yapılarına göre döngü
    $('.product-inner').each((_, el) => {
      if (productName) return false;
      
      // Başlık veya link etiketi içindeki ürün ismini al ve fazladan boşlukları temizle
      const title = $(el).find('a, h1, h2, h3, h4, h5, h6, [class*="name"], [class*="title"]').first().text().replace(/\s\s+/g, ' ').trim();
      
      // Fiyat elementinden metni alıp \n ve fazladan boşlukları yok ederek düzleştir
      const rawPrice = $(el).find('.ss_urun52').text();
      const price = rawPrice.replace(/[\n\r\t]/g, '').replace(/\s+/g, '').replace('TL', ' TL').trim();
      
      const img = $(el).find('img').first().attr('src') || '';

      if (title && price) {
        productName = title;
        priceText = price;
        productImage = img;
      }
    });

    if (!priceText) {
       console.error('[Tarım Kredi] Seçiciler boş döndü. HTML başı:\n', html.substring(0, 1000));
       return unavailableResult;
    }
    const price = parseTRPrice(priceText);
    if (price === null) return unavailableResult;

    return {
      ...unavailableResult,
      price,
      priceText: formatPrice(price),
      productName,
      productImage: productImage.startsWith('http') ? productImage : `https://www.tkkoop.com.tr${productImage}`,
      available: true,
    };
  } catch (e: any) {
    console.error('[Tarım Kredi] İstek Hatası:', e.message);
    return unavailableResult;
  }
}

// ─── A101 (API Fetch) ──────────────────────────────────────────────────────────
async function scrapeA101(query: string): Promise<ProductResult | null> {
  try {
    const payload = {
      "query": query,
      "filter": [],
      "sort": [],
      "page_number": 1,
      "row_per_page": 20,
      "location": "VS032-SLOT"
    };

    const encodedPayload = encodeURIComponent(JSON.stringify(payload));
    const apiUrl = `https://a101-main-prod.wawlabs.com/combined_api_v2?json_data=${encodedPayload}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) return null;
    const data = await response.json();
    
    if (data?.kapida?.products && data.kapida.products.length > 0) {
      const item = data.kapida.products[0];
      const priceNum = parseFloat(item.price);
      return {
        marketId: 'a101',
        marketName: 'A101',
        marketColor: '#00AEEF',
        price: isNaN(priceNum) ? 0 : priceNum,
        priceText: item.price.toString() + " ₺",
        productName: item.title,
        productUrl: `https://www.a101.com.tr/arama?k=${encodeURIComponent(query)}`,
        available: true,
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

// ─── BİM (bot koruması - erişilemiyor) ──────────────────────────────────────
async function scrapeBIM(_query: string): Promise<ProductResult | null> {
  return {
    marketId: 'bim',
    marketName: 'BİM',
    marketColor: '#E30613',
    price: 0,
    priceText: '-',
    productName: 'Fiyat bilgisi alınamadı',
    productUrl: `https://www.bim.com.tr`,
    available: false,
  };
}

// ─── CarrefourSA (bot koruması - erişilemiyor) ───────────────────────────────
async function scrapeCarrefour(_query: string): Promise<ProductResult | null> {
  return {
    marketId: 'carrefour',
    marketName: 'CarrefourSA',
    marketColor: '#005CA9',
    price: 0,
    priceText: '-',
    productName: 'Fiyat bilgisi alınamadı',
    productUrl: `https://www.carrefoursa.com`,
    available: false,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'q parametresi zorunludur.' }, { status: 400 });
  }

  // Gerçek verileri paralel çek
  const [a101Res, sokRes, migrosRes, happyRes, bizimRes, tarimRes] = await Promise.allSettled([
    scrapeA101(query),
    scrapeSOK(query),
    scrapeMigros(query),
    scrapeHappy(query),
    scrapeBizim(query),
    scrapeTarimKredi(query),
  ]);

  const results: ProductResult[] = [];
  const unavailable: ProductResult[] = [];

  // Tüm sonuçları topla ve duruma göre array'lere dağıt
  [a101Res, sokRes, migrosRes, happyRes, bizimRes, tarimRes].forEach((r) => {
    if (r.status === 'fulfilled' && r.value) {
      if (r.value.available) {
        results.push(r.value);
      } else {
        unavailable.push(r.value);
      }
    }
  });

  // Fiyata göre sırala
  results.sort((a, b) => a.price - b.price);

  // Eski manuel BİM/Carrefour eklentilerini de yapalım
  const others = await Promise.all([
    scrapeBIM(query),
    scrapeCarrefour(query)
  ]);
  
  others.forEach(r => {
    if (r) unavailable.push(r);
  });

  return NextResponse.json({
    results: [...results, ...unavailable],
    availableCount: results.length,
  });
}
