import {defineStore} from "pinia";
import {router} from "@/router.js";
import {apiFetch} from "@/api.js";
import {useRecommendationsStore} from "@/stores/recommendation.js";
import {useReactionsStore} from "@/stores/reactions.js";

const STORAGE_KEY = 'user';
/** refresh this long before the access token expires, so no request runs into a 401 */
const REFRESH_MARGIN_MS = 60 * 1000;

/** `exp` claim of a JWT in milliseconds, null if there is none */
function tokenExpiry(token) {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const exp = JSON.parse(atob(payload)).exp;
        return exp ? exp * 1000 : null;
    } catch {
        return null;
    }
}

/** The persisted session lives as long as it can be refreshed; without refresh token as long as the JWT. */
function sessionExpiry(state) {
    return state.refreshExpiresAt ?? tokenExpiry(state.token) ?? Date.now() + 24 * 60 * 60 * 1000;
}

/** Session as another tab may have written it, read straight from the storage. */
function readStoredSession() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY))?.value ?? null;
    } catch {
        return null;
    }
}

/** the running refresh of this tab, so parallel 401s share one refresh */
let refreshing = null;

export const useUserStore = defineStore(STORAGE_KEY, {
    persist: {
        storage: {
            getItem: (key) => {
                const raw = localStorage.getItem(key);
                if (!raw) return null;

                try {
                    const parsed = JSON.parse(raw);
                    if (parsed._expires && Date.now() > parsed._expires) {
                        localStorage.removeItem(key);
                        return null;
                    }
                    return JSON.stringify(parsed.value);
                } catch (e) {
                    return raw;
                }
            },
            setItem: (key, value) => {
                const state = JSON.parse(value);
                const payload = {
                    value: state,
                    _expires: sessionExpiry(state)
                };
                localStorage.setItem(key, JSON.stringify(payload));
            },
            removeItem: (key) => localStorage.removeItem(key)
        }
    },
    state: () => {
        return {
            user: null,
            token: null,
            refreshToken: null,
            /** access token expiry in ms */
            accessExpiresAt: null,
            /** refresh token expiry in ms, the end of the session */
            refreshExpiresAt: null,
            avatar: null
        }
    },
    actions: {
        setUser(user) {
            this.user = user;
        },
        setAvatar(avatar) {
            this.avatar = avatar;
        },
        /** Registration (RegistrationRequest): name, email, password, birthDate, gender, address, bio, interests, hobbies. */
        async register(registration) {
            return apiFetch('/api/user', {
                method: 'POST',
                body: JSON.stringify(registration)
            });
        },
        /** Stores the token pair of a login or refresh response. */
        applyTokens({access_token, expires_in, refresh_token, refresh_expires_in}) {
            const now = Date.now();
            this.token = access_token;
            this.accessExpiresAt = tokenExpiry(access_token) ?? (expires_in ? now + expires_in * 1000 : null);
            this.refreshToken = refresh_token ?? null;
            this.refreshExpiresAt = refresh_expires_in ? now + refresh_expires_in * 1000 : null;
            // write through right away: another tab waiting for the lock must see the new refresh token
            this.$persist?.();
        },
        /**
         * Gets a new token pair. Refresh tokens rotate and a reused one revokes the whole session, so only one
         * refresh may run at a time, across tabs too (Web Locks). A tab that waited takes over the tokens another
         * tab just got instead of sending its outdated refresh token.
         * @returns {Promise<boolean>} false if the session can't be refreshed (expired or revoked)
         */
        refreshSession() {
            refreshing ??= this.runRefresh().finally(() => (refreshing = null));
            return refreshing;
        },
        async runRefresh() {
            const usedRefreshToken = this.refreshToken;
            const refresh = async () => {
                const stored = readStoredSession();
                if (stored?.refreshToken && stored.refreshToken !== usedRefreshToken) {
                    this.token = stored.token;
                    this.accessExpiresAt = stored.accessExpiresAt;
                    this.refreshToken = stored.refreshToken;
                    this.refreshExpiresAt = stored.refreshExpiresAt;
                    return true;
                }
                if (!usedRefreshToken) return false;
                try {
                    // plain fetch: apiFetch would try to refresh again on a 401
                    const response = await fetch('/api/auth/refresh', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({refresh_token: usedRefreshToken})
                    });
                    if (!response.ok) return false;
                    this.applyTokens(await response.json());
                    return true;
                } catch {
                    return false;
                }
            };
            return navigator.locks ? navigator.locks.request('session-refresh', refresh) : refresh();
        },
        /** The access token, refreshed first if it is about to expire. */
        async freshToken() {
            if (this.refreshToken && this.accessExpiresAt && this.accessExpiresAt - Date.now() < REFRESH_MARGIN_MS) {
                await this.refreshSession();
            }
            return this.token;
        },
        async logout() {
            const refreshToken = this.refreshToken;
            if (refreshToken) {
                // revoke the session in the backend too; logging out locally works regardless
                fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({refresh_token: refreshToken})
                }).catch(() => {});
            }
            this.user = null;
            this.token = null;
            this.refreshToken = null;
            this.accessExpiresAt = null;
            this.refreshExpiresAt = null;
            this.avatar = null;
            useRecommendationsStore().reset();
            useReactionsStore().reset();
            await router.push('/login');
        },
        async login(email, password) {
            try {
                const tokenResponse = await apiFetch('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({
                        username: email,
                        password: password
                    })
                });
                this.applyTokens(tokenResponse);

                const user = await apiFetch('/api/me');
                this.setUser(user);
                this.setAvatar(user.photo);
                await router.push('/');
                return user;
            } catch (error) {
                this.setUser(null);
                this.token = null;
                this.refreshToken = null;
                throw error;
            }
        },
        async updateUser(changes) {
            const user = await apiFetch('/api/me', {
                method: 'PATCH',
                body: JSON.stringify(changes)
            });
            this.setUser(user);
            return user;
        },
        async updatePreferences(preferences) {
            const saved = await apiFetch('/api/me/preferences', {
                method: 'PUT',
                body: JSON.stringify(preferences)
            });
            this.setUser({...this.user, preferences: saved});
            return saved;
        },
        /** Replaces the profile songs: [{spotifyTrackId, anthem}], the order is the position. */
        async saveSongs(songs) {
            const saved = await apiFetch('/api/me/songs', {
                method: 'PUT',
                body: JSON.stringify(songs.map(({spotifyTrackId, anthem}) => ({spotifyTrackId, anthem: !!anthem})))
            });
            this.setUser({...this.user, songs: saved});
            return saved;
        },
        /** Replaces the favorite games: [{igdbId}], the order is the position. */
        async saveGames(games) {
            const saved = await apiFetch('/api/me/games', {
                method: 'PUT',
                body: JSON.stringify(games.map(({igdbId}) => ({igdbId})))
            });
            this.setUser({...this.user, games: saved});
            return saved;
        },
        async uploadAvatar(file) {
            if (this.user == null) {
                return new Error('User not logged in');
            }

            const formData = new FormData();
            formData.append('file', file);

            const data = await apiFetch('/api/me/photo', {
                method: 'POST',
                body: formData
            });
            this.setAvatar(data.url);
            return data;
        }
    }
})
