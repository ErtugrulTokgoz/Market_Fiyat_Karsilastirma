import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Stealth eklentisini kullan
puppeteer.use(StealthPlugin());

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'url parametresi zorunludur.' }, { status: 400 });
  }

  let browser;
  try {
    // Tarayıcıyı başlat
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Rastgelelik katmak için standart bir çözünürlük
    await page.setViewport({ width: 1366, height: 768 });

    // İstenilen URL'ye git
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Sayfanın başlığını al
    const title = await page.title();

    return NextResponse.json({ 
      success: true, 
      url: targetUrl, 
      title: title 
    });
    
  } catch (error: any) {
    console.error('Scrape hatası:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
