import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Stealth eklentisini Puppeteer'a bağla
puppeteer.use(StealthPlugin());

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'url parametresi zorunludur. Örnek: /api/scrape?url=https://example.com' },
      { status: 400 }
    );
  }

  let browser;
  try {
    // Headless Chrome oturumu başlat
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Sayfaya git
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const pageTitle = await page.title();

    let items: Array<{ name: string | null; price: string | null; image: string | null }> = [];
    if (targetUrl.includes('akakce.com')) {
      items = await page.evaluate(() => {
        const elements = document.querySelectorAll('li.listItem');
        const results: Array<{ name: string | null; price: string | null; image: string | null }> = [];

        elements.forEach((el) => {
          const imgEl = el.querySelector('img');
          const priceEl = el.querySelector('span.pt_v8');

          const name = imgEl?.getAttribute('alt')?.trim() ?? null;
          const image = imgEl?.getAttribute('src') ?? null;
          const price = priceEl?.textContent?.trim() ?? null;

          if (name || price) {
            results.push({ name, price, image });
          }
        });

        return results;
      });

      return NextResponse.json({
        success: true,
        url: targetUrl,
        products: items,
        count: items.length,
      });
    }

    return NextResponse.json({
      success: true,
      url: targetUrl,
      title: pageTitle,
    });
  } catch (error: any) {
    console.error('Puppeteer scrape hatası:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Scrape işlemi başarısız oldu' },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}