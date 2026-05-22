"use client";

import React, { useState } from "react";
import WatchlistTable from "@/components/WatchlistTable";
import PriceAlerts from "@/components/PriceAlerts";
import SearchCommand from "@/components/SearchCommand";
import { Star, Newspaper } from "lucide-react";

interface WatchlistClientProps {
  initialWatchlist: StockWithData[];
  news: MarketNewsArticle[];
  initialStocks: StockWithWatchlistStatus[];
  userEmail: string;
}

export default function WatchlistClient({
  initialWatchlist,
  news,
  initialStocks,
  userEmail,
}: WatchlistClientProps) {
  const [watchlist, setWatchlist] = useState<StockWithData[]>(initialWatchlist);

  const handleRemoveSuccess = (symbol: string) => {
    setWatchlist((prev) => prev.filter((item) => item.symbol !== symbol));
  };

  if (watchlist.length === 0) {
    return (
      <div className="watchlist-empty-container flex items-center justify-center min-h-[60vh]">
        <div className="watchlist-empty">
          <Star className="watchlist-star text-yellow-500 animate-pulse" />
          <h1 className="empty-title">Your Watchlist is Empty</h1>
          <p className="empty-description">
            Build your personalized watchlist to monitor price changes, P/E ratios, market caps, and receive real-time alerts.
          </p>
          <SearchCommand label="Explore Stocks" initialStocks={initialStocks} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 tracking-tight">Watchlist Dashboard</h1>
          <p className="text-gray-400 mt-1 text-base">
            Track prices, metrics, and manage custom breakout alerts for your stocks.
          </p>
        </div>
        <SearchCommand label="Search & Add Stock" initialStocks={initialStocks} />
      </div>

      {/* Main Grid: Table & Alerts */}
      <div className="watchlist-container">
        <div className="watchlist">
          <WatchlistTable watchlist={watchlist} onRemoveSuccess={handleRemoveSuccess} />
        </div>
        <div>
          <PriceAlerts watchlist={watchlist} userEmail={userEmail} />
        </div>
      </div>

      {/* News Feed Section */}
      <div className="border-t border-gray-800 pt-10 mt-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-yellow-500" /> Watchlist News & Insights
        </h2>
        {news.length === 0 ? (
          <div className="text-gray-500 text-center py-10 bg-gray-800/40 rounded-lg border border-gray-700">
            No news articles available at the moment.
          </div>
        ) : (
          <div className="watchlist-news">
            {news.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="news-item flex flex-col justify-between h-full group transition-all"
              >
                <div>
                  <span className="news-tag">{article.related || "MARKET"}</span>
                  <h3 className="news-title group-hover:text-yellow-400 transition-colors">
                    {article.headline}
                  </h3>
                  <p className="news-summary">{article.summary}</p>
                </div>
                <div>
                  <div className="news-meta">
                    <span>{article.source}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(article.datetime * 1000).toLocaleDateString()}</span>
                  </div>
                  <span className="news-cta group-hover:underline">Read Full Article &rarr;</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
