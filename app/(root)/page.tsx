import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMarketIndices } from "@/lib/actions/finnhub.actions";
import { TICKER_TAPE_WIDGET_CONFIG } from "@/lib/constants";
import TradingViewWidget from "@/components/TradingViewWidget";
import DashboardClient from "@/components/DashboardClient";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  const user = {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  };

  // Fetch index data (live or simulated mock values)
  const indices = await getMarketIndices();

  return (
    <div className="space-y-6">
      {/* TradingView Ticker Tape Ribbon */}
      <div className="w-full relative overflow-hidden bg-gray-900 border border-gray-800 rounded-xl shadow-lg p-0.5">
        <TradingViewWidget
          scriptUrl="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
          config={TICKER_TAPE_WIDGET_CONFIG}
          height={72}
        />
      </div>

      {/* Main Glassmorphic Dashboard Body */}
      <DashboardClient user={user} indices={indices} />
    </div>
  );
}
