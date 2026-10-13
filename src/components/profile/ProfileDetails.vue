<script setup>
import {computed, ref, watch} from 'vue'
import {apiFetch} from '@/api.js'
import defaultAvatar from '@/assets/avatar.jpg'
import {useTagsStore} from '@/stores/tags.js'
import SongList from '@/components/profile/SongList.vue'
import SpotifyEmbed from '@/components/profile/SpotifyEmbed.vue'
import GameGrid from '@/components/profile/GameGrid.vue'

/**
 * Full profile of another user: photo, what you share, bio, music, games and tags.
 * Starts with the card data from the recommendations and loads the rest (GET /api/user) when shown.
 * Used by the profile sheet and by the swipe card.
 */
const props = defineProps({
  /** ProfileCard from the recommendations */
  profile: {
    type: Object,
    required: true
  },
  /** id of the name heading, for aria-labelledby of a surrounding dialog */
  headingId: {
    type: String,
    default: null
  },
  /** the Spotify player is an iframe: only cards that are actually visible load it */
  showPlayer: {
    type: Boolean,
    default: true
  }
})

const tagsStore = useTagsStore()
const details = ref(null)
const loading = ref(false)
const error = ref(null)
const playingTrackId = ref(null)

/** card data first, replaced field by field once the full profile is there */
const view = computed(() => ({...props.profile, ...(details.value ?? {})}))
const songs = computed(() => view.value.songs ?? [])
const games = computed(() => view.value.games ?? [])
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
  const {city, distanceKm} = view.value
  return [city, distanceKm != null ? `${distanceKm} km away` : null].filter(Boolean).join(' · ')
})

function isCommonTag(slug) {
  return common.value.interests.includes(slug) || common.value.hobbies.includes(slug)
}

async function load(referenceId) {
  loading.value = true
  error.value = null
  try {
    const profile = await apiFetch(`/api/user?referenceId=${encodeURIComponent(referenceId)}`)
    if (props.profile.referenceId === referenceId) details.value = profile
  } catch (e) {
    if (props.profile.referenceId === referenceId) error.value = e.message
  } finally {
    loading.value = false
  }
}

watch(() => props.profile.referenceId, (referenceId) => {
  details.value = null
  playingTrackId.value = null
  tagsStore.load()
  load(referenceId)
}, {immediate: true})

defineExpose({details})
</script>

<template>
  <div class="profile-details">
    <header class="hero">
      <img :src="view.photo || defaultAvatar" :alt="view.name" class="hero-photo" draggable="false"/>
      <div class="hero-text">
        <h2 :id="headingId">{{ view.name }}, {{ view.age }}</h2>
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
        <SpotifyEmbed v-if="showPlayer && shownTrackId" :trackId="shownTrackId" :title="`${view.name}'s song on Spotify`"/>
        <SongList :songs="songs" :commonArtists="common.artists" :activeTrackId="shownTrackId" :playable="showPlayer"
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
  </div>
</template>

<style scoped>
.profile-details {
  color: #ececec;
}

.hero {
  position: relative;
  height: var(--hero-height, 300px);
  background: #34495e;
}

.hero-photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
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

@media (max-width: 640px) {
  .hero {
    height: var(--hero-height-mobile, 240px);
  }
}
</style>
