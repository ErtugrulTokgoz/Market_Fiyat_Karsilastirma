import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'url parametresi zorunludur.' }, { status: 400 });
  }

  try {
    let searchKeyword = 'süt';
    try {
      const parsedUrl = new URL(targetUrl);
      const kParam = parsedUrl.searchParams.get('k');
      if (kParam) {
        searchKeyword = kParam;
      }
    } catch (e) {}

    const payload = {
      "query": searchKeyword,
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

    if (!response.ok) {
      throw new Error('A101 API reddetti');
    }

    const data = await response.json();
    const productsData: any[] = [];

    if (data?.kapida?.products) {
      data.kapida.products.forEach((item: any) => {
        productsData.push({
          name: item.title,
          price: item.price.toString() + " TL",
          image: null
        });
      });
    }

    return NextResponse.json({ 
      success: true, 
      url: targetUrl, 
      products: productsData,
      count: productsData.length
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}