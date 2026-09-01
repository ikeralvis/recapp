import { defineConfig } from 'drizzle-kit';

const isRemote = !!process.env.TURSO_AUTH_TOKEN;

export default defineConfig(
	isRemote
		? {
				out: './drizzle',
				schema: './src/db/schema.ts',
				dialect: 'turso',
				dbCredentials: {
					url: process.env.TURSO_DATABASE_URL!,
					authToken: process.env.TURSO_AUTH_TOKEN,
				},
			}
		: {
				out: './drizzle',
				schema: './src/db/schema.ts',
				dialect: 'sqlite',
				dbCredentials: {
					url: process.env.TURSO_DATABASE_URL!,
				},
			}
);
