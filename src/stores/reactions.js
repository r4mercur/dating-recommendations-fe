import {defineStore} from "pinia";
import {apiFetch} from "@/api.js";

export const ReactionType = Object.freeze({
    LIKE: 'LIKE',
    SUPER_LIKE: 'SUPER_LIKE',
    COMPLIMENT: 'COMPLIMENT',
    PASS: 'PASS',
});

/** UI limit for compliments, the backend allows up to 500 characters. */
export const COMPLIMENT_MAX_LENGTH = 140;

/**
 * Reactions to other profiles and the resulting matches (roadmap phase 3).
 * `celebratedMatch` drives the global match screen.
 */
export const useReactionsStore = defineStore('reactions', {
    state: () => ({
        types: {},
        matches: null,
        celebratedMatch: null,
    }),
    getters: {
        /** reactions of this type left today, Infinity if unlimited */
        remaining: (state) => (type) => state.types[type]?.remainingToday ?? Infinity,
    },
    actions: {
        /** Loads the reaction types with their rules and today's remaining quota. */
        async loadTypes() {
            try {
                const types = await apiFetch('/api/me/reactions/types');
                this.types = Object.fromEntries(types.map(type => [type.type, type]));
            } catch (error) {
                console.error('Error loading reaction types:', error);
            }
        },
        /** Sends the reaction, the response's `match` is set when both liked each other. */
        async react(targetReferenceId, type, message = null) {
            const reaction = await apiFetch('/api/me/reactions', {
                method: 'POST',
                body: JSON.stringify({targetReferenceId, type, message})
            });
            const quota = this.types[type];
            if (quota?.remainingToday != null) {
                quota.remainingToday = Math.max(0, quota.remainingToday - 1);
            }
            if (reaction.match && this.matches) {
                this.matches = [reaction.match, ...this.matches];
            }
            return reaction;
        },
        async loadMatches() {
            this.matches = await apiFetch('/api/me/matches');
            return this.matches;
        },
        celebrate(match) {
            this.celebratedMatch = match;
        },
        dismissMatch() {
            this.celebratedMatch = null;
        },
        reset() {
            this.types = {};
            this.matches = null;
            this.celebratedMatch = null;
        },
    }
});
