import {defineStore} from "pinia";

export const useRecommendationsStore = defineStore('recommendations', {
    persist: true,
    state: () => (
        {
            recommendations: [],
        }
    ),
    actions: {
        reset () {
            this.recommendations = [];
        },
        async getRecommendations(userId) {
            try {
                const response = await fetch('/users/recommendations/' + userId);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                this.recommendations = await response.json();
            } catch (error) {
                console.error('Error fetching recommendations:', error);
                this.recommendations = [];
            }
        },
    }
});