<script setup>
import {computed, nextTick, ref, watch} from 'vue'
import {apiFetch} from '@/api.js'
import defaultAvatar from '@/assets/avatar.jpg'
import {ReactionType} from '@/stores/reactions.js'
import {useTagsStore} from '@/stores/tags.js'
import SongList from '@/components/profile/SongList.vue'
import SpotifyEmbed from '@/components/profile/SpotifyEmbed.vue'
import GameGrid from '@/components/profile/GameGrid.vue'

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

const tagsStore = useTagsStore()
const details = ref(null)
const loading = ref(false)
const error = ref(null)
const playingTrackId = ref(null)
const closeButton = ref(null)

/** card data first, replaced field by field once the full profile is there */
const view = computed(() => props.profile ? {...props.profile, ...(details.value ?? {})} : null)
const songs = computed(() => view.value?.songs ?? [])
const games = computed(() => view.value?.games ?? [])
const common = computed(() => details.value?.common ?? {interests: [], hobbies: [], artists: [], games: []})

const commonItems = computed(() => [
  ...common.value.artists.map(artist => ({icon: 'icon-headphones', label: artist})),
  ...common.value.games
      .map(id => games.value.find(game => game.igdbId === id))
      .filter(Boolean)
      .map(game => ({icon: 'icon-th-large', label: game.name})),
  ...[...common.value.interests, ...common.value.hobbies].map(slug => ({icon: 'icon-tag', label: tagsStore.label(slug)})),
])

const shownTrackId = computed(() => {
  if (songs.value.some(song => song.spotifyTrackId === playingTrackId.value)) return playingTrackId.value
  return (songs.value.find(song => song.anthem) ?? songs.value[0])?.spotifyTrackId ?? null
})

const location = computed(() => {
  const {city, distanceKm} = view.value ?? {}
  return [city, distanceKm != null ? `${distanceKm} km away` : null].filter(Boolean).join(' · ')
})

const actions = [
  {type: ReactionType.PASS, label: 'Pass', icon: 'icon-times'},
  {type: ReactionType.COMPLIMENT, label: 'Compliment', icon: 'icon-comment'},
  {type: ReactionType.SUPER_LIKE, label: 'Super like', icon: 'icon-star-fill'},
  {type: ReactionType.LIKE, label: 'Like', icon: 'icon-heart-fill'},
]

function isCommonTag(slug) {
  return common.value.interests.includes(slug) || common.value.hobbies.includes(slug)
}

async function load(referenceId) {
  loading.value = true
  error.value = null
  try {
    const profile = await apiFetch(`/api/user?referenceId=${encodeURIComponent(referenceId)}`)
    if (props.profile?.referenceId === referenceId) details.value = profile
  } catch (e) {
    if (props.profile?.referenceId === referenceId) error.value = e.message
  } finally {
    loading.value = false
  }
}

watch(() => props.profile?.referenceId, async (referenceId) => {
  details.value = null
  playingTrackId.value = null
  if (!referenceId) return
  tagsStore.load()
  load(referenceId)
  await nextTick()
  closeButton.value?.focus({preventScroll: true})
})

defineExpose({details})
</script>

<template>
  <Teleport to="body">
    <Transition name="detail">
      <div v-if="view" class="detail-backdrop" @click.self="emit('close')" @keydown.esc="emit('close')">
        <article class="detail" role="dialog" aria-modal="true" aria-labelledby="detail-name">
          <header class="hero">
            <img :src="view.photo || defaultAvatar" :alt="view.name" class="hero-photo"/>
            <button ref="closeButton" type="button" class="close" aria-label="Close profile" @click="emit('close')">
              <i class="icon icon-times" aria-hidden="true"></i>
            </button>
            <div class="hero-text">
              <h2 id="detail-name">{{ view.name }}, {{ view.age }}</h2>
              <p>
                <span v-if="view.online" class="online"><span class="dot"></span>Online</span>
                {{ location }}
              </p>
            </div>
          </header>

          <div class="body">
            <section v-if="commonItems.length" class="block common">
              <h3><i class="icon icon-sparkles" aria-hidden="true"></i> You have this in common</h3>
              <div class="chips">
                <span v-for="item in commonItems" :key="item.icon + item.label" class="chip highlight">
                  <i :class="['icon', item.icon]" aria-hidden="true"></i>{{ item.label }}
                </span>
              </div>
            </section>

            <p v-if="error" class="error" role="alert">Couldn't load the full profile: {{ error }}</p>

            <section v-if="view.bio" class="block">
              <h3>About</h3>
              <p class="bio">{{ view.bio }}</p>
            </section>

            <section v-if="songs.length" class="block">
              <h3><i class="icon icon-headphones" aria-hidden="true"></i> Music</h3>
              <SpotifyEmbed v-if="shownTrackId" :trackId="shownTrackId" :title="`${view.name}'s song on Spotify`"/>
              <SongList :songs="songs" :commonArtists="common.artists" :activeTrackId="shownTrackId" playable
                        class="songs" @play="song => playingTrackId = song.spotifyTrackId"/>
            </section>

            <section v-if="games.length" class="block">
              <h3><i class="icon icon-th-large" aria-hidden="true"></i> Favorite games</h3>
              <GameGrid :games="games" :commonIds="common.games"/>
            </section>

            <section v-if="view.interests?.length || view.hobbies?.length" class="block">
              <h3><i class="icon icon-tags" aria-hidden="true"></i> Interests and hobbies</h3>
              <div class="chips">
                <span v-for="slug in [...(view.interests || []), ...(view.hobbies || [])]" :key="slug" class="chip"
                      :class="{highlight: isCommonTag(slug)}">{{ tagsStore.label(slug) }}</span>
              </div>
            </section>

            <p v-if="loading && !details" class="loading"><i class="icon icon-spin icon-spinner" aria-hidden="true"></i>
              Loading profile…</p>
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
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px;
  height: 100%;
  color: #ececec;
  background: #2c3e50;
  box-shadow: -8px 0 24px rgba(0, 0, 0, .35);
}

.hero {
  position: relative;
  flex-shrink: 0;
  height: 300px;
  background: #34495e;
}

.hero-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.close {
  position: absolute;
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

.hero-text {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 40px 20px 16px;
  background: linear-gradient(transparent, rgba(20, 28, 38, .9));
}

.hero-text h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.hero-text p {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0 0;
  color: #cfd8dc;
}

.online {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #9fe1cb;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #66bb6a;
}

.body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 20px 20px;
}

.block {
  padding: 16px 0;
  border-bottom: 1px solid #34495e;
}

.block:last-of-type {
  border-bottom: none;
}

.block h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .4px;
  text-transform: uppercase;
  color: #b0bec5;
}

.block.common {
  margin: 12px -8px 0;
  padding: 14px 8px;
  border: 1px solid rgba(255, 167, 38, .4);
  border-radius: 12px;
  background: rgba(255, 167, 38, .08);
}

.block.common h3 {
  color: #ffcc80;
}

.bio {
  margin: 0;
  line-height: 1.6;
  white-space: pre-line;
  color: rgba(235, 235, 235, .85);
}

.songs {
  margin-top: 10px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  color: #ffcc80;
  background: #34495e;
}

.chip.highlight {
  color: #412402;
  background: #ffa726;
}

.error {
  margin: 12px 0 0;
  font-size: 14px;
  color: #f7a1a1;
}

.loading {
  color: rgba(235, 235, 235, .6);
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

  .hero {
    height: 240px;
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
