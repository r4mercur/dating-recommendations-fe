<script setup>
import {computed} from 'vue'
import defaultAvatar from '@/assets/avatar.jpg'
import {useSwipe} from '@/composables/useSwipe.js'
import {useTagsStore} from '@/stores/tags.js'

const props = defineProps({
  profile: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select', 'swipe'])

const swipe = useSwipe({
  onTap: () => emit('select', props.profile),
  onSwipe: (direction) => {
    emit('select', props.profile)
    emit('swipe', direction)
    // the parent removes the tile and animates it out from here; if it doesn't, snap back
    setTimeout(() => (swipe.offset.value = 0), 0)
  }
})

const tagsStore = useTagsStore()

const tags = computed(() => [...(props.profile.interests || []), ...(props.profile.hobbies || [])]
    .slice(0, 2)
    .map(slug => tagsStore.label(slug)))

const location = computed(() => {
  const {city, distanceKm} = props.profile
  if (distanceKm != null) return city ? `${city} · ${distanceKm} km` : `${distanceKm} km away`
  return city || ''
})

const dragStyle = computed(() => swipe.offset.value
    ? {transform: `translateX(${swipe.offset.value}px) rotate(${swipe.offset.value / 14}deg)`}
    : {})
</script>

<template>
  <div
      class="profile-tile"
      :class="{selected, dragging: swipe.dragging.value}"
      :style="dragStyle"
      :data-ref="profile.referenceId"
      tabindex="0"
      role="button"
      :aria-pressed="selected"
      :aria-label="`${profile.name}, ${profile.age}`"
      @focus="emit('select', profile)"
      v-on="swipe.listeners"
  >
    <span class="swipe-stamp like" :style="{opacity: Math.max(0, swipe.progress())}" aria-hidden="true">Like</span>
    <span class="swipe-stamp pass" :style="{opacity: Math.max(0, -swipe.progress())}" aria-hidden="true">Pass</span>

    <img :src="profile.photo || defaultAvatar" :alt="profile.name" class="tile-avatar" draggable="false"/>
    <h3 class="tile-name">{{ profile.name }}, {{ profile.age }}</h3>
    <p class="tile-location" v-if="location">{{ location }}</p>
    <div class="tile-tags" v-if="tags.length">
      <span v-for="tag in tags" :key="tag" class="tile-tag">{{ tag }}</span>
    </div>
  </div>
</template>

<style scoped>
.profile-tile {
  position: relative;
  width: 100%;
  max-width: 320px;
  padding: 24px 16px 20px;
  text-align: center;
  background: linear-gradient(145deg, #34495e, #2c3e50);
  border: 2px solid #34495e;
  border-radius: 16px;
  cursor: grab;
  user-select: none;
  touch-action: pan-y;
  outline: none;
  transition: border-color .2s ease, transform .35s cubic-bezier(.34, 1.56, .64, 1);
}

.profile-tile:hover,
.profile-tile:focus-visible {
  border-color: rgba(255, 167, 38, .5);
}

.profile-tile.selected {
  border-color: #ffa726;
}

.profile-tile.dragging {
  cursor: grabbing;
  transition: border-color .2s ease;
}

.tile-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, .1);
  pointer-events: none;
}

.profile-tile.selected .tile-avatar {
  border-color: #ffa726;
}

.tile-name {
  margin: 12px 0 2px;
  font-size: 20px;
  font-weight: 600;
  color: rgba(235, 235, 235, .9);
}

.tile-location {
  margin: 0 0 12px;
  font-size: 14px;
  color: rgba(235, 235, 235, .64);
}

.tile-tags {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
}

.tile-tag {
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #ffcc80;
  background: rgba(255, 167, 38, .12);
}

.swipe-stamp {
  position: absolute;
  top: 14px;
  padding: 2px 10px;
  border: 2px solid;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 700;
  pointer-events: none;
}

.swipe-stamp.like {
  right: 14px;
  color: #ff4d79;
  transform: rotate(12deg);
}

.swipe-stamp.pass {
  left: 14px;
  color: #b0bec5;
  transform: rotate(-12deg);
}
</style>
