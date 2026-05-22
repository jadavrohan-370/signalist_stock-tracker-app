"use client";
import React, { useMemo, useState, useTransition, useEffect } from "react";
import { toggleWatchlistAction } from "@/lib/actions/watchlist.actions";
import { toast } from "sonner";

const WatchlistButton = ({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) => {
  const [added, setAdded] = useState<boolean>(!!isInWatchlist);
  const [isPending, startTransition] = useTransition();

  // Sync state if prop changes
  useEffect(() => {
    setAdded(!!isInWatchlist);
  }, [isInWatchlist]);

  const label = useMemo(() => {
    if (type === "icon") return "";
    if (isPending) return added ? "Removing..." : "Adding...";
    return added ? "Remove from Watchlist" : "Add to Watchlist";
  }, [added, type, isPending]);

  const handleClick = () => {
    if (isPending) return;
    
    // Optimistic UI update
    const next = !added;
    setAdded(next);

    startTransition(async () => {
      try {
        const res = await toggleWatchlistAction(symbol, company);
        if (res.success) {
          setAdded(res.isAdded);
          toast.success(
            res.isAdded 
              ? `${symbol} added to watchlist` 
              : `${symbol} removed from watchlist`
          );
          onWatchlistChange?.(symbol, res.isAdded);
        } else {
          // Revert on failure
          setAdded(!next);
          toast.error("Failed to update watchlist");
        }
      } catch (err) {
        setAdded(!next);
        toast.error("An error occurred");
      }
    });
  };

  if (type === "icon") {
    return (
      <button
        disabled={isPending}
        title={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        aria-label={added ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
        className={`watchlist-icon-btn ${added ? "watchlist-icon-added" : ""} ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
        onClick={handleClick}
      >
        {isPending ? (
          <svg className="animate-spin h-5 w-5 text-yellow-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={added ? "#FACC15" : "none"}
            stroke="#FACC15"
            strokeWidth="1.5"
            className="watchlist-star w-6 h-6 m-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
            />
          </svg>
        )}
      </button>
    );
  }

  return (
    <button 
      disabled={isPending}
      className={`watchlist-btn flex items-center justify-center gap-2 ${added ? "watchlist-remove" : ""} ${isPending ? "opacity-75 cursor-not-allowed" : ""}`} 
      onClick={handleClick}
    >
      {isPending ? (
        <svg className="animate-spin h-5 w-5 text-current" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      ) : showTrashIcon && added ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5 mr-1"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-7 4v6m4-6v6m4-6v6" />
        </svg>
      ) : null}
      <span>{label}</span>
    </button>
  );
};

export default WatchlistButton;
