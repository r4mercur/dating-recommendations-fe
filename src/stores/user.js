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
        async register(username, email, password) {
            // TODO: Call register endpoint and check missing inputs
        },
        async logout() {
            this.user = null;
            this.matches = null;
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
                this.setAvatar(user.photo);
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
        },
        async updateUser(user) {
            try {
                const response = await fetch('/api/user', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(user)
                })
            } catch (error) {
                throw error;
            }
        },
        async uploadAvatar(file) {
            if (this.user == null) {
                return new Error('User not logged in');
            }

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/photos/' + this.user.referenceId, {
                    method: 'POST',
                    headers: {},
                    body: formData
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                this.setAvatar(data.url);
                return data;
            } catch (error) {
                throw error;
            }
        }
    }
})