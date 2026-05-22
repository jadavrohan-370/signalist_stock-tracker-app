import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getWatchlistWithDataAction } from "@/lib/actions/watchlist.actions";
import { getNews, searchStocks } from "@/lib/actions/finnhub.actions";
import WatchlistClient from "./WatchlistClient";

export const metadata = {
  title: "Watchlist - Signalist",
  description: "Track your stock watchlists, price targets, and customized market alert notifications.",
};

export default async function WatchlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  // Fetch watchlist with current market prices and info
  const watchlist = await getWatchlistWithDataAction();

  // Fetch news relating to watchlisted symbols, or general news fallback
  const symbols = watchlist.map((item) => item.symbol);
  const news = await getNews(symbols);

  // Fetch list of popular stocks for the search dialog
  const initialStocks = await searchStocks();

  return (
    <WatchlistClient
      initialWatchlist={watchlist}
      news={news}
      initialStocks={initialStocks}
      userEmail={session.user.email}
    />
  );
}
