<script setup>
import {computed, ref} from 'vue'
import {ReactionType} from '@/stores/reactions.js'
import {pop, shake} from '@/utils/motion.js'

const props = defineProps({
  /** name of the selected profile, null if nothing is selected */
  selectedName: {
    type: String,
    default: null
  },
  /** reactions left today per type, types without limit are missing */
  remaining: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['react', 'open'])

const root = ref(null)
const message = ref(null)

const hint = computed(() => message.value
    ?? (props.selectedName ? `Selected: ${props.selectedName}, tap again to view` : 'Tap or swipe a profile'))

const actions = [
  {type: ReactionType.PASS, label: 'Pass', icon: 'pi-times'},
  {type: ReactionType.COMPLIMENT, label: 'Compliment', icon: 'pi-comment'},
  {type: ReactionType.SUPER_LIKE, label: 'Super like', icon: 'pi-star-fill'},
  {type: ReactionType.LIKE, label: 'Like', icon: 'pi-heart-fill'},
]

function button(type) {
  return root.value?.querySelector(`[data-type="${type}"]`)
}

/** Shows a short hint and shakes the button (or the hint if no type is given). */
function refuse(text, type = null) {
  message.value = text
  shake(type ? button(type) : root.value?.querySelector('.reaction-hint'))
  setTimeout(() => (message.value = null), 2000)
}

function celebrate(type) {
  pop(button(type), {rotate: type === ReactionType.SUPER_LIKE})
}

defineExpose({refuse, celebrate, button})
</script>

<template>
  <div class="reaction-bar" ref="root">
    <span class="reaction-hint" :class="{warn: message}" aria-live="polite">{{ hint }}</span>
    <button class="reaction-btn view" data-type="VIEW" title="View profile" @click="emit('open')">
      <i class="pi pi-user" aria-hidden="true"></i>
      <span class="label">Profile</span>
    </button>
    <button
        v-for="action in actions"
        :key="action.type"
        :data-type="action.type"
        class="reaction-btn"
        :class="action.type.toLowerCase()"
        :title="action.label"
        @click="emit('react', action.type)"
    >
      <i :class="['pi', action.icon]" aria-hidden="true"></i>
      <span class="label">{{ action.label }}</span>
      <span v-if="Number.isFinite(remaining[action.type])" class="count">{{ remaining[action.type] }}</span>
    </button>
  </div>
</template>

<style scoped>
.reaction-bar {
  position: sticky;
  bottom: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 760px;
  margin: 24px auto 0;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(34, 49, 63, .96);
  border: 1px solid #34495e;
  box-shadow: 0 8px 24px rgba(0, 0, 0, .35);
}

.reaction-hint {
  flex: 1;
  min-width: 0;
  padding-left: 10px;
  font-size: 14px;
  color: #b0bec5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reaction-hint.warn {
  color: #f7c1c1;
}

.reaction-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 16px;
  border: none;
  border-radius: 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter .15s ease;
}

.reaction-btn:hover {
  filter: brightness(1.15);
}

.reaction-btn:focus-visible {
  outline: 2px solid #ffa726;
  outline-offset: 2px;
}

.view { background: transparent; color: #ffcc80; border: 1px solid #5f7a94; }
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

@media (max-width: 640px) {
  .reaction-bar {
    justify-content: space-between;
  }

  .reaction-hint,
  .label {
    display: none;
  }

  .reaction-btn {
    width: 52px;
    height: 52px;
    padding: 0;
    justify-content: center;
    border-radius: 50%;
    font-size: 20px;
    position: relative;
  }

  .count {
    position: absolute;
    top: -4px;
    right: -4px;
  }
}
</style>
