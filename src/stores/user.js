import { defineStore } from "pinia";
import {router} from "@/router.js";

export const useUserStore = defineStore('user', {
    persist: true,
    state: () => {
        return {
            user: null,
            matches: null,
            avatar: null,
        }
    },
    actions: {
        setUser(user) {
            this.user = user;
        },
        setAvatar(avatar) {
            this.avatar = avatar;
        },
        setMatches(matches) {
            this.matches = matches;
        },
        getMatches() {
            return this.matches;
        },
        removeMatch(id) {
            this.matches = this.matches.filter(match => match.id !== id);
        },
        async logout() {
            this.user = null;
            this.avatar = null;
            await router.push('/login');
        },
        async login(email, password) {
            try {
                const response = await fetch('/api/user/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                const user = data.user || data.data || data;

                if (!user) {
                    throw new Error('No user data received from server');
                }

                this.setUser(user);
                await router.push('/');
                return user;
            } catch (error) {
                this.setUser(null);
                throw error;
            }
        },
        async getMatchesByRecommendations(referenceIds) {
            try {
                const response = await fetch('/api/user/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        referenceIds: referenceIds
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const matches = data.matches || data.data || data;
                this.setMatches(matches);
                return matches;
            } catch (error) {
                console.error('Error fetching recommendations:', error);
                this.matches = [];
            }
        }
    }
})