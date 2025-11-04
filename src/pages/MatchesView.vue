<script setup>
import {onMounted, ref} from 'vue'
import ProfileTile from '@/components/ProfileTile.vue'
import {useRecommendationsStore} from "@/stores/recommendation.js";
import {useUserStore} from "@/stores/user.js";

const recommendationsStore = useRecommendationsStore();
const userStore = useUserStore();


const matches = ref([])
const loading = ref(true)

// sample data
const sampleMatches = [
  {
    id: 1,
    name: 'Sarah Müller',
    age: 26,
    location: 'Berlin',
    bio: 'Liebeskochende Fotografin mit einer Leidenschaft für Reisen und gute Musik. Immer auf der Suche nach neuen Abenteuern!',
    avatar: '/src/assets/avatar.jpg',
    interests: ['Fotografie', 'Kochen', 'Reisen', 'Musik', 'Yoga', 'Kino'],
    distance: 2.5,
    compatibility: 94,
    isOnline: true
  },
  {
    id: 2,
    name: 'Emma Schmidt',
    age: 24,
    location: 'Hamburg',
    bio: 'Yoga-Lehrerin und Naturliebhaberin. Ich liebe es, neue Orte zu erkunden und authentische Menschen kennenzulernen.',
    avatar: '/src/assets/avatar.jpg',
    interests: ['Yoga', 'Natur', 'Meditation', 'Wandern'],
    distance: 15.2,
    compatibility: 87,
    isOnline: false
  },
  {
    id: 3,
    name: 'Lisa Wagner',
    age: 29,
    location: 'München',
    bio: 'Kunstliebhaberin und Designerin. Wenn ich nicht gerade an kreativen Projekten arbeite, erkunde ich die Stadt.',
    avatar: '/src/assets/avatar.jpg',
    interests: ['Design', 'Kunst', 'Kaffee', 'Architektur', 'Kultur'],
    distance: 8.7,
    compatibility: 91,
    isOnline: true
  },
  {
    id: 4,
    name: 'Anna Becker',
    age: 27,
    location: 'Köln',
    bio: 'Musikerin und Buchliebhaberin. Auf der Suche nach jemanden, der meine Leidenschaft für Live-Musik teilt.',
    avatar: '/src/assets/avatar.jpg',
    interests: ['Musik', 'Bücher', 'Konzerte', 'Gitarre'],
    distance: 12.3,
    compatibility: 89,
    isOnline: false
  },
  {
    id: 5,
    name: 'Julia Fischer',
    age: 25,
    location: 'Frankfurt',
    bio: 'Sportbegeisterte Weltenbummlerin. Immer bereit für spontane Abenteuer und tiefe Gespräche bei einem guten Wein.',
    avatar: '/src/assets/avatar.jpg',
    interests: ['Sport', 'Reisen', 'Wein', 'Fitness', 'Abenteuer'],
    distance: 5.1,
    compatibility: 92,
    isOnline: true
  },
  {
    id: 6,
    name: 'Sophie Klein',
    age: 28,
    location: 'Stuttgart',
    bio: 'Technikbegeisterte mit einem Herz für Tiere. Entwicklerin bei Tag, Tierfreundin bei Nacht.',
    avatar: '/src/assets/avatar.jpg',
    interests: ['Technologie', 'Tiere', 'Gaming', 'Programmieren'],
    distance: 18.9,
    compatibility: 85,
    isOnline: false
  }
]

onMounted(async () => {
  if (recommendationsStore && recommendationsStore.recommendations) {
    let payload = recommendationsStore.recommendations.recommendations;
    const result = await userStore.getMatchesByRecommendations(payload);
    matches.value = result ?? userStore.getMatches();
    await userStore.getContactsForUser(userStore.user.referenceId);
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
  console.log('Passed profile:', profile)
  // here send pass to a specific api endpoint
  // and remove the user from the matches list
  matches.value = matches.value.filter(match => match.id !== profile.id)
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