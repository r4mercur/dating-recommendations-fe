<script setup>
import {computed, ref} from 'vue'
import {apiFetch} from '@/api.js'
import {useCatalogSearch} from '@/composables/useCatalogSearch.js'
import {MAX_GAMES} from '@/constants/profile.js'
import './editor.css'

const games = defineModel({type: Array, required: true})

const search = useCatalogSearch('/api/games/search')
const full = computed(() => games.value.length >= MAX_GAMES)

const steamProfile = ref('')
const steamSuggestions = ref([])
const steamLoading = ref(false)
const steamError = ref(null)

function isAdded(game) {
  return game.igdbId != null && games.value.some(chosen => chosen.igdbId === game.igdbId)
}

function add(game) {
  if (full.value || isAdded(game) || game.igdbId == null) return
  const {igdbId, name, coverUrl, year = null, platforms = [], steamAppId = null} = game
  games.value = [...games.value, {igdbId, name, coverUrl, year, platforms, steamAppId}]
}

function remove(index) {
  games.value = games.value.filter((_, i) => i !== index)
}

function move(index, offset) {
  const next = [...games.value]
  const [game] = next.splice(index, 1)
  next.splice(index + offset, 0, game)
  games.value = next
}

async function loadSteamSuggestions() {
  if (!steamProfile.value.trim()) {
    steamError.value = 'Enter your Steam profile link or name first.'
    return
  }
  steamLoading.value = true
  steamError.value = null
  try {
    steamSuggestions.value = await apiFetch('/api/me/games/steam-suggestions', {
      method: 'POST',
      body: JSON.stringify({profile: steamProfile.value.trim()})
    })
  } catch (error) {
    // 422 private profile, 404 unknown name, 503 Steam or IGDB unavailable: the backend message says what to do
    steamSuggestions.value = []
    steamError.value = error.message
  } finally {
    steamLoading.value = false
  }
}
</script>

<template>
  <div class="catalog-editor">
    <ol v-if="games.length" class="chosen">
      <li v-for="(game, index) in games" :key="game.igdbId" class="row">
        <img v-if="game.coverUrl" :src="game.coverUrl" alt="" class="cover tall"/>
        <span v-else class="cover tall placeholder"><i class="icon icon-th-large" aria-hidden="true"></i></span>
        <span class="text">
          <span class="name">{{ game.name }}</span>
          <span class="sub">{{ [game.year, ...(game.platforms || []).slice(0, 3)].filter(Boolean).join(' · ') }}</span>
        </span>
        <button type="button" class="icon-btn" :disabled="index === 0" @click="move(index, -1)" title="Move up">
          <i class="icon icon-arrow-up" aria-hidden="true"></i>
        </button>
        <button type="button" class="icon-btn" :disabled="index === games.length - 1" @click="move(index, 1)"
                title="Move down">
          <i class="icon icon-arrow-down" aria-hidden="true"></i>
        </button>
        <button type="button" class="icon-btn" @click="remove(index)" :title="`Remove ${game.name}`">
          <i class="icon icon-times" aria-hidden="true"></i>
        </button>
      </li>
    </ol>
    <p v-else class="hint">No games yet. Add up to {{ MAX_GAMES }} favorites.</p>

    <label class="search">
      <span class="sr-only">Search games</span>
      <i class="icon icon-search" aria-hidden="true"></i>
      <input class="input" v-model="search.query.value" :disabled="full"
                 :placeholder="full ? `You have ${MAX_GAMES} games, remove one to add another` : 'Search a game'"
                 @keydown.enter.prevent/>
      <i v-if="search.loading.value" class="icon icon-spin icon-spinner" aria-hidden="true"></i>
    </label>
    <p v-if="search.error.value" class="error" role="alert">{{ search.error.value }}</p>

    <ul v-if="search.results.value.length" class="results">
      <li v-for="game in search.results.value" :key="game.igdbId" class="row">
        <img v-if="game.coverUrl" :src="game.coverUrl" alt="" class="cover tall"/>
        <span v-else class="cover tall placeholder"><i class="icon icon-th-large" aria-hidden="true"></i></span>
        <span class="text">
          <span class="name">{{ game.name }}</span>
          <span class="sub">{{ [game.year, ...(game.platforms || []).slice(0, 3)].filter(Boolean).join(' · ') }}</span>
        </span>
        <button type="button" class="add-btn" :disabled="full || isAdded(game)" @click="add(game)">
          {{ isAdded(game) ? 'Added' : 'Add' }}
        </button>
      </li>
    </ul>

    <p class="subheading"><i class="icon icon-desktop" aria-hidden="true"></i> Import from Steam</p>
    <div class="steam-form">
      <input class="input" v-model="steamProfile" maxlength="200" aria-label="Steam profile"
                 placeholder="steamcommunity.com/id/yourname" @input="steamError = null"
                 @keydown.enter.prevent="loadSteamSuggestions"/>
      <button type="button" class="add-btn" :disabled="steamLoading" @click="loadSteamSuggestions">
        <i v-if="steamLoading" class="icon icon-spin icon-spinner" aria-hidden="true"></i>
        Show my games
      </button>
    </div>
    <p class="hint">Your Steam game details need to be public. We don't store your Steam account.</p>
    <p v-if="steamError" class="error" role="alert">{{ steamError }}</p>

    <ul v-if="steamSuggestions.length" class="results">
      <li v-for="game in steamSuggestions" :key="game.steamAppId" class="row">
        <img v-if="game.coverUrl" :src="game.coverUrl" alt="" class="cover"/>
        <span v-else class="cover placeholder"><i class="icon icon-th-large" aria-hidden="true"></i></span>
        <span class="text">
          <span class="name">{{ game.name }}</span>
          <span class="sub">{{ game.playtimeHours }} h played</span>
        </span>
        <button v-if="game.igdbId != null" type="button" class="add-btn" :disabled="full || isAdded(game)"
                @click="add(game)">
          {{ isAdded(game) ? 'Added' : 'Add' }}
        </button>
        <span v-else class="sub" title="This game isn't in the game catalog">Not in catalog</span>
      </li>
    </ul>
  </div>
</template>
