<script setup>
import {computed, nextTick, ref, watch} from 'vue'
import {useRouter} from 'vue-router'
import defaultAvatar from '@/assets/avatar.jpg'
import {useReactionsStore} from '@/stores/reactions.js'
import {useUserStore} from '@/stores/user.js'
import {burst, centerOf, confetti, prefersReducedMotion} from '@/utils/motion.js'

const reactionsStore = useReactionsStore()
const userStore = useUserStore()
const router = useRouter()

const heart = ref(null)
const primaryButton = ref(null)
const match = computed(() => reactionsStore.celebratedMatch)
const title = "It's a match"

/** what the other person sent, e.g. a super like or a compliment */
const theirReaction = computed(() => match.value?.theirReaction ?? null)
const subtitle = computed(() => {
  const name = match.value?.user.name
  if (theirReaction.value?.type === 'SUPER_LIKE') return `${name} super liked you`
  if (theirReaction.value?.type === 'COMPLIMENT') return `${name} sent you a compliment`
  return `You and ${name} like each other`
})

watch(match, async (value) => {
  if (!value) return
  await nextTick()
  primaryButton.value?.focus({preventScroll: true})
  if (prefersReducedMotion()) return
  setTimeout(() => {
    if (!heart.value) return
    burst(centerOf(heart.value), {count: 12, distance: 90, size: 18})
    confetti()
  }, 520)
})

function writeMessage() {
  reactionsStore.dismissMatch()
  router.push('/messages')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="match">
      <div v-if="match" class="match-overlay" role="dialog" aria-modal="true" aria-labelledby="match-title"
           @keydown.esc="reactionsStore.dismissMatch()">
        <div class="pair">
          <img :src="userStore.avatar || defaultAvatar" alt="You" class="avatar me"/>
          <i ref="heart" class="pi pi-heart-fill heart" aria-hidden="true"></i>
          <img :src="match.user.photo || defaultAvatar" :alt="match.user.name" class="avatar them"/>
        </div>

        <h2 id="match-title" class="title" :aria-label="title">
          <span v-for="(char, i) in title" :key="i" :style="{animationDelay: `${650 + i * 35}ms`}">{{ char }}</span>
        </h2>
        <p class="subtitle">{{ subtitle }}</p>
        <blockquote v-if="theirReaction?.message" class="their-message">“{{ theirReaction.message }}”</blockquote>

        <div class="actions">
          <button ref="primaryButton" class="btn-primary" @click="writeMessage">Send a message</button>
          <button class="btn-ghost" @click="reactionsStore.dismissMatch()">Keep exploring</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.match-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #fff;
  text-align: center;
  background: rgba(20, 28, 38, .94);
}

.pair {
  display: flex;
  align-items: center;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #ffa726;
}

.avatar.me {
  border-color: #64b5f6;
  animation: slide-in-left .6s cubic-bezier(.3, 1.3, .6, 1) both;
}

.avatar.them {
  animation: slide-in-right .6s cubic-bezier(.3, 1.3, .6, 1) both;
}

.heart {
  z-index: 1;
  margin: 0 -10px;
  font-size: 44px;
  color: #ff4d79;
  animation: heart-pop .5s .48s cubic-bezier(.34, 1.56, .64, 1) both,
  heart-beat .9s 1.2s ease-in-out infinite;
}

.title {
  margin: 24px 0 6px;
  font-size: 34px;
  font-weight: 700;
}

.title span {
  display: inline-block;
  white-space: pre;
  animation: letter-in .4s cubic-bezier(.34, 1.56, .64, 1) both;
}

.subtitle {
  margin: 0;
  color: #cfd8dc;
  animation: fade-up .35s 1.3s both;
}

.their-message {
  max-width: 420px;
  margin: 14px 0 0;
  padding: 10px 16px;
  border-radius: 16px 16px 16px 4px;
  font-size: 15px;
  color: #04342c;
  background: #9fe1cb;
  animation: fade-up .35s 1.4s both;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 28px;
  animation: fade-up .35s 1.45s cubic-bezier(.34, 1.56, .64, 1) both;
}

.btn-primary,
.btn-ghost {
  height: 46px;
  padding: 0 22px;
  border-radius: 23px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  color: #fff;
  background: #ff4d79;
  border: none;
}

.btn-ghost {
  color: #fff;
  background: transparent;
  border: 1px solid #fff;
}

.match-enter-active,
.match-leave-active {
  transition: opacity .25s ease;
}

.match-enter-from,
.match-leave-to {
  opacity: 0;
}

@keyframes slide-in-left {
  from { transform: translateX(-60vw) rotate(-20deg); }
  80% { transform: translateX(8px) rotate(4deg); }
  to { transform: none; }
}

@keyframes slide-in-right {
  from { transform: translateX(60vw) rotate(20deg); }
  80% { transform: translateX(-8px) rotate(-4deg); }
  to { transform: none; }
}

@keyframes heart-pop {
  from { opacity: 0; transform: scale(0); }
  60% { opacity: 1; transform: scale(1.6); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes heart-beat {
  50% { transform: scale(1.18); }
}

@keyframes letter-in {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: none; }
}

@keyframes fade-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .avatar.me, .avatar.them, .heart, .title span, .subtitle, .their-message, .actions {
    animation: none;
  }
}
</style>
