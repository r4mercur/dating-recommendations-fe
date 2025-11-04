<script setup>
import {computed, onMounted, ref} from 'vue'
import ProfileTile from '@/components/ProfileTile.vue'
import {useRecommendationsStore} from "@/stores/recommendation.js";
import {useUserStore} from "@/stores/user.js";

const recommendationsStore = useRecommendationsStore();
const userStore = useUserStore();

const rawMatches = ref([])
const loading = ref(true)

const matches = computed(() => {
  if (!rawMatches.value || rawMatches.value.length === 0) {
    return [];
  }

  if (userStore.contacts && userStore.contacts.length > 0) {
    const contactedIds = userStore.contacts.map(contact => contact.contactUser.referenceId);
    return rawMatches.value.filter(match => !contactedIds.includes(match.referenceId));
  }

  return rawMatches.value;
});

onMounted(async () => {
  if (userStore.user?.referenceId && userStore.contacts == null) {
    await userStore.getContactsForUser(userStore.user.referenceId);
  }

  if (recommendationsStore && recommendationsStore.recommendations) {
    let payload = recommendationsStore.recommendations.recommendations;
    const result = await userStore.getMatchesByRecommendations(payload);
    rawMatches.value = result ?? userStore.getMatches();
  }

  if (userStore.hasLoadedMatches) {
    loading.value = false
    return
  }

  setTimeout(() => {
    loading.value = false
    userStore.setHasLoadedMatches(true)
  }, 1500)
})

const handleViewProfile = (profile) => {
  console.log('View profile:', profile)
  // here recirect to detail view of the profile
}

const handleLike = (profile) => {
  console.log('Liked profile:', profile)
  userStore.sendLike(profile.referenceId);
}

const handlePass = (profile) => {
  console.log('Passed profile:', profile);
  rawMatches.value = rawMatches.value.filter(match => match.id !== profile.id);
  userStore.sendRejection(profile.referenceId);
  userStore.removeMatch(profile.id);
}
</script>

<template>
  <div class="matches-container">
    <div v-if="!loading" class="matches-header">
      <h1>Your Matches</h1>
      <p class="matches-subtitle">{{ matches.length }} potential partners found</p>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <i class="pi pi-spin pi-spinner"></i>
      </div>
      <p>Loading your matches...</p>
    </div>

    <div v-else-if="matches.length === 0" class="no-matches">
      <div class="no-matches-icon">
        <i class="pi pi-heart"></i>
      </div>
      <h3>No matches found</h3>
      <p>Expand your search criteria - or comeback later!</p>
    </div>

    <div v-else class="matches-grid">
      <ProfileTile
        v-for="match in matches"
        :key="match.id"
        :profile="match"
        @view-profile="handleViewProfile"
        @like="handleLike"
        @pass="handlePass"
      />
    </div>
  </div>
</template>

<style scoped>
.matches-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px;
  min-height: calc(100vh - 60px);
}

.matches-header {
  text-align: center;
  margin-bottom: 40px;
}

.matches-header h1 {
  font-size: 32px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: rgba(235, 235, 235, 0.9);
}

.matches-subtitle {
  font-size: 16px;
  color: rgba(235, 235, 235, 0.64);
  margin: 0;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: rgba(235, 235, 235, 0.64);
}

.loading-spinner {
  font-size: 32px;
  margin-bottom: 16px;
  color: #ffa726;
}

.no-matches {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.no-matches-icon {
  font-size: 64px;
  color: rgba(235, 235, 235, 0.3);
  margin-bottom: 24px;
}

.no-matches h3 {
  font-size: 24px;
  color: rgba(235, 235, 235, 0.8);
  margin: 0 0 12px 0;
}

.no-matches p {
  font-size: 16px;
  color: rgba(235, 235, 235, 0.6);
  margin: 0;
}

.matches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  justify-items: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .matches-container {
    padding: 20px;
  }

  .matches-header h1 {
    font-size: 28px;
  }

  .matches-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .matches-container {
    padding: 16px;
  }

  .matches-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>