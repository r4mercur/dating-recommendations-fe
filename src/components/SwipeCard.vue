<script setup>
import {computed, ref} from 'vue'
import {useSwipe} from '@/composables/useSwipe.js'
import ProfileDetails from '@/components/profile/ProfileDetails.vue'

/**
 * One profile of the card stack: the full profile, scrollable, swiped left (pass) or right (like).
 * Only the card on top reacts; the one behind is a preview.
 */
const props = defineProps({
  profile: {
    type: Object,
    required: true
  },
  /** on top of the stack: swipeable, plays music */
  active: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['swipe'])

const profileDetails = ref(null)

const swipe = useSwipe({
  enabled: () => props.active,
  // buttons (songs), links and the Spotify player keep working inside the card
  ignore: 'button, a, input, textarea, select, iframe',
  threshold: 110,
  onSwipe: (direction) => {
    emit('swipe', direction)
    // the parent removes the card and animates it out from here; if it doesn't, snap back
    setTimeout(() => (swipe.offset.value = 0), 0)
  }
})

const dragStyle = computed(() => swipe.offset.value
    ? {transform: `translateX(${swipe.offset.value}px) rotate(${swipe.offset.value / 18}deg)`}
    : {})

defineExpose({details: computed(() => profileDetails.value?.details ?? null)})
</script>

<template>
  <article
      class="swipe-card"
      :class="{active, behind: !active, dragging: swipe.dragging.value}"
      :style="dragStyle"
      :data-ref="profile.referenceId"
      :aria-hidden="!active"
      :inert="!active || undefined"
      aria-roledescription="profile card"
      :aria-label="`${profile.name}, ${profile.age}`"
      v-on="swipe.listeners"
  >
    <span class="swipe-stamp like" :style="{opacity: Math.max(0, swipe.progress())}" aria-hidden="true">Like</span>
    <span class="swipe-stamp pass" :style="{opacity: Math.max(0, -swipe.progress())}" aria-hidden="true">Pass</span>

    <div class="card-scroll">
      <ProfileDetails ref="profileDetails" :profile="profile" :showPlayer="active"/>
    </div>
  </article>
</template>

<style scoped>
.swipe-card {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 2px solid #34495e;
  border-radius: 20px;
  background: #2c3e50;
  box-shadow: 0 12px 32px rgba(0, 0, 0, .35);
  cursor: grab;
  touch-action: pan-y;
  user-select: none;
  transition: transform .35s cubic-bezier(.34, 1.56, .64, 1), opacity .3s ease, border-color .2s ease;
  --hero-height: 420px;
  --hero-height-mobile: 360px;
}

.swipe-card.behind {
  transform: translateY(18px) scale(.95);
  opacity: .6;
  cursor: default;
  pointer-events: none;
}

.swipe-card.dragging {
  cursor: grabbing;
  transition: border-color .2s ease;
}

.card-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  /* scrolls as usual, only the scrollbar is hidden */
  scrollbar-width: none;
}

.card-scroll::-webkit-scrollbar {
  display: none;
}

.swipe-stamp {
  position: absolute;
  top: 24px;
  z-index: 2;
  padding: 4px 14px;
  border: 3px solid;
  border-radius: 8px;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 1px;
  pointer-events: none;
  background: rgba(20, 28, 38, .35);
}

.swipe-stamp.like {
  left: 24px;
  color: #ff4d79;
  transform: rotate(-14deg);
}

.swipe-stamp.pass {
  right: 24px;
  color: #cfd8dc;
  transform: rotate(14deg);
}

@media (prefers-reduced-motion: reduce) {
  .swipe-card {
    transition: none;
  }
}
</style>
