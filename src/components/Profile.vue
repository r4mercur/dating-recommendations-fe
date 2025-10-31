<script setup>
import {computed, onMounted} from 'vue'
import {useUserStore} from '@/stores/user'
import {useRecommendationsStore} from "@/stores/recommendation.js";

const userStore = useUserStore()
const recommendationsStore = useRecommendationsStore();


const user = computed(() => userStore.user)
const avatar = computed(() => userStore.avatar)

const userData = computed(() => {
  return user.value || {
    name: 'Max Mustermann',
    username: 'maxmuster',
    email: 'max@example.com',
    bio: 'Software Developer aus Berlin. Leidenschaftlicher Vue.js Entwickler und Coffee Lover ☕',
    location: 'Berlin, Deutschland',
    joinDate: '2024-01-15',
    interests: ['Vue.js', 'JavaScript', 'Coffee', 'Reisen', 'Musik'],
    age: 28,
    profession: 'Software Developer'
  }
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// load recommendations initial after login
onMounted(() => {
  if (userStore.user && userStore.user.referenceId) {
    recommendationsStore.getRecommendations(userStore.user.referenceId);
  }
})
</script>

<template>
  <div class="profile-container">
    <div class="profile-sidebar">
      <div class="avatar-section">
        <img
          :src="avatar || '/src/assets/avatar.jpg'"
          :alt="userData.name"
          class="profile-avatar"
        />
        <h1 class="profile-name">{{ userData.name }}</h1>
        <p class="profile-username">@{{ userData.username }}</p>
      </div>

      <div class="profile-bio" v-if="userData.bio">
        <p>{{ userData.bio }}</p>
      </div>

      <div class="profile-details">
        <div class="detail-item" v-if="userData.location">
          <i class="pi pi-map-marker"></i>
          <span>{{ userData.location }}</span>
        </div>

        <div class="detail-item" v-if="userData.email">
          <i class="pi pi-envelope"></i>
          <span>{{ userData.email }}</span>
        </div>

        <div class="detail-item" v-if="userData.joinDate">
          <i class="pi pi-calendar"></i>
          <span>Joined since {{ formatDate(userData.joinDate) }}</span>
        </div>
      </div>
    </div>

    <div class="profile-content">
      <div class="profile-header">
        <h2>About me</h2>
        <button class="edit-button">
          <i class="pi pi-pencil"></i>
          Edit profile
        </button>
      </div>

      <div class="info-grid">
        <div class="info-card">
          <h3>Basic information</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="label">Age:</span>
              <span class="value">{{ userData.age }}</span>
            </div>
            <div class="info-item">
              <span class="label">Job:</span>
              <span class="value">{{ userData.profession }}</span>
            </div>
            <div class="info-item">
              <span class="label">Location:</span>
              <span class="value">{{ userData.location }}</span>
            </div>
          </div>
        </div>

        <div class="info-card">
          <h3>Interest</h3>
          <div class="interests-tags">
            <span
              v-for="interest in userData.interests"
              :key="interest"
              class="interest-tag"
            >
              {{ interest }}
            </span>
          </div>
        </div>

        <div class="info-card">
          <h3>Profile statistic</h3>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-number">42</span>
              <span class="stat-label red-color">Matches</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">18</span>
              <span class="stat-label green-color">Chats</span>
            </div>
            <div class="stat-item">
              <span class="stat-number">5</span>
              <span class="stat-label orange-color">Dates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  gap: 30px;
  min-height: calc(100vh - 200px);
}

.profile-sidebar {
  flex: 0 0 300px;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #34495e;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  height: fit-content;
  position: sticky;
  top: 30px;
}

.avatar-section {
  text-align: center;
  margin-bottom: 24px;
}

.profile-avatar {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #f6f8fa;
  margin-bottom: 16px;
}

.profile-name {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: rgba(235, 235, 235, 0.64);
}

.profile-username {
  font-size: 20px;
  color: #656d76;
  margin: 0 0 16px 0;
  font-weight: 300;
}

.profile-bio {
  padding: 16px 0;
  border-bottom: 1px solid #34495e;
  margin-bottom: 16px;
}

.profile-bio p {
  margin: 0;
  line-height: 1.5;
  color: #24292f;
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(235, 235, 235, 0.64);
  font-size: 14px;
}

.detail-item i {
  color: rgba(235, 235, 235, 0.64);
  width: 16px;
}

.profile-content {
  flex: 1;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #34495e;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #34495e;
}

.profile-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.edit-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(145deg, #34495e, #2c3e50);
  border: 1px solid #34495e;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.edit-button:hover {
  background: linear-gradient(135deg, #ffb74d, #ffa726) !important;
  border-color: #8c959f;
}

.info-grid {
  display: grid;
  gap: 24px;
}

.info-card {
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #34495e;
}

.info-card h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: rgba(235, 235, 235, 0.64);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item .label {
  font-weight: 500;
  color: #656d76;
}

.info-item .value {
  color: rgba(235, 235, 235, 0.64);
  font-weight: 400;
}

.interests-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.interest-tag {
  background: #dbeafe;
  color: #1e40af;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.interest-tag:hover {
  cursor: pointer;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.red-color {
  color: #ef5350;
}
.green-color {
  color: #66bb6a;
}
.orange-color {
  color: #ffa726;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: linear-gradient(145deg, #34495e, #2c3e50);
  border-radius: 6px;
  border: 1px solid rgba(235, 235, 235, 0.64);
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}


@media (max-width: 768px) {
  .profile-container {
    flex-direction: column;
    padding: 20px;
    gap: 20px;
  }

  .profile-sidebar {
    flex: none;
    position: static;
  }

  .profile-avatar {
    width: 150px;
    height: 150px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>