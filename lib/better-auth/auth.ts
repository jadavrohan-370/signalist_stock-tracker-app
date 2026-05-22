import { betterAuth } from "better-auth";
import { mongodbAdapter} from "better-auth/adapters/mongodb";
import { connectToDatabase} from "@/database/mongoose";
import { nextCookies} from "better-auth/next-js";

let authInstance: ReturnType<typeof betterAuth> | null = null;
let initPromise: Promise<ReturnType<typeof betterAuth>> | null = null;

export const getAuth = async () => {
    if(authInstance) return authInstance;
    if (!initPromise) {
        initPromise = (async () => {
            const mongoose = await connectToDatabase();
            const db = mongoose.connection.db;
            if(!db) throw new Error('MongoDB connection not found');

            authInstance = betterAuth({
                database: mongodbAdapter(db as any),
                secret: process.env.BETTER_AUTH_SECRET,
                baseURL: process.env.BETTER_AUTH_URL,
                emailAndPassword: {
                    enabled: true,
                    disableSignUp: false,
                    requireEmailVerification: false,
                    minPasswordLength: 8,
                    maxPasswordLength: 128,
                    autoSignIn: true,
                },
                plugins: [nextCookies()],
            });
            return authInstance;
        })();
    }
    return initPromise;
}

function createLazyProxy(path: string[] = []): any {
    return new Proxy(() => {}, {
        get(target, prop, receiver) {
            if (typeof prop === 'symbol' || prop === 'then') {
                return undefined;
            }
            return createLazyProxy([...path, prop as string]);
        },
        async apply(target, thisArg, argumentsList) {
            const realAuth = await getAuth();
            let parent: any = realAuth;
            let current: any = realAuth;
            for (let i = 0; i < path.length; i++) {
                parent = current;
                current = current[path[i]];
            }
            if (typeof current === 'function') {
                return (current as Function).apply(parent, argumentsList);
            }
            return current;
        }
    });
}

export const auth = createLazyProxy() as ReturnType<typeof betterAuth>;
