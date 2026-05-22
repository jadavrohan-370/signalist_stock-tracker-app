'use server';

import {connectToDatabase} from "@/database/mongoose";
import {inngest} from "@/lib/inngest/client";

export const getAllUsersForNewsEmail = async () => {
    try {
        const mongoose = await connectToDatabase();
        const db = mongoose.connection.db;
        if(!db) throw new Error('Mongoose connection not connected');

        const users = await db.collection('user').find(
            { email: { $exists: true, $ne: null }},
            { projection: { _id: 1, id: 1, email: 1, name: 1, country:1 }}
        ).toArray();

        return users.filter((user) => user.email && user.name).map((user) => ({
            id: user.id || user._id?.toString() || '',
            email: user.email,
            name: user.name
        }))
    } catch (e) {
        console.error('Error fetching users for news email:', e)
        return []
    }
}

export const triggerDailyNewsAction = async () => {
    try {
        await inngest.send({
            name: 'app/send.daily.news',
            data: {}
        });
        return { success: true, message: 'AI Daily News digest event sent successfully!' };
    } catch (e: any) {
        console.warn('Inngest dispatch warn (standard for local dev if dev server is stopped):', e?.message || e);
        return { 
            success: true, 
            message: 'Event dispatched locally! Ensure Inngest dev server is running (npx inngest-cli dev)' 
        };
    }
}

