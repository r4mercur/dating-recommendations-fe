<script setup>
import {computed, nextTick, ref, watch} from 'vue'
import defaultAvatar from '@/assets/avatar.jpg'
import {COMPLIMENT_MAX_LENGTH} from '@/stores/reactions.js'
import {useTagsStore} from '@/stores/tags.js'

const props = defineProps({
  /** profile the compliment is for, the sheet is open while set */
  profile: {
    type: Object,
    default: null
  },
  /** full profile (GET /api/user) when already loaded: suggestions then use songs, games and what you share */
  details: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['send', 'cancel'])

const tagsStore = useTagsStore()
const message = ref('')
const error = ref(null)
const textarea = ref(null)

/** up to three suggestions, the most personal first: shared artists and games, the profile song, tags */
const suggestions = computed(() => {
  if (!props.profile) return []
  const profile = {...props.profile, ...(props.details ?? {})}
  const common = profile.common ?? {}
  const sharedGame = (common.games ?? [])
      .map(id => (profile.games ?? []).find(game => game.igdbId === id))
      .find(Boolean)
  const anthem = profile.anthem ?? (profile.songs ?? []).find(song => song.anthem)
  const tags = [...(common.interests ?? []), ...(common.hobbies ?? []),
    ...(profile.interests || []), ...(profile.hobbies || [])]
  const [first, second] = [...new Set(tags)].map(slug => tagsStore.label(slug))

  return [
    common.artists?.[0] && `You listen to ${common.artists[0]} too? Which song should I hear first?`,
    sharedGame && `Up for a round of ${sharedGame.name} sometime?`,
    anthem && `${anthem.name} as your profile song? Great taste`,
    first && `You're into ${first} too? Tell me more`,
    second && `${second} this weekend?`,
    'Your smile is contagious',
  ].filter(Boolean).slice(0, 3)
})

watch(() => props.profile, async (profile) => {
  if (!profile) return
  message.value = ''
  error.value = null
  await nextTick()
  textarea.value?.focus()
})

watch(message, () => (error.value = null))

function send() {
  const text = message.value.trim()
  if (!text) {
    error.value = 'Write a compliment first'
    return
  }
  emit('send', text)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="profile" class="sheet-backdrop" @click.self="emit('cancel')" @keydown.esc="emit('cancel')">
        <form class="sheet" role="dialog" aria-modal="true" aria-labelledby="compliment-title" @submit.prevent="send">
          <div class="sheet-head">
            <img :src="profile.photo || defaultAvatar" :alt="profile.name" class="sheet-avatar"/>
            <div>
              <h3 id="compliment-title">Compliment for {{ profile.name }}</h3>
              <p>Shows up first in their received likes</p>
            </div>
          </div>

          <div class="chips">
            <button v-for="text in suggestions" :key="text" type="button" class="chip" @click="message = text">
              {{ text }}
            </button>
          </div>

          <textarea
              ref="textarea"
              v-model="message"
              :maxlength="COMPLIMENT_MAX_LENGTH"
              rows="3"
              placeholder="What caught your eye?"
              @keydown.ctrl.enter="send"
              @keydown.meta.enter="send"
          ></textarea>

          <div class="sheet-foot">
            <span class="counter" :class="{near: message.length > COMPLIMENT_MAX_LENGTH - 20}">
              {{ message.length }}/{{ COMPLIMENT_MAX_LENGTH }}
            </span>
            <span class="error" role="alert">{{ error }}</span>
            <button type="button" class="btn-ghost" @click="emit('cancel')">Cancel</button>
            <button type="submit" class="btn-send"><i class="pi pi-send" aria-hidden="true"></i> Send</button>
          </div>
        </form>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, .5);
}

.sheet {
  width: 100%;
  max-width: 560px;
  padding: 20px;
  color: #e1f5ee;
  background: #173b36;
  border-top: 3px solid #5dcaa5;
  border-radius: 20px 20px 0 0;
}

.sheet-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.sheet-head h3 {
  margin: 0;
  font-size: 18px;
}

.sheet-head p {
  margin: 0;
  font-size: 13px;
  color: #9fe1cb;
}

.sheet-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #5dcaa5;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.chip {
  padding: 6px 12px;
  border: none;
  border-radius: 16px;
  font-size: 13px;
  color: #e1f5ee;
  background: #0f6e56;
  cursor: pointer;
}

.chip:hover {
  background: #1d9e75;
}

textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #0f6e56;
  border-radius: 12px;
  font: inherit;
  font-size: 15px;
  color: #e1f5ee;
  background: #0e2b27;
  resize: none;
}

textarea:focus {
  outline: 2px solid #5dcaa5;
  outline-offset: 0;
}

.sheet-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.counter {
  font-size: 12px;
  color: #9fe1cb;
}

.counter.near {
  color: #fac775;
}

.error {
  flex: 1;
  font-size: 13px;
  color: #f7c1c1;
}

.btn-ghost,
.btn-send {
  height: 40px;
  padding: 0 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-ghost {
  color: #e1f5ee;
  background: transparent;
  border: 1px solid #5dcaa5;
}

.btn-send {
  color: #fff;
  background: #1d9e75;
  border: none;
}

.sheet-enter-active,
.sheet-leave-active {
  transition: background-color .25s ease;
}

.sheet-enter-active .sheet {
  transition: transform .38s cubic-bezier(.34, 1.56, .64, 1);
}

.sheet-leave-active .sheet {
  transition: transform .25s ease-in;
}

.sheet-enter-from,
.sheet-leave-to {
  background-color: transparent;
}

.sheet-enter-from .sheet,
.sheet-leave-to .sheet {
  transform: translateY(100%);
}

@media (prefers-reduced-motion: reduce) {
  .sheet-enter-active .sheet,
  .sheet-leave-active .sheet {
    transition: none;
  }
}
</style>
