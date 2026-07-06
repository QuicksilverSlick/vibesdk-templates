/**
 * better-auth browser client. Same-origin (the API and the SPA are served by
 * the same Worker), so no baseURL/CORS configuration is needed.
 *
 * Use these in components ONLY when your app needs user accounts:
 *   import { signIn, signUp, signOut, useSession } from '@/lib/auth-client';
 * A simple single-user tool doesn't have to call any of them.
 */
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
