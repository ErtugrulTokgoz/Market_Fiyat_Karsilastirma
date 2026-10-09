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

// ─── A101 (bot koruması - erişilemiyor) ─────────────────────────────────────
async function scrapeA101(_query: string): Promise<ProductResult | null> {
  return {
    marketId: 'a101',
    marketName: 'A101',
    marketColor: '#00AEEF',
    price: 0,
    priceText: '-',
    productName: 'Fiyat bilgisi alınamadı',
    productUrl: `https://www.a101.com.tr`,
    available: false,
  };
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
  const [sokRes, migrosRes, happyRes, bizimRes] = await Promise.allSettled([
    scrapeSOK(query),
    scrapeMigros(query),
    scrapeHappy(query),
    scrapeBizim(query),
  ]);

  const results: ProductResult[] = [];

  // Başarılı sonuçları topla
  [sokRes, migrosRes, happyRes, bizimRes].forEach((r) => {
    if (r.status === 'fulfilled' && r.value?.available) {
      results.push(r.value);
    }
  });

  // Fiyata göre sırala
  results.sort((a, b) => a.price - b.price);

  // Erişilemeyen marketleri sona ekle
  const unavailable: ProductResult[] = [];
  const others = await Promise.all([
    scrapeA101(query),
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
