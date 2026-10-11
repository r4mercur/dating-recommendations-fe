import {defineStore} from "pinia";
import {apiFetch} from "@/api.js";

export const TagCategory = Object.freeze({
    INTEREST: 'INTEREST',
    HOBBY: 'HOBBY',
});

/** Tag catalog (GET /api/tags): profiles contain slugs like "board_games", the UI shows labels. */
export const useTagsStore = defineStore('tags', {
    state: () => ({
        tags: [],
        loaded: false,
    }),
    getters: {
        labels: (state) => Object.fromEntries(state.tags.map(tag => [tag.slug, tag.label])),
        label() {
            return (slug) => this.labels[slug]
                ?? slug.replace(/_/g, ' ').replace(/^\w/, char => char.toUpperCase());
        },
        /** options for a select: [{label, value: slug}] */
        options: (state) => (category) => state.tags
            .filter(tag => tag.category === category)
            .map(tag => ({label: tag.label, value: tag.slug})),
    },
    actions: {
        async load() {
            if (this.loaded) return;
            try {
                this.tags = await apiFetch('/api/tags');
                this.loaded = true;
            } catch (error) {
                console.error('Error loading tags:', error);
            }
        },
    }
});
