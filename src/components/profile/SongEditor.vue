<script setup>
import {computed} from 'vue'
import InputText from 'primevue/inputtext'
import {useCatalogSearch} from '@/composables/useCatalogSearch.js'
import {MAX_SONGS} from '@/constants/profile.js'
import './editor.css'

const songs = defineModel({type: Array, required: true})

const search = useCatalogSearch('/api/music/search')
const full = computed(() => songs.value.length >= MAX_SONGS)

function isAdded(track) {
  return songs.value.some(song => song.spotifyTrackId === track.spotifyTrackId)
}

function add(track) {
  if (full.value || isAdded(track)) return
  // the first song becomes the profile song until another one is picked
  songs.value = [...songs.value, {...track, anthem: !songs.value.some(song => song.anthem)}]
}

function remove(index) {
  const next = songs.value.filter((_, i) => i !== index)
  if (next.length && !next.some(song => song.anthem) && songs.value[index].anthem) next[0] = {...next[0], anthem: true}
  songs.value = next
}

function toggleAnthem(index) {
  songs.value = songs.value.map((song, i) => ({...song, anthem: i === index ? !song.anthem : false}))
}

function move(index, offset) {
  const next = [...songs.value]
  const [song] = next.splice(index, 1)
  next.splice(index + offset, 0, song)
  songs.value = next
}
</script>

<template>
  <div class="catalog-editor">
    <ol v-if="songs.length" class="chosen">
      <li v-for="(song, index) in songs" :key="song.spotifyTrackId" class="row">
        <img v-if="song.imageUrl" :src="song.imageUrl" alt="" class="cover"/>
        <span v-else class="cover placeholder"><i class="pi pi-headphones" aria-hidden="true"></i></span>
        <span class="text">
          <span class="name">{{ song.name }}</span>
          <span class="sub">{{ song.artists.join(', ') }}</span>
        </span>
        <button type="button" class="icon-btn anthem" :class="{on: song.anthem}" @click="toggleAnthem(index)"
                :aria-pressed="song.anthem" :title="song.anthem ? 'Profile song' : 'Make profile song'">
          <i :class="['pi', song.anthem ? 'pi-star-fill' : 'pi-star']" aria-hidden="true"></i>
        </button>
        <button type="button" class="icon-btn" :disabled="index === 0" @click="move(index, -1)" title="Move up">
          <i class="pi pi-arrow-up" aria-hidden="true"></i>
        </button>
        <button type="button" class="icon-btn" :disabled="index === songs.length - 1" @click="move(index, 1)"
                title="Move down">
          <i class="pi pi-arrow-down" aria-hidden="true"></i>
        </button>
        <button type="button" class="icon-btn" @click="remove(index)" :title="`Remove ${song.name}`">
          <i class="pi pi-times" aria-hidden="true"></i>
        </button>
      </li>
    </ol>
    <p v-else class="hint">No songs yet. Add up to {{ MAX_SONGS }}, the starred one is your profile song.</p>

    <label class="search">
      <span class="sr-only">Search Spotify</span>
      <i class="pi pi-search" aria-hidden="true"></i>
      <InputText v-model="search.query.value" :disabled="full" fluid
                 :placeholder="full ? `You have ${MAX_SONGS} songs, remove one to add another` : 'Search a song or artist'"
                 @keydown.enter.prevent/>
      <i v-if="search.loading.value" class="pi pi-spin pi-spinner" aria-hidden="true"></i>
    </label>
    <p v-if="search.error.value" class="error" role="alert">{{ search.error.value }}</p>

    <ul v-if="search.results.value.length" class="results">
      <li v-for="track in search.results.value" :key="track.spotifyTrackId" class="row">
        <img v-if="track.imageUrl" :src="track.imageUrl" alt="" class="cover"/>
        <span v-else class="cover placeholder"><i class="pi pi-headphones" aria-hidden="true"></i></span>
        <span class="text">
          <span class="name">{{ track.name }}</span>
          <span class="sub">{{ track.artists.join(', ') }} · {{ track.album }}</span>
        </span>
        <button type="button" class="add-btn" :disabled="full || isAdded(track)" @click="add(track)">
          {{ isAdded(track) ? 'Added' : 'Add' }}
        </button>
      </li>
    </ul>
  </div>
</template>

