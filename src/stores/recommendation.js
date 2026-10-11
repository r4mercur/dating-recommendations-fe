import {defineStore} from "pinia";
import {apiFetch} from "@/api.js";

const PAGE_SIZE = 12;

/** Recommended profiles (ProfileCard) loaded page by page via cursor. */
export const useRecommendationsStore = defineStore('recommendations', {
    state: () => (
        {
            items: [],
            nextCursor: null,
            loaded: false,
            loading: false,
        }
    ),
    getters: {
        hasMore: (state) => state.nextCursor !== null,
    },
    actions: {
        reset() {
            this.items = [];
            this.nextCursor = null;
            this.loaded = false;
        },
        async load() {
            if (this.loading) return;
            this.loading = true;
            try {
                const page = await apiFetch(`/api/me/recommendations?size=${PAGE_SIZE}`);
                this.items = page.items;
                this.nextCursor = page.nextCursor;
                this.loaded = true;
            } catch (error) {
                console.error('Error fetching recommendations:', error);
            } finally {
                this.loading = false;
            }
        },
        async loadMore() {
            if (this.loading || !this.hasMore) return;
            this.loading = true;
            try {
                const page = await apiFetch(`/api/me/recommendations?size=${PAGE_SIZE}&cursor=${encodeURIComponent(this.nextCursor)}`);
                const known = new Set(this.items.map(item => item.referenceId));
                this.items.push(...page.items.filter(item => !known.has(item.referenceId)));
                this.nextCursor = page.nextCursor;
            } catch (error) {
                console.error('Error fetching more recommendations:', error);
            } finally {
                this.loading = false;
            }
        },
        remove(referenceId) {
            this.items = this.items.filter(item => item.referenceId !== referenceId);
            if (this.items.length < PAGE_SIZE / 2) {
                this.loadMore();
            }
        },
        /** Puts a profile back, e.g. when sending the reaction failed. */
        restore(profile, index) {
            if (this.items.some(item => item.referenceId === profile.referenceId)) return;
            this.items.splice(Math.min(index, this.items.length), 0, profile);
        },
    }
});
