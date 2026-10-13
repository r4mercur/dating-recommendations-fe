<script setup>
import {computed, nextTick, ref, watch} from 'vue'
import {ReactionType} from '@/stores/reactions.js'
import ProfileDetails from '@/components/profile/ProfileDetails.vue'

const props = defineProps({
  /** card from the grid (ProfileCard), the sheet is open while set; the full profile is loaded on open */
  profile: {
    type: Object,
    default: null
  },
  /** reactions left today per type, as in the reaction bar */
  remaining: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'react'])

const closeButton = ref(null)
const profileDetails = ref(null)
/** the full profile once loaded, used for personal compliment suggestions */
const details = computed(() => profileDetails.value?.details ?? null)

const actions = [
  {type: ReactionType.PASS, label: 'Pass', icon: 'icon-times'},
  {type: ReactionType.COMPLIMENT, label: 'Compliment', icon: 'icon-comment'},
  {type: ReactionType.SUPER_LIKE, label: 'Super like', icon: 'icon-star-fill'},
  {type: ReactionType.LIKE, label: 'Like', icon: 'icon-heart-fill'},
]

watch(() => props.profile?.referenceId, async (referenceId) => {
  if (!referenceId) return
  await nextTick()
  closeButton.value?.focus({preventScroll: true})
})

defineExpose({details})
</script>

<template>
  <Teleport to="body">
    <Transition name="detail">
      <div v-if="profile" class="detail-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
        <article class="detail" role="dialog" aria-modal="true" aria-labelledby="detail-name">
          <button ref="closeButton" type="button" class="close" aria-label="Close profile" @click="emit('close')">
            <i class="icon icon-times" aria-hidden="true"></i>
          </button>

          <div class="scroll">
            <ProfileDetails ref="profileDetails" :profile="profile" headingId="detail-name"/>
          </div>

          <footer class="actions">
            <button v-for="action in actions" :key="action.type" type="button" class="action"
                    :class="action.type.toLowerCase()" @click="emit('react', action.type)">
              <i :class="['icon', action.icon]" aria-hidden="true"></i>
              <span class="label">{{ action.label }}</span>
              <span v-if="Number.isFinite(remaining[action.type])" class="count">{{ remaining[action.type] }}</span>
            </button>
          </footer>
        </article>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.detail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: flex;
  justify-content: flex-end;
  background: rgba(0, 0, 0, .5);
}

.detail {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px;
  height: 100%;
  color: #ececec;
  background: #2c3e50;
  box-shadow: -8px 0 24px rgba(0, 0, 0, .35);
}

.scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  /* scrolls as usual, only the scrollbar is hidden */
  scrollbar-width: none;
}

.scroll::-webkit-scrollbar {
  display: none;
}

.close {
  position: absolute;
  z-index: 1;
  top: 14px;
  right: 14px;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  color: #fff;
  background: rgba(20, 28, 38, .7);
  cursor: pointer;
}

.close:focus-visible {
  outline: 2px solid #ffa726;
}

.actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #34495e;
  background: #22313f;
}

.action {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 44px;
  border: none;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.action:hover {
  filter: brightness(1.15);
}

.pass { background: #3d566e; color: #ef9a9a; }
.compliment { background: #0f6e56; color: #e1f5ee; }
.super_like { background: #185fa5; color: #e6f1fb; }
.like { background: #ff4d79; color: #fff; }

.count {
  padding: 0 7px;
  border-radius: 10px;
  font-size: 12px;
  color: #0c447c;
  background: #e6f1fb;
}

.detail-enter-active,
.detail-leave-active {
  transition: background-color .25s ease;
}

.detail-enter-active .detail {
  transition: transform .35s cubic-bezier(.2, .9, .3, 1);
}

.detail-leave-active .detail {
  transition: transform .25s ease-in;
}

.detail-enter-from,
.detail-leave-to {
  background-color: transparent;
}

.detail-enter-from .detail,
.detail-leave-to .detail {
  transform: translateX(100%);
}

@media (max-width: 640px) {
  .detail {
    max-width: none;
  }

  .label {
    display: none;
  }

  .count {
    position: absolute;
    top: -4px;
    right: 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .detail-enter-active .detail,
  .detail-leave-active .detail {
    transition: none;
  }
}
</style>
