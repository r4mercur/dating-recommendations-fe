import {useUserStore} from "@/stores/user.js";

/**
 * fetch wrapper for the user service: adds the bearer token, parses JSON and
 * turns problem responses (RFC 9457) into errors. A 401 with a token logs the user out.
 */
export async function apiFetch(path, options = {}) {
    const userStore = useUserStore();
    const headers = new Headers(options.headers || {});

    if (userStore.token) {
        headers.set('Authorization', `Bearer ${userStore.token}`);
    }
    if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(path, {...options, headers});

    if (response.status === 401 && userStore.token) {
        await userStore.logout();
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
