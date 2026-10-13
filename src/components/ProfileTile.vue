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

const emit = defineEmits(['select', 'swipe', 'open'])

/** a tap selects the tile, a tap on the already selected tile opens the profile */
let wasSelected = false

const swipe = useSwipe({
  onTap: () => emit(wasSelected ? 'open' : 'select', props.profile),
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

const listeners = {
  ...swipe.listeners,
  pointerdown: (event) => {
    // read before the focus of this press selects the tile
    wasSelected = props.selected
    swipe.listeners.pointerdown(event)
  },
}

const commonLabel = computed(() => {
  const count = props.profile.commonCount
  return count ? `${count} in common` : null
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
      :aria-label="`${profile.name}, ${profile.age}. Press Enter to open the profile`"
      @focus="emit('select', profile)"
      @keydown.enter.self.prevent="emit('open', profile)"
      v-on="listeners"
  >
    <span class="swipe-stamp like" :style="{opacity: Math.max(0, swipe.progress())}" aria-hidden="true">Like</span>
    <span class="swipe-stamp pass" :style="{opacity: Math.max(0, -swipe.progress())}" aria-hidden="true">Pass</span>

    <span class="avatar-wrap">
      <img :src="profile.photo || defaultAvatar" :alt="profile.name" class="tile-avatar" draggable="false"/>
      <span v-if="profile.online" class="online-dot" title="Online"></span>
    </span>
    <h3 class="tile-name">{{ profile.name }}, {{ profile.age }}</h3>
    <p class="tile-location" v-if="location">{{ location }}</p>
    <p v-if="commonLabel" class="tile-common"><i class="icon icon-sparkles" aria-hidden="true"></i>{{ commonLabel }}</p>
    <div class="tile-tags" v-if="tags.length">
      <span v-for="tag in tags" :key="tag" class="tile-tag">{{ tag }}</span>
    </div>
    <p v-if="profile.anthem" class="tile-anthem">
      <i class="icon icon-headphones" aria-hidden="true"></i>
      <span>{{ profile.anthem.name }} · {{ profile.anthem.artists.join(', ') }}</span>
    </p>
  </div>
</template>

<style scoped>
.profile-tile {
  position: relative;
  width: 100%;
  min-width: 0;
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

.avatar-wrap {
  position: relative;
  display: inline-block;
}

.online-dot {
  position: absolute;
  right: 8px;
  bottom: 8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #66bb6a;
  border: 3px solid #2c3e50;
}

.tile-common {
  display: inline-flex;
  margin: 0 0 10px;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  color: #412402;
  background: #ffa726;
}

.tile-anthem {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 12px 0 0;
  font-size: 12px;
  color: #9fe1cb;
}

.tile-anthem span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
