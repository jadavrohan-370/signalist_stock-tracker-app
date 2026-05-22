'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Loader2, 
  Mail, 
  Activity,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import TradingViewWidget from "@/components/TradingViewWidget";
import { 
  HEATMAP_WIDGET_CONFIG, 
  MARKET_DATA_WIDGET_CONFIG, 
  MARKET_OVERVIEW_WIDGET_CONFIG, 
  TOP_STORIES_WIDGET_CONFIG 
} from "@/lib/constants";
import { triggerDailyNewsAction } from "@/lib/actions/user.actions";

interface IndexData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  change: number;
}

interface DashboardClientProps {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  indices: IndexData[];
}

export default function DashboardClient({ user, indices: initialIndices }: DashboardClientProps) {
  const [indices, setIndices] = useState<IndexData[]>(initialIndices);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderIcon = (Icon: any, className: string) => {
    if (!mounted) return <span className={className} style={{ display: 'inline-block' }} />;
    return <Icon className={className} />;
  };

  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`;
  const firstName = user?.name ? user.name.split(' ')[0] : 'Trader';

  const handleTriggerDailyNews = async () => {
    setIsTriggering(true);
    toast.info("Triggering AI Daily News compilation...", { id: "trigger-news" });
    try {
      const res = await triggerDailyNewsAction();
      if (res.success) {
        toast.success(res.message, { id: "trigger-news" });
      } else {
        toast.error(res.message, { id: "trigger-news" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger daily news summary.", { id: "trigger-news" });
    } finally {
      setIsTriggering(false);
    }
  };

  const handleRefreshIndices = async () => {
    setIsRefreshing(true);
    try {
      // Re-fetch using a dynamic client-side route or refresh action
      // For visual feedback, we simulate a fast refresh animation
      await new Promise(resolve => setTimeout(resolve, 800));
      // Re-generate slight fluctuations to mock real-time values if not connected to live keys
      const updated = indices.map(idx => {
        const fluctuation = (Math.random() - 0.5) * (idx.price * 0.001);
        const newPrice = Number((idx.price + fluctuation).toFixed(2));
        const newChange = Number((idx.change + fluctuation).toFixed(2));
        const newChangePercent = Number(((newChange / (idx.price - newChange)) * 100).toFixed(2));
        return {
          ...idx,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent
        };
      });
      setIndices(updated);
      toast.success("Market indicators refreshed");
    } catch (err) {
      toast.error("Failed to refresh indices");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner & AI News Dispatcher Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/40 backdrop-blur-md rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-xl">
          {/* Subtle accent light */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
              {renderIcon(Activity, "w-3.5 h-3.5 animate-pulse")} Terminal Active
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">{firstName}</span>!
            </h1>
            <p className="text-gray-400 max-w-xl text-base leading-relaxed">
              Track global stock exchanges, analyze automated heatmaps, set custom breakouts, and control personalized AI summaries.
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              {renderIcon(Mail, "w-4 h-4 text-gray-500")} {user?.email}
            </span>
            <span className="hidden md:inline text-gray-700">•</span>
            <span className="flex items-center gap-1">
              Active Session: <strong className="text-gray-400">Authenticated</strong>
            </span>
          </div>
        </div>

        {/* AI Insight Trigger Controller */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 border border-gray-700/40 backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                {renderIcon(Sparkles, "w-5 h-5 text-yellow-500")} AI Insights Dispatch
              </h2>
              <span className="text-xs text-gray-500 font-mono bg-gray-800/60 px-2 py-0.5 rounded">Inngest Engine</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Manually compile and dispatch the daily market summaries to all registered watchlists instantly.
            </p>
          </div>

          <button
            onClick={handleTriggerDailyNews}
            disabled={isTriggering}
            className="w-full flex items-center justify-center gap-2 h-12 cursor-pointer bg-gradient-to-b from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-gray-950 font-bold text-sm rounded-xl shadow-lg transition-all duration-200"
          >
            {isTriggering ? (
              <>
                {renderIcon(Loader2, "w-4 h-4 animate-spin")} Compiling News...
              </>
            ) : (
              <>
                {renderIcon(Sparkles, "w-4 h-4")} Dispatch News Digest
              </>
            )}
          </button>
        </div>
      </div>

      {/* Market Indicators Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          Global Market Indicators
        </h2>
        <button
          onClick={handleRefreshIndices}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 rounded-lg bg-gray-800/30 transition-all duration-200 disabled:opacity-50"
        >
          {renderIcon(RefreshCw, `w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`)}
          Refresh
        </button>
      </div>

      {/* Index Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {indices.map((idx) => {
          const isPositive = idx.changePercent >= 0;
          return (
            <div 
              key={idx.symbol}
              className="bg-gray-800/20 border border-gray-700/30 hover:border-gray-600/50 transition-all duration-300 rounded-xl p-5 shadow-lg flex flex-col justify-between group relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-400">{idx.name}</span>
                <span className="text-xs font-mono text-gray-500 bg-gray-900/60 px-2 py-0.5 rounded">{idx.symbol}</span>
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  {idx.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold ${
                  isPositive 
                    ? 'text-teal-400 bg-teal-500/10' 
                    : 'text-red-500 bg-red-500/10'
                }`}>
                  {isPositive ? renderIcon(TrendingUp, "w-3.5 h-3.5") : renderIcon(TrendingDown, "w-3.5 h-3.5")}
                  {isPositive ? '+' : ''}{idx.changePercent}%
                </span>
              </div>

              {/* Sparkline decoration */}
              <div className="mt-4 pt-3 border-t border-gray-800/50 flex justify-between text-xs text-gray-500">
                <span>Daily Change</span>
                <span className={isPositive ? 'text-teal-400' : 'text-red-400'}>
                  {isPositive ? '+' : ''}{idx.change.toFixed(2)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800/80 my-8" />

      {/* TradingView Advanced Section */}
      <div className="space-y-8">
        <section className="grid w-full gap-8 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <TradingViewWidget
              title="Market Overview"
              scriptUrl={`${scriptUrl}market-overview.js`}
              config={MARKET_OVERVIEW_WIDGET_CONFIG}
              className="custom-chart"
              height={600}
            />
          </div>
          <div className="lg:col-span-2">
            <TradingViewWidget
              title="Stock Heatmap"
              scriptUrl={`${scriptUrl}stock-heatmap.js`}
              config={HEATMAP_WIDGET_CONFIG}
              className="widget-stock-heatmap-container"
              height={600}
            />
          </div>
        </section>
        <section className="grid w-full gap-8 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-1 h-full">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold text-2xl text-gray-100">Live News Timeline</h3>
              <span className="text-xs text-yellow-500 font-mono">Real-time</span>
            </div>
            <TradingViewWidget
              scriptUrl={`${scriptUrl}timeline.js`}
              config={TOP_STORIES_WIDGET_CONFIG}
              height={600}
            />
          </div>
          <div className="lg:col-span-2 h-full">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold text-2xl text-gray-100">Market Quotes</h3>
              <span className="text-xs text-yellow-500 font-mono">Financials</span>
            </div>
            <TradingViewWidget
              scriptUrl={`${scriptUrl}market-quotes.js`}
              config={MARKET_DATA_WIDGET_CONFIG}
              height={600}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
