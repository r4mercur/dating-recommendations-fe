<script setup>
const props = defineProps({
  songs: {
    type: Array,
    required: true
  },
  /** artist names shared with the viewer, highlighted */
  commonArtists: {
    type: Array,
    default: () => []
  },
  /** track currently shown in the player */
  activeTrackId: {
    type: String,
    default: null
  },
  playable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['play'])

function isCommon(song) {
  const common = props.commonArtists.map(artist => artist.toLowerCase())
  return song.artists.some(artist => common.includes(artist.toLowerCase()))
}
</script>

<template>
  <ul class="song-list">
    <li v-for="song in songs" :key="song.spotifyTrackId">
      <component
          :is="playable ? 'button' : 'div'"
          class="song"
          :class="{active: song.spotifyTrackId === activeTrackId, playable}"
          :type="playable ? 'button' : undefined"
          :aria-pressed="playable ? song.spotifyTrackId === activeTrackId : undefined"
          @click="playable && emit('play', song)"
      >
        <img v-if="song.imageUrl" :src="song.imageUrl" :alt="`${song.album} cover`" class="cover" loading="lazy"/>
        <span v-else class="cover placeholder"><i class="pi pi-headphones" aria-hidden="true"></i></span>
        <span class="text">
          <span class="name">{{ song.name }}</span>
          <span class="artists">{{ song.artists.join(', ') }}</span>
        </span>
        <span v-if="song.anthem" class="badge anthem">Profile song</span>
        <span v-if="isCommon(song)" class="badge common">In common</span>
        <i v-if="playable" class="pi play-icon"
           :class="song.spotifyTrackId === activeTrackId ? 'pi-volume-up' : 'pi-play'" aria-hidden="true"></i>
      </component>
    </li>
  </ul>
</template>

<style scoped>
.song-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.song {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 6px;
  border: none;
  border-radius: 10px;
  text-align: left;
  color: inherit;
  background: transparent;
  font: inherit;
}

.song.playable {
  cursor: pointer;
}

.song.playable:hover,
.song.active {
  background: rgba(29, 185, 84, .1);
}

.cover {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 6px;
  object-fit: cover;
}

.cover.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1db954;
  background: #1f3a2b;
}

.text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.name,
.artists {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.name {
  font-size: 15px;
  color: rgba(235, 235, 235, .9);
}

.artists {
  font-size: 13px;
  color: rgba(235, 235, 235, .6);
}

.badge {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.anthem {
  color: #04342c;
  background: #5dcaa5;
}

.common {
  color: #412402;
  background: #ffa726;
}

.play-icon {
  flex-shrink: 0;
  color: #1db954;
}
</style>
