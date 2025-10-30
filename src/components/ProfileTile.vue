<script setup>
import { computed } from 'vue'

const props = defineProps({
  profile: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['view-profile', 'like', 'pass'])

const age = computed(() => {
  if (props.profile.birthDate) {
    const today = new Date()
    const birth = new Date(props.profile.birthDate)
    return today.getFullYear() - birth.getFullYear()
  }
  return props.profile.age || 'N/A'
})

const displayInterests = computed(() => {
  return props.profile.interests?.slice(0, 3) || []
})

const handleViewProfile = () => {
  emit('view-profile', props.profile)
}

const handleLike = () => {
  emit('like', props.profile)
}

const handlePass = () => {
  emit('pass', props.profile)
}
</script>

<template>
  <div class="profile-tile">
    <div class="tile-header">
      <img
        :src="profile.avatar || '/src/assets/avatar.jpg'"
        :alt="profile.name"
        class="tile-avatar"
      />
      <div class="online-indicator" v-if="profile.isOnline"></div>
    </div>

    <div class="tile-content">
      <div class="tile-info">
        <h3 class="tile-name">{{ profile.name }}</h3>
        <p class="tile-details">{{ age }} years • {{ profile.location || 'Unknown' }}</p>

        <div class="tile-bio" v-if="profile.bio">
          <p>{{ profile.bio.length > 80 ? profile.bio.substring(0, 80) + '...' : profile.bio }}</p>
        </div>

        <div class="tile-interests" v-if="displayInterests.length > 0">
          <span
            v-for="interest in displayInterests"
            :key="interest"
            class="interest-tag-small"
          >
            {{ interest }}
          </span>
          <span v-if="profile.interests?.length > 3" class="more-interests">
            +{{ profile.interests.length - 3 }}
          </span>
        </div>

        <div class="tile-stats">
          <div class="stat-badge" v-if="profile.distance">
            <i class="pi pi-map-marker"></i>
            <span>{{ profile.distance }}km</span>
          </div>
          <div class="stat-badge" v-if="profile.compatibility">
            <i class="pi pi-heart"></i>
            <span>{{ profile.compatibility }}%</span>
          </div>
        </div>
      </div>

      <div class="tile-actions">
        <button class="action-btn pass-btn" @click="handlePass" title="Pass">
          <i class="pi pi-times"></i>
        </button>
        <button class="action-btn view-btn" @click="handleViewProfile" title="Show profile">
          <i class="pi pi-eye"></i>
        </button>
        <button class="action-btn like-btn" @click="handleLike" title="Like">
          <i class="pi pi-heart"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-tile {
  background: linear-gradient(145deg, #34495e, #2c3e50);
  border: 1px solid #34495e;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  max-width: 320px;
  width: 100%;
}

.profile-tile:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #ffa726;
}

.tile-header {
  position: relative;
  padding: 20px 20px 0;
  text-align: center;
}

.tile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.profile-tile:hover .tile-avatar {
  border-color: #ffa726;
}

.online-indicator {
  position: absolute;
  top: 25px;
  right: 25px;
  width: 12px;
  height: 12px;
  background: #66bb6a;
  border-radius: 50%;
  border: 2px solid white;
}

.tile-content {
  padding: 16px 20px 20px;
}

.tile-info {
  margin-bottom: 16px;
}

.tile-name {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
  color: rgba(235, 235, 235, 0.9);
  text-align: center;
}

.tile-details {
  font-size: 14px;
  color: rgba(235, 235, 235, 0.64);
  margin: 0 0 12px 0;
  text-align: center;
}

.tile-bio {
  margin-bottom: 12px;
}

.tile-bio p {
  font-size: 13px;
  line-height: 1.4;
  color: rgba(235, 235, 235, 0.7);
  margin: 0;
  text-align: center;
}

.tile-interests {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 16px;
}

.interest-tag-small {
  background: rgba(33, 150, 243, 0.2);
  color: #64b5f6;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid rgba(33, 150, 243, 0.3);
}

.more-interests {
  background: rgba(158, 158, 158, 0.2);
  color: #bdbdbd;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.tile-stats {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(235, 235, 235, 0.64);
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 8px;
  border-radius: 8px;
}

.stat-badge i {
  font-size: 10px;
}

.tile-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.action-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.3s ease;
}

.pass-btn {
  border-color: #ef5350;
  color: #ef5350;
}

.pass-btn:hover {
  background: #ef5350;
  color: white;
  transform: scale(1.1);
}

.view-btn {
  border-color: #ffa726;
  color: #ffa726;
}

.view-btn:hover {
  background: #ffa726;
  color: white;
  transform: scale(1.1);
}

.like-btn {
  border-color: #66bb6a;
  color: #66bb6a;
}

.like-btn:hover {
  background: #66bb6a;
  color: white;
  transform: scale(1.1);
}

/* Responsive Design */
@media (max-width: 480px) {
  .profile-tile {
    max-width: 280px;
  }

  .tile-avatar {
    width: 100px;
    height: 100px;
  }

  .tile-name {
    font-size: 18px;
  }

  .action-btn {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
}
</style>