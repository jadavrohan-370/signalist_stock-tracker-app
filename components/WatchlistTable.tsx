"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import WatchlistButton from "@/components/WatchlistButton";
import { ArrowUpDown, TrendingUp, TrendingDown, Trash2 } from "lucide-react";

interface WatchlistTableProps {
  watchlist: StockWithData[];
  onRemoveSuccess?: (symbol: string) => void;
}

export default function WatchlistTable({ watchlist, onRemoveSuccess }: WatchlistTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<string>("addedAt");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderIcon = (Icon: any, className: string) => {
    if (!mounted) return <span className={className} style={{ display: 'inline-block' }} />;
    return <Icon className={className} />;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedWatchlist = [...watchlist].sort((a, b) => {
    let valA: any = a[sortField as keyof StockWithData];
    let valB: any = b[sortField as keyof StockWithData];

    // Handle string formatting/parsing for numeric fields
    if (fieldIsNumeric(sortField)) {
      valA = parseNumeric(valA);
      valB = parseNumeric(valB);
    }

    if (valA === undefined || valA === null || valA === 'N/A') return 1;
    if (valB === undefined || valB === null || valB === 'N/A') return -1;

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  function fieldIsNumeric(field: string) {
    return ["currentPrice", "changePercent", "marketCap", "peRatio"].includes(field);
  }

  function parseNumeric(val: any): number {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      // Strip formatting like $, %, B, T
      const cleaned = val.replace(/[\$,%,B,T]/g, "").trim();
      const num = parseFloat(cleaned);
      if (isNaN(num)) return 0;
      // Adjust if it was Trillion vs Billion
      if (val.includes("T")) return num * 1000;
      return num;
    }
    return 0;
  }

  return (
    <div className="watchlist-table">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="table-header-row">
              <th
                onClick={() => handleSort("symbol")}
                className="table-header text-left p-4 cursor-pointer hover:bg-gray-650 transition-colors select-none font-semibold text-sm"
              >
                <div className="flex items-center gap-1">
                  Symbol {renderIcon(ArrowUpDown, "h-3 w-3 opacity-60")}
                </div>
              </th>
              <th
                onClick={() => handleSort("company")}
                className="table-header text-left p-4 cursor-pointer hover:bg-gray-650 transition-colors select-none font-semibold text-sm hidden md:table-cell"
              >
                <div className="flex items-center gap-1">
                  Company {renderIcon(ArrowUpDown, "h-3 w-3 opacity-60")}
                </div>
              </th>
              <th
                onClick={() => handleSort("currentPrice")}
                className="table-header text-right p-4 cursor-pointer hover:bg-gray-650 transition-colors select-none font-semibold text-sm"
              >
                <div className="flex items-center justify-end gap-1">
                  Price {renderIcon(ArrowUpDown, "h-3 w-3 opacity-60")}
                </div>
              </th>
              <th
                onClick={() => handleSort("changePercent")}
                className="table-header text-right p-4 cursor-pointer hover:bg-gray-650 transition-colors select-none font-semibold text-sm"
              >
                <div className="flex items-center justify-end gap-1">
                  Change {renderIcon(ArrowUpDown, "h-3 w-3 opacity-60")}
                </div>
              </th>
              <th
                onClick={() => handleSort("marketCap")}
                className="table-header text-right p-4 cursor-pointer hover:bg-gray-650 transition-colors select-none font-semibold text-sm hidden sm:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  Market Cap {renderIcon(ArrowUpDown, "h-3 w-3 opacity-60")}
                </div>
              </th>
              <th
                onClick={() => handleSort("peRatio")}
                className="table-header text-right p-4 cursor-pointer hover:bg-gray-650 transition-colors select-none font-semibold text-sm hidden lg:table-cell"
              >
                <div className="flex items-center justify-end gap-1">
                  P/E {renderIcon(ArrowUpDown, "h-3 w-3 opacity-60")}
                </div>
              </th>
              <th className="table-header text-center p-4 w-16 select-none font-semibold text-sm">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedWatchlist.map((stock) => {
              const isPositive = (stock.changePercent ?? 0) >= 0;
              return (
                <tr
                  key={stock.symbol}
                  onClick={() => router.push(`/stocks/${stock.symbol}`)}
                  className="table-row group"
                >
                  <td className="table-cell p-4 font-bold text-yellow-500">
                    {stock.symbol}
                    <span className="block text-xs text-gray-400 font-normal md:hidden mt-0.5 max-w-[150px] truncate">
                      {stock.company}
                    </span>
                  </td>
                  <td className="table-cell p-4 text-gray-300 hidden md:table-cell max-w-[200px] truncate">
                    {stock.company}
                  </td>
                  <td className="table-cell p-4 text-right font-mono text-gray-100">
                    {stock.priceFormatted}
                  </td>
                  <td className={`table-cell p-4 text-right font-mono font-bold ${isPositive ? "text-teal-400" : "text-red-500"}`}>
                    <span className="flex items-center justify-end gap-1">
                      {isPositive ? renderIcon(TrendingUp, "h-4 w-4") : renderIcon(TrendingDown, "h-4 w-4")}
                      {stock.changeFormatted}
                    </span>
                  </td>
                  <td className="table-cell p-4 text-right font-mono text-gray-300 hidden sm:table-cell">
                    {stock.marketCap}
                  </td>
                  <td className="table-cell p-4 text-right font-mono text-gray-300 hidden lg:table-cell">
                    {stock.peRatio}
                  </td>
                  <td
                    className="table-cell p-4 text-center"
                    onClick={(e) => e.stopPropagation()} // Prevent navigation on action click
                  >
                    <WatchlistButton
                      symbol={stock.symbol}
                      company={stock.company}
                      isInWatchlist={true}
                      type="icon"
                      onWatchlistChange={() => onRemoveSuccess?.(stock.symbol)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
