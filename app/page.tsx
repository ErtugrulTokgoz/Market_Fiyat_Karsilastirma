"use client";

import { useState } from "react";
import { ShoppingCart, Search, ArrowLeft, ExternalLink, RefreshCw, TrendingDown, AlertCircle, CheckCircle2, Loader2, ChevronRight } from "lucide-react";
import { PRODUCT_CATALOG } from "../lib/products";

interface ProductResult {
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

type AppView = "products" | "results";

const MARKET_LOGOS: Record<string, string> = {
  sok: "ŞOK",
  migros: "M",
  carrefour: "C",
  a101: "A101",
  bim: "BİM",
  happy: "H",
  bizim: "B",
  tarimkredi: "TK",
};

// Ürün isimlerinden hacim/ağırlık çıkarma aracı (ml veya gram cinsine dönüştürür)
function extractVolume(str: string): number | null {
  if (!str) return null;
  const s = str.toLowerCase();
  
  const lMatch = s.match(/(\d+(?:[.,]\d+)?)\s*(?:l|lt|litre)\b/);
  if (lMatch) return parseFloat(lMatch[1].replace(',', '.')) * 1000;
  
  const mlMatch = s.match(/(\d+(?:[.,]\d+)?)\s*ml\b/);
  if (mlMatch) return parseFloat(mlMatch[1].replace(',', '.'));
  
  const kgMatch = s.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo)\b/);
  if (kgMatch) return parseFloat(kgMatch[1].replace(',', '.')) * 1000;
  
  const gMatch = s.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gr|gram)\b/);
  if (gMatch) return parseFloat(gMatch[1].replace(',', '.'));
  
  return null;
}

export default function Home() {
  const [view, setView] = useState<AppView>("products");
  const [selectedProduct, setSelectedProduct] = useState<(typeof PRODUCT_CATALOG)[0] | null>(null);
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = PRODUCT_CATALOG.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(filteredProducts.map((p) => p.category)));

  const handleProductSelect = async (product: (typeof PRODUCT_CATALOG)[0]) => {
    setSelectedProduct(product);
    setView("results");
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(`/api/prices?q=${encodeURIComponent(product.query)}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Bir hata oluştu.");
      } else {
        const queryVol = extractVolume(product.name) || extractVolume(product.query);
        let finalResults = data.results || [];
        
        if (queryVol) {
          finalResults = finalResults.filter((p: ProductResult) => {
             const pVol = extractVolume(p.productName);
             // Hacim bulunamazsa veya hedef hacimden %20'den fazla sapmıyorsa kabul et
             if (!pVol) return true; 
             return Math.abs(pVol - queryVol) / queryVol <= 0.20;
          });
        }
        
        setResults(finalResults);
      }
    } catch (e) {
      setError("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setView("products");
    setSelectedProduct(null);
    setResults([]);
    setError(null);
  };

  const bestPrice = results.length > 0 ? results[0].price : null;
  const worstPrice = results.length > 0 ? results[results.length - 1].price : null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-white/5 shadow-2xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          {view === "results" && (
            <button
              onClick={handleBack}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Geri Dön"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">
                {view === "results" && selectedProduct
                  ? `${selectedProduct.icon} ${selectedProduct.name}`
                  : "Market Fiyat Karşılaştır"}
              </h1>
              <p className="text-slate-400 text-xs">
                {view === "results" ? "Gerçek zamanlı market fiyatları" : "Canlı fiyatları karşılaştır"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* ── ÜRÜN LİSTESİ EKRANI ── */}
        {view === "products" && (
          <div className="animate-fade-in">
            {/* Hero */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Gerçek fiyatlar, canlı veri
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
                Hangi ürünü<br />
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  karşılaştıralım?
                </span>
              </h2>
              <p className="text-slate-400 max-w-md mx-auto">
                Bir ürüne dokunun, ŞOK ve diğer marketlerdeki gerçek fiyatları anında görün.
              </p>
            </div>

            {/* Arama */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Herhangi bir ürün ara... (Örn: Nutella, Ariel)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    handleProductSelect({ 
                      id: 'custom', 
                      name: searchQuery, 
                      icon: '🔍', 
                      query: searchQuery, 
                      category: 'Arama' 
                    });
                  }
                }}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => handleProductSelect({ id: 'custom', name: searchQuery, icon: '🔍', query: searchQuery, category: 'Arama' })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl transition-all border border-emerald-500/30"
                >
                  ARA
                </button>
              )}
            </div>

            {/* Kategori Yoksa veya Arama Yapılıyorsa Uyarı */}
            {filteredProducts.length === 0 && searchQuery && (
              <div className="text-center py-10 bg-white/5 rounded-3xl border border-dashed border-white/10 mb-8">
                <p className="text-slate-400 text-sm mb-2">Katalogda bulunamadı ama...</p>
                <button
                  onClick={() => handleProductSelect({ id: 'custom', name: searchQuery, icon: '🔍', query: searchQuery, category: 'Arama' })}
                  className="text-emerald-400 font-bold hover:underline"
                >
                  "{searchQuery}" ürününü tüm marketlerde ara →
                </button>
              </div>
            )}

            {/* Canlı Tarama Animasyonu (Sadece Ürün Seçildiğinde Görünür) */}
            {view === "products" && loading && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md">
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                    <ShoppingCart className="absolute inset-0 m-auto w-8 h-8 text-white animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Marketler Taranıyor</h3>
                  <p className="text-slate-400 text-sm animate-pulse">Gerçek zamanlı fiyatlar çekiliyor...</p>
                  
                  <div className="mt-8 space-y-3 max-w-xs mx-auto">
                    {['ŞOK Market', 'Migros', 'Happy Center', 'A101'].map((m, i) => (
                      <div key={m} className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl border border-white/5 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 0.2}s` }}>
                        <span className="text-xs text-slate-300">{m}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-400 font-medium">Bağlanıyor...</span>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Ürünler - Kategoriye Göre */}
            {categories.map((category) => (
              <div key={category} className="mb-6">
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-3 px-1">
                  {category}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredProducts
                    .filter((p) => p.category === category)
                    .map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-4 text-left transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <div className="text-3xl mb-3">{product.icon}</div>
                        <p className="text-white text-sm font-semibold leading-tight">{product.name}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-slate-500 group-hover:text-emerald-400 transition-colors">
                          <span>Fiyatları gör</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/0 to-cyan-500/0 group-hover:from-emerald-500/5 group-hover:to-cyan-500/5 transition-all duration-300" />
                      </button>
                    ))}
                </div>
              </div>
            ))}
            {/* Market Durumu */}
            <div className="mt-12 pt-8 border-t border-white/5">
              <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4 text-center">
                Taranan Marketler
              </h3>
              <div className="flex flex-wrap justify-center gap-6 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-white text-xs font-medium">ŞOK</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-white text-xs font-medium">Migros</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-white text-xs font-medium">Happy Center</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-white text-xs font-medium">Bizim Toptan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-white text-xs font-medium">A101*</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-white text-xs font-medium">BİM*</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 text-center mt-4 italic">
                * Bazı marketlerde bot koruması nedeniyle fiyatlar gecikmeli veya dolaylı yoldan çekilir.
              </p>
            </div>
          </div>
        )}

        {/* ── SONUÇLAR EKRANI ── */}
        {view === "results" && (
          <div className="animate-fade-in">
            {/* Hata */}
            {!loading && error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="text-red-300 font-semibold mb-1">Veri Alınamadı</h3>
                <p className="text-red-400/70 text-sm mb-4">{error}</p>
                <button
                  onClick={() => selectedProduct && handleProductSelect(selectedProduct)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl text-sm transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tekrar Dene
                </button>
              </div>
            )}

            {/* Sonuçlar */}
            {!loading && !error && results.length > 0 && (
              <>
                {/* Özet Banner */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-3xl p-6 mb-8 shadow-xl shadow-emerald-500/20 group">
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider mb-3 backdrop-blur-md">
                        <CheckCircle2 className="w-3 h-3" />
                        En İyi Fiyat Tespit Edildi
                      </div>
                      <p className="text-white/80 text-sm font-medium mb-1">En Uygun Market</p>
                      <h3 className="text-white font-black text-3xl mb-1">{results[0].marketName}</h3>
                      <p className="text-white/60 text-xs font-medium max-w-[200px] line-clamp-1">{results[0].productName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/70 text-xs font-bold uppercase mb-1">Fiyat</p>
                      <p className="text-white text-4xl font-black tracking-tight">{results[0].priceText}</p>
                    </div>
                  </div>
                  
                  {/* Dekoratif elementler */}
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
                  <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl group-hover:bg-emerald-400/30 transition-all duration-700" />
                </div>

                {/* Market Listesi */}
                <div className="space-y-3">
                  {results.map((market, index) => {
                    const isBest = index === 0;
                    const isWorst = index === results.length - 1 && results.length > 1;
                    const savingsVsBest = bestPrice ? market.price - bestPrice : 0;

                    return (
                      <div
                        key={market.marketId}
                        className={`relative rounded-2xl p-5 border transition-all duration-200 ${
                          isBest
                            ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                            : "bg-white/5 border-white/10"
                        }`}
                        style={{ animationDelay: `${index * 0.08}s` }}
                      >
                        <div className="flex items-center gap-4">
                          {/* Market Logosu */}
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md ${!market.available ? 'opacity-40 grayscale' : ''}`}
                            style={{ backgroundColor: market.marketColor }}
                          >
                            {MARKET_LOGOS[market.marketId] || market.marketName.charAt(0)}
                          </div>

                          {/* Market Bilgileri */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                               <span className={`font-bold ${!market.available ? 'text-slate-500' : 'text-white'}`}>
                                {market.marketName}
                              </span>
                              {market.available && isBest && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  En İyi Fiyat
                                </span>
                              )}
                              {!market.available && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500/70 text-[10px] font-bold uppercase tracking-wider">
                                  Sınırlı Erişim
                                </span>
                              )}
                            </div>
                            <p className="text-slate-400 text-sm truncate mt-0.5">
                              {market.available ? market.productName : 'Bot koruması nedeniyle fiyat çekilemiyor'}
                            </p>
                          </div>

                          {/* Fiyat */}
                          <div className="text-right shrink-0">
                            <p className={`text-2xl font-black ${!market.available ? 'text-slate-700' : isBest ? 'text-emerald-400' : 'text-white'}`}>
                              {market.available ? market.priceText : '---'}
                            </p>
                            {market.productUrl && (
                              <a
                                href={market.productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-300 text-[10px] mt-1 transition-colors uppercase font-bold tracking-wider"
                              >
                                {market.available ? 'SİTEYE GİT' : 'MANUEL KONTROL'} <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Ürün görseli varsa */}
                        {market.productImage && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden lg:block">
                            <img src={market.productImage} alt="" className="w-16 h-16 object-contain" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Yenile Butonu */}
                <button
                  onClick={() => selectedProduct && handleProductSelect(selectedProduct)}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all text-sm font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Fiyatları Yenile
                </button>

                {/* Uyarı */}
                <p className="text-center text-slate-600 text-xs mt-4">
                  * Fiyatlar canlı olarak çekilmektedir ve market sitelerinde değişebilir.
                  Kampanya ve indirimler dahil edilmemiş olabilir.
                </p>
              </>
            )}

            {/* Sonuç Bulunamadı */}
            {!loading && !error && results.length === 0 && (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-slate-300 font-semibold mb-2">Sonuç Bulunamadı</p>
                <p className="text-slate-500 text-sm mb-6">
                  Bu ürün şu an hiçbir markette bulunamadı veya marketler yanıt vermedi.
                </p>
                <button
                  onClick={handleBack}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors"
                >
                  Başka Ürün Seç
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
