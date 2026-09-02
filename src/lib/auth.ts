import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const encoder = new TextEncoder();

export function hashPassword(password: string) {
	return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string) {
	return bcrypt.compare(password, hash);
}

export interface SessionPayload extends Record<string, unknown> {
	sub: string;
	email: string;
	name: string;
	accentColor: string;
}

export async function signSession(payload: SessionPayload, secret: string) {
	return new SignJWT(payload)
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('30d')
		.sign(encoder.encode(secret));
}

export async function verifySession(token: string, secret: string) {
	const { payload } = await jwtVerify<SessionPayload>(token, encoder.encode(secret));
	return payload;
}

export const SESSION_COOKIE = 'recapp_session';
