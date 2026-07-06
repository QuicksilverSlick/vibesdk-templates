/**
 * Tiny typed fetch helper for this app's own JSON API (not the auth routes —
 * those go through `@/lib/auth-client`). All responses follow the worker's
 * `{ success, data } | { success, error }` envelope. Credentials are included
 * so the better-auth session cookie rides along.
 */

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(path, {
		...init,
		credentials: 'include',
		headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
	});
	const body = (await res.json()) as ApiResponse<T>;
	if (!res.ok || !body.success) {
		throw new Error(body.error ?? `Request failed: ${res.status}`);
	}
	return body.data as T;
}

export interface Task {
	id: string;
	userId: string;
	title: string;
	completed: boolean;
	createdAt: number;
}

export const listTasks = () => api<Task[]>('/api/tasks');
export const createTask = (title: string) =>
	api<Task>('/api/tasks', { method: 'POST', body: JSON.stringify({ title }) });
