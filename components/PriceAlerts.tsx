"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Bell, Trash2, Plus, BellRing } from "lucide-react";
import { toast } from "sonner";

interface PriceAlertsProps {
  watchlist: StockWithData[];
  userEmail: string;
}

interface LocalAlert {
  id: string;
  symbol: string;
  company: string;
  alertName: string;
  alertType: "upper" | "lower";
  threshold: number;
}

export default function PriceAlerts({ watchlist, userEmail }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<LocalAlert[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Form states
  const [symbol, setSymbol] = useState("");
  const [alertName, setAlertName] = useState("");
  const [alertType, setAlertType] = useState<"upper" | "lower">("upper");
  const [threshold, setThreshold] = useState("");

  const storageKey = `signalist_alerts_${userEmail}`;

  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setAlerts(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse alerts", e);
      }
    }
  }, [storageKey]);

  const saveAlerts = (newAlerts: LocalAlert[]) => {
    setAlerts(newAlerts);
    localStorage.setItem(storageKey, JSON.stringify(newAlerts));
  };

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol) {
      toast.error("Please select a stock symbol");
      return;
    }
    if (!threshold || isNaN(parseFloat(threshold)) || parseFloat(threshold) <= 0) {
      toast.error("Please enter a valid threshold price");
      return;
    }
    const selectedStock = watchlist.find((s) => s.symbol === symbol);
    if (!selectedStock) {
      toast.error("Selected stock not found in watchlist");
      return;
    }

    const newAlert: LocalAlert = {
      id: crypto.randomUUID(),
      symbol,
      company: selectedStock.company,
      alertName: alertName.trim() || `${symbol} Alert`,
      alertType,
      threshold: parseFloat(threshold),
    };

    saveAlerts([newAlert, ...alerts]);
    toast.success(`Alert "${newAlert.alertName}" created successfully!`);

    // Reset form
    setSymbol("");
    setAlertName("");
    setAlertType("upper");
    setThreshold("");
    setIsOpen(false);
  };

  const handleDeleteAlert = (id: string, name: string) => {
    const updated = alerts.filter((a) => a.id !== id);
    saveAlerts(updated);
    toast.success(`Alert "${name}" deleted`);
  };

  // Helper to determine active stock price and if alert is triggered
  const getAlertStatus = (alert: LocalAlert) => {
    const stock = watchlist.find((s) => s.symbol === alert.symbol);
    if (!stock || stock.currentPrice === undefined) {
      return { price: "N/A", isTriggered: false };
    }
    const currentPrice = stock.currentPrice;
    const isTriggered =
      alert.alertType === "upper"
        ? currentPrice >= alert.threshold
        : currentPrice <= alert.threshold;
    return { price: `$${currentPrice.toFixed(2)}`, isTriggered };
  };

  if (!isMounted) {
    return (
      <div className="watchlist-alerts flex flex-col w-full h-full min-h-[300px] items-center justify-center border border-gray-600 bg-gray-800 rounded-lg p-6">
        <span className="text-gray-400">Loading alerts...</span>
      </div>
    );
  }

  return (
    <div className="watchlist-alerts flex flex-col w-full h-full">
      <div className="flex items-center justify-between w-full mb-4">
        <h2 className="watchlist-title flex items-center gap-2">
          <Bell className="h-5 w-5 text-yellow-500" /> Price Alerts
        </h2>

        {watchlist.length > 0 && (
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <button className="add-alert">
                <Plus className="h-4 w-4" /> Add Alert
              </button>
            </DialogTrigger>
            <DialogContent className="alert-dialog">
              <DialogHeader>
                <DialogTitle className="alert-title flex items-center gap-2">
                  <Bell className="h-5 w-5 text-yellow-500" /> Create Price Alert
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAlert} className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-400">Alert Name (optional)</label>
                  <input
                    type="text"
                    value={alertName}
                    onChange={(e) => setAlertName(e.target.value)}
                    placeholder="e.g. Apple Breakout"
                    className="form-input"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-400">Select Watchlist Stock</label>
                  <select
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="form-input text-gray-400 bg-gray-800 border-gray-600 rounded-lg h-12 w-full px-3 py-3"
                  >
                    <option value="" disabled className="text-gray-500">
                      Choose stock
                    </option>
                    {watchlist.map((stock) => (
                      <option key={stock.symbol} value={stock.symbol} className="text-white bg-gray-800">
                        {stock.symbol} - {stock.company}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-400">Trigger Condition</label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value as "upper" | "lower")}
                    className="form-input text-gray-400 bg-gray-800 border-gray-600 rounded-lg h-12 w-full px-3 py-3"
                  >
                    <option value="upper" className="text-white bg-gray-800">Price goes above (&ge;)</option>
                    <option value="lower" className="text-white bg-gray-800">Price goes below (&le;)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-400">Target Threshold Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="e.g. 185.00"
                    className="form-input"
                    required
                  />
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <DialogClose asChild>
                    <button
                      type="button"
                      className="flex-1 h-12 rounded-lg border border-gray-600 text-gray-300 font-medium hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </DialogClose>
                  <button
                    type="submit"
                    className="flex-1 h-12 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-gray-950 font-semibold transition-colors"
                  >
                    Create
                  </button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="alert-list scrollbar-hide-default">
        {alerts.length === 0 ? (
          <div className="alert-empty flex flex-col items-center justify-center gap-2 py-12">
            <Bell className="h-10 w-10 text-gray-600 opacity-40 mb-2" />
            <p className="font-semibold text-gray-400">No alerts configured</p>
            <p className="text-sm text-gray-500 max-w-[240px]">
              {watchlist.length === 0
                ? "Add stocks to your watchlist first to configure price alerts."
                : "Create an alert to monitor breakouts or drops."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {alerts.map((alert) => {
              const { price, isTriggered } = getAlertStatus(alert);
              return (
                <div
                  key={alert.id}
                  className={`alert-item transition-all duration-300 ${
                    isTriggered
                      ? "border-yellow-500 bg-yellow-500/10 shadow-md shadow-yellow-500/5 animate-pulse"
                      : "border-gray-600 bg-gray-700/40 hover:bg-gray-700/60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="alert-name flex items-center gap-1.5 text-base font-semibold">
                        {isTriggered && <BellRing className="h-4 w-4 text-yellow-500 animate-bounce" />}
                        {alert.alertName}
                      </h4>
                      <p className="text-sm text-yellow-500/90 font-bold">
                        {alert.symbol}
                        <span className="text-xs text-gray-400 font-normal ml-2">
                          {alert.company}
                        </span>
                      </p>
                    </div>
                    {isTriggered && (
                      <span className="text-[10px] bg-yellow-500 text-gray-950 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Triggered
                      </span>
                    )}
                  </div>

                  <div className="alert-details border-gray-600 mt-2 pb-2">
                    <span className="text-xs text-gray-400">Current: {price}</span>
                    <span className="text-xs text-gray-300 font-medium">
                      Trigger: {alert.alertType === "upper" ? "≥" : "≤"} ${alert.threshold.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => handleDeleteAlert(alert.id, alert.alertName)}
                      className="alert-delete-btn p-1.5 transition-colors text-gray-400 hover:text-red-500 rounded-full hover:bg-red-500/10"
                      title="Delete alert"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
