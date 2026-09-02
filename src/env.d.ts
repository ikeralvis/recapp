/// <reference types="astro/client" />

interface ImportMetaEnv {
	readonly TURSO_DATABASE_URL: string;
	readonly TURSO_AUTH_TOKEN: string;
	readonly JWT_SECRET: string;
	readonly PUBLIC_VAPID_KEY: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare namespace App {
	interface Locals {
		user: { id: number; email: string; name: string; accentColor: string } | null;
	}
}
