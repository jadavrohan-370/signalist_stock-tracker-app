'use server';

import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getStockData } from "@/lib/actions/finnhub.actions";
import { revalidatePath } from "next/cache";

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    // Better Auth stores users in the "user" collection
    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

export async function toggleWatchlistAction(symbol: string, company: string): Promise<{ success: boolean; isAdded: boolean }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) {
      throw new Error("Unauthorized");
    }
    const email = session.user.email;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string }>({ email });
    if (!user) return { success: false, isAdded: false };

    const userId = (user.id as string) || String(user._id || '');
    const upperSymbol = symbol.toUpperCase();

    const existing = await Watchlist.findOne({ userId, symbol: upperSymbol });

    if (existing) {
      await Watchlist.deleteOne({ userId, symbol: upperSymbol });
      revalidatePath(`/watchlist`);
      revalidatePath(`/stocks/${upperSymbol}`);
      return { success: true, isAdded: false };
    } else {
      await Watchlist.create({
        userId,
        symbol: upperSymbol,
        company,
        addedAt: new Date(),
      });
      revalidatePath(`/watchlist`);
      revalidatePath(`/stocks/${upperSymbol}`);
      return { success: true, isAdded: true };
    }
  } catch (err) {
    console.error('toggleWatchlistAction error:', err);
    return { success: false, isAdded: false };
  }
}

export async function isSymbolInWatchlistAction(symbol: string): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) return false;

    const email = session.user.email;
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string }>({ email });
    if (!user) return false;

    const userId = (user.id as string) || String(user._id || '');
    const existing = await Watchlist.findOne({ userId, symbol: symbol.toUpperCase() });
    return !!existing;
  } catch (err) {
    console.error('isSymbolInWatchlistAction error:', err);
    return false;
  }
}

export async function getWatchlistWithDataAction(): Promise<StockWithData[]> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) return [];

    const email = session.user.email;
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not found');

    const user = await db.collection('user').findOne<{ _id?: unknown; id?: string }>({ email });
    if (!user) return [];

    const userId = (user.id as string) || String(user._id || '');
    const items = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean();

    const result: StockWithData[] = [];
    
    await Promise.all(
      items.map(async (item) => {
        try {
          const data = await getStockData(item.symbol);
          const currentPrice = data.currentPrice;
          const changePercent = data.changePercent;
          
          result.push({
            userId,
            symbol: item.symbol,
            company: item.company,
            addedAt: item.addedAt,
            currentPrice,
            changePercent,
            priceFormatted: `$${currentPrice.toFixed(2)}`,
            changeFormatted: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
            marketCap: (() => {
              if (!data.marketCap) return 'N/A';
              let billions = data.marketCap;
              if (data.marketCap > 10000) {
                billions = data.marketCap / 1000;
              }
              if (billions >= 1000) {
                return `$${(billions / 1000).toFixed(2)}T`;
              }
              return `$${billions.toFixed(2)}B`;
            })(),
            peRatio: data.peRatio ? data.peRatio.toFixed(1) : 'N/A',
          });
        } catch (e) {
          console.error(`Error loading data for watchlisted stock ${item.symbol}:`, e);
          result.push({
            userId,
            symbol: item.symbol,
            company: item.company,
            addedAt: item.addedAt,
            priceFormatted: 'N/A',
            changeFormatted: 'N/A',
            marketCap: 'N/A',
            peRatio: 'N/A',
          });
        }
      })
    );

    // Sort by addedAt desc to maintain consistent order
    return result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  } catch (err) {
    console.error('getWatchlistWithDataAction error:', err);
    return [];
  }
}
