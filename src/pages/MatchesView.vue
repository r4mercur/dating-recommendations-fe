<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useToast} from 'primevue/usetoast'
import ProfileTile from '@/components/ProfileTile.vue'
import ReactionBar from '@/components/ReactionBar.vue'
import ComplimentSheet from '@/components/modal/ComplimentSheet.vue'
import ProfileDetailSheet from '@/components/modal/ProfileDetailSheet.vue'
import {useRecommendationsStore} from '@/stores/recommendation.js'
import {ReactionType, useReactionsStore} from '@/stores/reactions.js'
import {useTagsStore} from '@/stores/tags.js'
import {burst, centerOf, EASE_IN, prefersReducedMotion, shockwave, sleep, SPRING} from '@/utils/motion.js'

const recommendationsStore = useRecommendationsStore()
const reactionsStore = useReactionsStore()
const tagsStore = useTagsStore()
const toast = useToast()

const gridWrapper = ref(null)
const sentinel = ref(null)
const bar = ref(null)
const selectedId = ref(null)
const complimentFor = ref(null)
/** full profile of complimentFor, when the compliment was started from the profile view */
const complimentDetails = ref(null)
const detailFor = ref(null)
const detailSheet = ref(null)
const busy = ref(false)

/** how each removed tile leaves the grid, read by the leave transition */
const exits = new Map()

const EXIT = {
  [ReactionType.PASS]: {duration: 380, keyframes: from => [{transform: from, opacity: 1}, {transform: 'translateX(-150%) rotate(-18deg)', opacity: 0}]},
  [ReactionType.LIKE]: {duration: 420, keyframes: from => [{transform: from, opacity: 1}, {transform: 'translateX(150%) rotate(18deg)', opacity: 0}]},
  [ReactionType.SUPER_LIKE]: {
    duration: 600, keyframes: from => [
      {transform: from, opacity: 1},
      {transform: 'translateY(-14px) scale(1.05)', opacity: 1, offset: .3},
      {transform: 'translateY(-140%) scale(.9)', opacity: 0},
    ]
  },
  [ReactionType.COMPLIMENT]: {duration: 450, keyframes: from => [{transform: from, opacity: 1}, {transform: 'translateY(-120%)', opacity: 0}]},
}

const profiles = computed(() => recommendationsStore.items)
const selected = computed(() => profiles.value.find(profile => profile.referenceId === selectedId.value) ?? null)
/** reactions left today for types with a daily limit */
const remaining = computed(() => Object.fromEntries(Object.values(ReactionType)
    .map(type => [type, reactionsStore.remaining(type)])
    .filter(([, count]) => Number.isFinite(count))))

const LIMIT_REACHED = {
  [ReactionType.SUPER_LIKE]: 'No super likes left today',
  [ReactionType.COMPLIMENT]: 'No compliments left today',
}
const initialLoading = computed(() => !recommendationsStore.loaded && recommendationsStore.loading)

function tileElement(referenceId) {
  return gridWrapper.value?.querySelector(`[data-ref="${CSS.escape(referenceId)}"]`)
}

function select(profile) {
  selectedId.value = profile?.referenceId ?? null
}

/** Entry point for the bar, swipes and keyboard. */
function react(type, {swiped = false} = {}) {
  const profile = selected.value
  if (!profile) {
    bar.value?.refuse('Select a profile first')
    return
  }
  if (busy.value) return
  if (reactionsStore.remaining(type) <= 0) {
    bar.value?.refuse(LIMIT_REACHED[type] ?? 'No reactions of this type left today', type)
    return
  }
  if (type === ReactionType.COMPLIMENT) {
    complimentFor.value = profile
    return
  }
  send(profile, type, null, swiped)
}

function onSwipe(profile, direction) {
  select(profile)
  react(direction === 'right' ? ReactionType.LIKE : ReactionType.PASS, {swiped: true})
}

/** Opens the full profile of the given or the selected tile. */
function openProfile(profile = selected.value) {
  if (!profile) {
    bar.value?.refuse('Select a profile first')
    return
  }
  select(profile)
  detailFor.value = profile
}

/** A reaction from the profile view: close it first, so the tile visibly leaves the grid. */
async function reactFromDetail(type) {
  const profile = detailFor.value
  const details = detailSheet.value?.details ?? null
  detailFor.value = null
  select(profile)
  await sleep(prefersReducedMotion() ? 0 : 260)
  if (type === ReactionType.COMPLIMENT && reactionsStore.remaining(type) > 0) {
    complimentDetails.value = details
  }
  react(type)
}

function closeCompliment() {
  complimentFor.value = null
  complimentDetails.value = null
}

function sendCompliment(message) {
  const profile = complimentFor.value
  closeCompliment()
  send(profile, ReactionType.COMPLIMENT, message, false)
}

/**
 * Optimistic: the request starts right away while the tile animates out. A failed request puts the
 * profile back, a match is celebrated once the tile is gone.
 */
async function send(profile, type, message, swiped) {
  busy.value = true
  const index = profiles.value.indexOf(profile)
  const request = reactionsStore.react(profile.referenceId, type, message)
  request.catch(() => {}) // handled below, after the animation

  const tile = tileElement(profile.referenceId)
  const hadFocus = tile && document.activeElement === tile
  bar.value?.celebrate(type)
  await playIntro(type, tile, {swiped, message})

  exits.set(profile.referenceId, {type, swiped})
  recommendationsStore.remove(profile.referenceId)
  select(profiles.value[Math.min(index, profiles.value.length - 1)])
  busy.value = false
  if (hadFocus) {
    await nextTick()
    tileElement(selectedId.value)?.focus({preventScroll: true})
  }

  try {
    const [{match}] = await Promise.all([request, sleep(swiped ? 300 : EXIT[type].duration)])
    if (match) reactionsStore.celebrate(match)
  } catch (error) {
    handleReactionError(error, profile, index, type)
  }
}

function handleReactionError(error, profile, index, type) {
  if (error.status === 409 || error.status === 404) {
    // already reacted elsewhere, or the profile is gone (inactive, blocked): keep it out of the grid
    toast.add({severity: 'info', summary: `${profile.name} is no longer available`, life: 3000})
    return
  }
  recommendationsStore.restore(profile, index)
  if (error.status === 429) {
    bar.value?.refuse(LIMIT_REACHED[type] ?? error.message, type)
    reactionsStore.loadTypes()
    return
  }
  toast.add({severity: 'error', summary: "Couldn't send your reaction", detail: error.message, life: 4000})
}

/** Effects on the tile before it leaves. Swipes skip the waiting, the user already "threw" the tile. */
async function playIntro(type, tile, {swiped, message}) {
  if (!tile || prefersReducedMotion()) return
  const avatar = tile.querySelector('.tile-avatar') ?? tile

  if (type === ReactionType.LIKE) {
    tile.classList.add('flash-like')
    burst(centerOf(avatar), {icon: 'pi-heart-fill', color: '#ff4d79'})
    if (!swiped) await sleep(280)
  } else if (type === ReactionType.SUPER_LIKE) {
    tile.classList.add('flash-super')
    shockwave(centerOf(tile))
    setTimeout(() => burst(centerOf(tile), {icon: 'pi-star-fill', color: '#ffd54f', count: 14, distance: 110, size: 18}), 120)
    await sleep(550)
  } else if (type === ReactionType.COMPLIMENT) {
    tile.classList.add('flash-compliment')
    await sleep(250) // let the sheet slide away first
    await flyBubble(message, avatar)
    avatar.animate([{transform: 'scale(1)'}, {transform: 'scale(1.12)'}, {transform: 'scale(1)'}], {duration: 350, easing: SPRING})
    burst(centerOf(avatar), {icon: 'pi-sparkles', color: '#9fe1cb', count: 8, distance: 60})
    await sleep(300)
  }
}

/** Speech bubble flying from the bottom (where the sheet was) to the avatar. */
async function flyBubble(text, target) {
  const bubble = document.createElement('div')
  bubble.textContent = text.length > 28 ? `${text.slice(0, 28)}…` : text
  Object.assign(bubble.style, {
    position: 'fixed', left: '0', top: '0', zIndex: '1100', pointerEvents: 'none', whiteSpace: 'nowrap',
    padding: '6px 12px', borderRadius: '14px 14px 14px 2px', fontSize: '13px', fontWeight: '600',
    color: '#04342c', background: '#9fe1cb',
  })
  document.body.appendChild(bubble)
  const half = bubble.offsetWidth / 2
  const startX = window.innerWidth / 2 - half
  const startY = window.innerHeight - 60
  const end = centerOf(target)

  await bubble.animate([
    {transform: `translate(${startX}px, ${startY}px) scale(.6)`, opacity: 0},
    {transform: `translate(${startX}px, ${startY - 80}px) scale(1)`, opacity: 1, offset: .3},
    {transform: `translate(${end.x - half}px, ${end.y - 70}px) scale(.9)`, opacity: 1},
  ], {duration: 800, easing: 'cubic-bezier(.45, 0, .25, 1)', fill: 'forwards'}).finished

  bubble.textContent = 'Sent'
  bubble.animate([{opacity: 1}, {opacity: 0}], {duration: 300, delay: 300, fill: 'forwards'})
      .finished.then(() => bubble.remove())
}

/* leave transition: take the tile out of the grid flow so the others move up, then animate it out */
function onBeforeLeave(element) {
  const {offsetLeft, offsetTop, offsetWidth, offsetHeight} = element
  Object.assign(element.style, {
    position: 'absolute', left: `${offsetLeft}px`, top: `${offsetTop}px`,
    width: `${offsetWidth}px`, height: `${offsetHeight}px`, margin: '0', pointerEvents: 'none',
  })
}

function onLeave(element, done) {
  const {type, swiped} = exits.get(element.dataset.ref) ?? {type: ReactionType.PASS, swiped: false}
  exits.delete(element.dataset.ref)
  const reduced = prefersReducedMotion()
  const exit = EXIT[type]
  element.animate(
      reduced ? [{opacity: 1}, {opacity: 0}] : exit.keyframes(element.style.transform || 'none'),
      {duration: reduced ? 150 : (swiped ? 300 : exit.duration), easing: EASE_IN, fill: 'forwards'}
  ).finished.then(done)
}

function onKeydown(event) {
  if (!selected.value || complimentFor.value || detailFor.value || reactionsStore.celebratedMatch) return
  if (event.altKey || event.ctrlKey || event.metaKey) return
  if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return
  const type = {
    ArrowLeft: ReactionType.PASS,
    ArrowRight: ReactionType.LIKE,
    ArrowUp: ReactionType.SUPER_LIKE,
    k: ReactionType.COMPLIMENT,
    K: ReactionType.COMPLIMENT,
  }[event.key]
  if (!type) return
  event.preventDefault()
  react(type)
}

// loads the next page shortly before the end of the grid is reached
const observer = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting)) recommendationsStore.loadMore()
}, {rootMargin: '400px'})

watch(sentinel, (element, previous) => {
  if (previous) observer.unobserve(previous)
  if (element) observer.observe(element)
})

onMounted(() => {
  if (!recommendationsStore.loaded) {
    recommendationsStore.load()
  }
  reactionsStore.loadTypes()
  tagsStore.load()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  observer.disconnect()
})
</script>

<template>
  <div class="matches-container">
    <div v-if="initialLoading" class="loading-container">
      <div class="loading-spinner">
        <i class="pi pi-spin pi-spinner"></i>
      </div>
      <p>Loading your recommendations...</p>
    </div>

    <template v-else>
      <div class="matches-header">
        <h1>Discover</h1>
        <p class="matches-subtitle">Swipe right to like, left to pass. Tap a selected profile to see more.</p>
      </div>

      <div v-if="profiles.length === 0" class="no-matches">
        <div class="no-matches-icon">
          <i class="pi pi-heart"></i>
        </div>
        <h3>No more profiles right now</h3>
        <p>Expand your search criteria or come back later.</p>
        <button class="reload-btn" @click="recommendationsStore.load()">Reload</button>
      </div>

      <div v-else ref="gridWrapper">
        <TransitionGroup
            tag="div"
            name="tile"
            class="matches-grid"
            @before-leave="onBeforeLeave"
            @leave="onLeave"
        >
          <ProfileTile
              v-for="profile in profiles"
              :key="profile.referenceId"
              :profile="profile"
              :selected="profile.referenceId === selectedId"
              @select="select"
              @open="openProfile"
              @swipe="direction => onSwipe(profile, direction)"
          />
        </TransitionGroup>
      </div>
      <div ref="sentinel" aria-hidden="true"></div>

      <ReactionBar
          v-if="profiles.length"
          ref="bar"
          :selected-name="selected?.name ?? null"
          :remaining="remaining"
          @react="react"
          @open="openProfile()"
      />
    </template>

    <ComplimentSheet :profile="complimentFor" :details="complimentDetails" @send="sendCompliment"
                     @cancel="closeCompliment"/>
    <ProfileDetailSheet ref="detailSheet" :profile="detailFor" :remaining="remaining"
                        @react="reactFromDetail" @close="detailFor = null"/>
  </div>
</template>

<style scoped>
.matches-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px;
  min-height: calc(100vh - 60px);
  overflow-x: clip;
}

.matches-header {
  text-align: center;
  margin-bottom: 32px;
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
  margin: 0 0 20px;
}

.reload-btn {
  height: 40px;
  padding: 0 20px;
  border: 1px solid #ffa726;
  border-radius: 20px;
  color: #ffa726;
  background: transparent;
  cursor: pointer;
}

.matches-grid {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 24px;
  justify-items: center;
}

.matches-grid .tile-move {
  transition: transform .42s cubic-bezier(.34, 1.56, .64, 1);
}

.matches-grid .tile-enter-active {
  transition: opacity .3s ease .15s, transform .42s cubic-bezier(.34, 1.56, .64, 1) .15s;
}

.matches-grid .tile-enter-from {
  opacity: 0;
  transform: scale(.85);
}

.flash-like {
  border-color: #ff4d79 !important;
}

.flash-super {
  border-color: #64b5f6 !important;
  animation: super-flash .7s ease;
}

.flash-compliment {
  border-color: #5dcaa5 !important;
}

@keyframes super-flash {
  50% {
    background: #2f5f8a;
  }
}

@media (prefers-reduced-motion: reduce) {
  .matches-grid .tile-move,
  .matches-grid .tile-enter-active {
    transition: none;
  }
}

@media (max-width: 768px) {
  .matches-container {
    padding: 20px;
  }

  .matches-header h1 {
    font-size: 28px;
  }

  .matches-grid {
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
