'use server';

import { getDateRange, validateArticle, formatArticle } from '@/lib/utils';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';
import { cache } from 'react';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const NEXT_PUBLIC_FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

async function fetchJSON<T>(url: string, revalidateSeconds?: number): Promise<T> {
  const options: RequestInit & { next?: { revalidate?: number } } = revalidateSeconds
    ? { cache: 'force-cache', next: { revalidate: revalidateSeconds } }
    : { cache: 'no-store' };

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Fetch failed ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export { fetchJSON };

export async function getNews(symbols?: string[]): Promise<MarketNewsArticle[]> {
  try {
    const range = getDateRange(5);
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      console.warn('FINNHUB_API_KEY is not configured. Returning fallback mock news articles.');
      return [
        {
          id: 1,
          headline: 'Tech Sector Rallies Amid Strong Earnings Reports',
          summary: 'Shares of Apple and Microsoft surged today after reporting better-than-expected quarterly earnings and robust growth outlooks.',
          source: 'Signalist News',
          url: '#',
          datetime: Math.floor(Date.now() / 1000) - 3600,
          category: 'technology',
          related: symbols?.[0] || 'AAPL',
          image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 2,
          headline: 'Federal Reserve Signals Interest Rate Pause',
          summary: 'The central bank hinted at holding interest rates steady in the upcoming meeting, boosting market sentiment across major indexes.',
          source: 'Market Watch',
          url: '#',
          datetime: Math.floor(Date.now() / 1000) - 7200,
          category: 'business',
          related: symbols?.[0] || 'MSFT',
          image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 3,
          headline: 'AI Innovations Continue to Drive Market Optimism',
          summary: 'NVIDIA and other semiconductor manufacturers experience strong demand as cloud providers continue massive capital expenditures on AI chipsets.',
          source: 'TechInsight',
          url: '#',
          datetime: Math.floor(Date.now() / 1000) - 10800,
          category: 'technology',
          related: symbols?.[0] || 'NVDA',
          image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80'
        }
      ];
    }
    const cleanSymbols = (symbols || [])
      .map((s) => s?.trim().toUpperCase())
      .filter((s): s is string => Boolean(s));

    const maxArticles = 6;

    // If we have symbols, try to fetch company news per symbol and round-robin select
    if (cleanSymbols.length > 0) {
      const perSymbolArticles: Record<string, RawNewsArticle[]> = {};

      await Promise.all(
        cleanSymbols.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(sym)}&from=${range.from}&to=${range.to}&token=${token}`;
            const articles = await fetchJSON<RawNewsArticle[]>(url, 300);
            perSymbolArticles[sym] = (articles || []).filter(validateArticle);
          } catch (e) {
            console.error('Error fetching company news for', sym, e);
            perSymbolArticles[sym] = [];
          }
        })
      );

      const collected: MarketNewsArticle[] = [];
      // Round-robin up to 6 picks
      for (let round = 0; round < maxArticles; round++) {
        for (let i = 0; i < cleanSymbols.length; i++) {
          const sym = cleanSymbols[i];
          const list = perSymbolArticles[sym] || [];
          if (list.length === 0) continue;
          const article = list.shift();
          if (!article || !validateArticle(article)) continue;
          collected.push(formatArticle(article, true, sym, round));
          if (collected.length >= maxArticles) break;
        }
        if (collected.length >= maxArticles) break;
      }

      if (collected.length > 0) {
        // Sort by datetime desc
        collected.sort((a, b) => (b.datetime || 0) - (a.datetime || 0));
        return collected.slice(0, maxArticles);
      }
      // If none collected, fall through to general news
    }

    // General market news fallback or when no symbols provided
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${token}`;
    const general = await fetchJSON<RawNewsArticle[]>(generalUrl, 300);

    const seen = new Set<string>();
    const unique: RawNewsArticle[] = [];
    for (const art of general || []) {
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${art.headline}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(art);
      if (unique.length >= 20) break; // cap early before final slicing
    }

    const formatted = unique.slice(0, maxArticles).map((a, idx) => formatArticle(a, false, undefined, idx));
    return formatted;
  } catch (err) {
    console.error('getNews error:', err);
    throw new Error('Failed to fetch news');
  }
}

export const searchStocks = cache(async (query?: string): Promise<StockWithWatchlistStatus[]> => {
  try {
    const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!token) {
      console.warn('FINNHUB_API_KEY is not configured. Returning fallback mock stock list.');
      const mockStocks: StockWithWatchlistStatus[] = [
        { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
        { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
        { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
        { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
        { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
        { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', type: 'Common Stock', isInWatchlist: false },
      ];
      if (!query) return mockStocks;
      const lower = query.toLowerCase();
      return mockStocks.filter(s => s.symbol.toLowerCase().includes(lower) || s.name.toLowerCase().includes(lower));
    }

    const trimmed = typeof query === 'string' ? query.trim() : '';

    let results: FinnhubSearchResult[] = [];

    if (!trimmed) {
      // Fetch top 10 popular symbols' profiles
      const top = POPULAR_STOCK_SYMBOLS.slice(0, 10);
      const profiles = await Promise.all(
        top.map(async (sym) => {
          try {
            const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(sym)}&token=${token}`;
            // Revalidate every hour
            const profile = await fetchJSON<any>(url, 3600);
            return { sym, profile } as { sym: string; profile: any };
          } catch (e) {
            console.error('Error fetching profile2 for', sym, e);
            return { sym, profile: null } as { sym: string; profile: any };
          }
        })
      );

      results = profiles
        .map(({ sym, profile }) => {
          const symbol = sym.toUpperCase();
          const name: string | undefined = profile?.name || profile?.ticker || undefined;
          const exchange: string | undefined = profile?.exchange || undefined;
          if (!name) return undefined;
          const r: FinnhubSearchResult = {
            symbol,
            description: name,
            displaySymbol: symbol,
            type: 'Common Stock',
          };
          // We don't include exchange in FinnhubSearchResult type, so carry via mapping later using profile
          // To keep pipeline simple, attach exchange via closure map stage
          // We'll reconstruct exchange when mapping to final type
          (r as any).__exchange = exchange; // internal only
          return r;
        })
        .filter((x): x is FinnhubSearchResult => Boolean(x));
    } else {
      const url = `${FINNHUB_BASE_URL}/search?q=${encodeURIComponent(trimmed)}&token=${token}`;
      const data = await fetchJSON<FinnhubSearchResponse>(url, 1800);
      results = Array.isArray(data?.result) ? data.result : [];
    }

    const mapped: StockWithWatchlistStatus[] = results
      .map((r) => {
        const upper = (r.symbol || '').toUpperCase();
        const name = r.description || upper;
        const exchangeFromDisplay = (r.displaySymbol as string | undefined) || undefined;
        const exchangeFromProfile = (r as any).__exchange as string | undefined;
        const exchange = exchangeFromDisplay || exchangeFromProfile || 'US';
        const type = r.type || 'Stock';
        const item: StockWithWatchlistStatus = {
          symbol: upper,
          name,
          exchange,
          type,
          isInWatchlist: false,
        };
        return item;
      })
      .slice(0, 15);

    return mapped;
  } catch (err) {
    console.error('Error in stock search:', err);
    return [];
  }
});

export async function getStockData(symbol: string): Promise<{
  currentPrice: number;
  changePercent: number;
  marketCap: number;
  peRatio: number;
}> {
  const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;
  const upper = symbol.toUpperCase();

  if (!token) {
    const mockPrices: Record<string, { currentPrice: number; changePercent: number; marketCap: number; peRatio: number }> = {
      AAPL: { currentPrice: 175.50, changePercent: 1.25, marketCap: 2750, peRatio: 28.5 },
      MSFT: { currentPrice: 420.20, changePercent: -0.45, marketCap: 3120, peRatio: 35.8 },
      GOOGL: { currentPrice: 150.10, changePercent: 2.10, marketCap: 1880, peRatio: 25.2 },
      AMZN: { currentPrice: 180.40, changePercent: 0.85, marketCap: 1850, peRatio: 41.2 },
      TSLA: { currentPrice: 170.30, changePercent: -3.20, marketCap: 540, peRatio: 58.7 },
      META: { currentPrice: 485.60, changePercent: 1.65, marketCap: 1240, peRatio: 24.6 },
      NVDA: { currentPrice: 900.50, changePercent: 4.80, marketCap: 2200, peRatio: 75.3 },
      NFLX: { currentPrice: 610.20, changePercent: -1.10, marketCap: 265, peRatio: 36.4 },
    };

    return mockPrices[upper] || { currentPrice: 125.40, changePercent: 0.75, marketCap: 120, peRatio: 22.4 };
  }

  try {
    const quoteUrl = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(upper)}&token=${token}`;
    const profileUrl = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(upper)}&token=${token}`;

    const [quote, profile] = await Promise.all([
      fetchJSON<any>(quoteUrl, 60),
      fetchJSON<any>(profileUrl, 3600),
    ]);

    return {
      currentPrice: quote?.c || 0,
      changePercent: quote?.dp || 0,
      marketCap: profile?.marketCapitalization || 0,
      peRatio: profile?.pe || 15.0,
    };
  } catch (err) {
    console.error(`Error fetching stock data for ${upper}:`, err);
    return { currentPrice: 0, changePercent: 0, marketCap: 0, peRatio: 0 };
  }
}

export async function getMarketIndices(): Promise<Array<{
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  change: number;
}>> {
  const indices = [
    { symbol: 'SPY', name: 'S&P 500' },
    { symbol: 'QQQ', name: 'Nasdaq 100' },
    { symbol: 'DIA', name: 'Dow Jones 30' },
    { symbol: 'IWM', name: 'Russell 2000' },
  ];

  const token = process.env.FINNHUB_API_KEY ?? NEXT_PUBLIC_FINNHUB_API_KEY;

  if (!token) {
    return [
      { symbol: 'SPX', name: 'S&P 500', price: 5120.30, changePercent: 1.25, change: 63.20 },
      { symbol: 'IXIC', name: 'Nasdaq 100', price: 16110.50, changePercent: 1.85, change: 293.10 },
      { symbol: 'DJI', name: 'Dow Jones 30', price: 39120.40, changePercent: -0.32, change: -125.50 },
      { symbol: 'RUT', name: 'Russell 2000', price: 2020.15, changePercent: 0.45, change: 9.05 },
    ];
  }

  const results = [];
  for (const item of indices) {
    try {
      const quoteUrl = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(item.symbol)}&token=${token}`;
      const quote = await fetchJSON<any>(quoteUrl, 60);
      const currentPrice = quote?.c || 0;
      const changePercent = quote?.dp || 0;
      const change = quote?.d || 0;

      let displayPrice = currentPrice;
      let displayChange = change;
      let displayName = item.name;
      let displaySymbol = item.symbol;

      if (item.symbol === 'SPY') {
        displayPrice = currentPrice * 10;
        displayChange = change * 10;
        displaySymbol = 'SPX';
        displayName = 'S&P 500';
      } else if (item.symbol === 'QQQ') {
        displayPrice = currentPrice * 40;
        displayChange = change * 40;
        displaySymbol = 'IXIC';
        displayName = 'Nasdaq 100';
      } else if (item.symbol === 'DIA') {
        displayPrice = currentPrice * 100;
        displayChange = change * 100;
        displaySymbol = 'DJI';
        displayName = 'Dow Jones 30';
      } else if (item.symbol === 'IWM') {
        displayPrice = currentPrice * 10;
        displayChange = change * 10;
        displaySymbol = 'RUT';
        displayName = 'Russell 2000';
      }

      results.push({
        symbol: displaySymbol,
        name: displayName,
        price: Number(displayPrice.toFixed(2)),
        changePercent: Number(changePercent.toFixed(2)),
        change: Number(displayChange.toFixed(2)),
      });
    } catch (err) {
      console.error(`Error fetching index data for ${item.symbol}:`, err);
      const fallbacks: Record<string, any> = {
        SPY: { symbol: 'SPX', name: 'S&P 500', price: 5120.30, changePercent: 1.25, change: 63.20 },
        QQQ: { symbol: 'IXIC', name: 'Nasdaq 100', price: 16110.50, changePercent: 1.85, change: 293.10 },
        DIA: { symbol: 'DJI', name: 'Dow Jones 30', price: 39120.40, changePercent: -0.32, change: -125.50 },
        IWM: { symbol: 'RUT', name: 'Russell 2000', price: 2020.15, changePercent: 0.45, change: 9.05 },
      };
      results.push(fallbacks[item.symbol]);
    }
  }
  return results;
}



