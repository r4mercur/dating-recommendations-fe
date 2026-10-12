import {defineStore} from "pinia";
import {router} from "@/router.js";
import {apiFetch} from "@/api.js";
import {useRecommendationsStore} from "@/stores/recommendation.js";
import {useReactionsStore} from "@/stores/reactions.js";

/** Expiry of the persisted session: the token's `exp` claim, so the store never outlives the JWT. */
function sessionExpiry(token) {
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const exp = JSON.parse(atob(payload)).exp;
        if (exp) return exp * 1000;
    } catch (e) {
        // no or malformed token: fall through to the default
    }
    return Date.now() + 24 * 60 * 60 * 1000;
}

export const useUserStore = defineStore('user', {
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
                    _expires: sessionExpiry(state.token)
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
        async logout() {
            this.user = null;
            this.token = null;
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
                this.token = tokenResponse.access_token;

                const user = await apiFetch('/api/me');
                this.setUser(user);
                this.setAvatar(user.photo);
                await router.push('/');
                return user;
            } catch (error) {
                this.setUser(null);
                this.token = null;
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
