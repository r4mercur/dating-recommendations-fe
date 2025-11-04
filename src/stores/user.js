import {defineStore} from "pinia";
import {router} from "@/router.js";

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
                const payload = {
                    value: JSON.parse(value),
                    _expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
                };
                localStorage.setItem(key, JSON.stringify(payload));
            },
            removeItem: (key) => localStorage.removeItem(key)
        }
    },
    state: () => {
        return {
            user: null,
            matches: null,
            contacts: null,
            avatar: null,
            hasLoadedMatches: false
        }
    },
    actions: {
        setUser(user) {
            this.user = user;
        },
        setAvatar(avatar) {
            if (avatar != null && avatar === "https://example.com/photo.jpg") {
                avatar = "/src/assets/avatar.jpg";
            }
            this.avatar = avatar;
        },
        setMatches(matches) {
            this.matches = matches;
        },
        setHasLoadedMatches(hasLoadedMatches) {
            this.hasLoadedMatches = hasLoadedMatches;
        },
        setUserContacts(contact) {
            if (this.contacts == null) {
                this.contacts = [];
                this.contacts.push(contact);
            } else {
                this.contacts.push(contact);
            }
        },
        async getMatches() {
            if (!this.contacts && this.user?.referenceId) {
                try {
                    await this.getContactsForUser(this.user.referenceId);
                } catch (error) {
                    console.error('Error loading contacts:', error);
                    this.contacts = [];
                }
            }

            if (!this.matches) {
                return null;
            }

            if (this.contacts && this.contacts.length > 0) {
                const contactedIds = this.contacts.map(contact => contact.contactReferenceId);
                return this.matches.filter(match => !contactedIds.includes(match.referenceId));
            }

            return this.matches;
        },
        removeMatch(id) {
            this.matches = this.matches.filter(match => match.id !== id);
        },
        async register(username, email, password, age, address, gender) {
            try {
                const user = {
                    name: username,
                    email: email,
                    password: password,
                    age: age,
                    address: address,
                    gender: gender,
                    status: "ACTIVE"
                };

                const response = await fetch('/api/user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(user)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } catch (error) {
                throw error;
            }
        },
        async logout() {
            this.user = null;
            this.matches = null;
            this.avatar = null;
            this.contacts = null;
            this.hasLoadedMatches = false;
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
        },
        async sendLike(referenceId) {
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userReferenceId: this.user.referenceId,
                        contactReferenceId: referenceId,
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                this.setUserContacts(data);
                return data;
            } catch (error) {
                throw error;
            }
        },
        async getContactsForUser(userId) {
            try {
                const response = await fetch('/api/contact/' + userId, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                this.setUserContacts(data);
                return data;
            } catch (e) {
                throw e;
            }
        },
        async sendRejection(referenceId) {
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userReferenceId: this.user.referenceId,
                        contactReferenceId: referenceId,
                        status: "REJECTED"
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                this.setUserContacts(data);
                return data;
            } catch (error) {
                throw error;
            }
        }
    }
})