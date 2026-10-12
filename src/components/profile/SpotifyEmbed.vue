<script setup>
import {computed} from 'vue'

const props = defineProps({
  trackId: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Spotify player'
  }
})

// the embed plays a preview, or the full song for listeners logged in to Spotify in this browser
const src = computed(() => `https://open.spotify.com/embed/track/${encodeURIComponent(props.trackId)}?theme=0`)
</script>

<template>
  <iframe
      :key="trackId"
      :src="src"
      :title="title"
      class="spotify-embed"
      height="152"
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
  ></iframe>
</template>

<style scoped>
.spotify-embed {
  display: block;
  width: 100%;
  border: 0;
  border-radius: 12px;
  background: #1f3a2b;
}
</style>
