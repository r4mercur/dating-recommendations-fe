import {useUserStore} from "@/stores/user.js";

/** the auth endpoints handle tokens themselves and must never trigger a refresh */
const AUTH_PATH = '/api/auth/';

function request(path, options, token) {
    const headers = new Headers(options.headers || {});
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    return fetch(path, {...options, headers});
}

/**
 * fetch wrapper for the user service: adds the bearer token, parses JSON and
 * turns problem responses (RFC 9457) into errors.
 * An access token about to expire is refreshed first. A 401 refreshes once and repeats the request;
 * only if that fails the user is logged out.
 */
export async function apiFetch(path, options = {}) {
    const userStore = useUserStore();
    const isAuthCall = path.startsWith(AUTH_PATH);

    const token = isAuthCall ? null : await userStore.freshToken();
    let response = await request(path, options, token);

    if (response.status === 401 && token && !isAuthCall) {
        if (await userStore.refreshSession()) {
            response = await request(path, options, userStore.token);
        }
        if (response.status === 401) {
            await userStore.logout();
        }
    }

    if (!response.ok) {
        const problem = await response.json().catch(() => ({}));
        const error = new Error(problem.detail || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        throw error;
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}
