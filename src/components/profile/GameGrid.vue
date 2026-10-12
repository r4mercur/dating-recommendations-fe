<script setup>
const props = defineProps({
  games: {
    type: Array,
    required: true
  },
  /** IGDB ids shared with the viewer, highlighted */
  commonIds: {
    type: Array,
    default: () => []
  }
})

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase()
}
</script>

<template>
  <ul class="game-grid">
    <li v-for="game in games" :key="game.igdbId" class="game">
      <img v-if="game.coverUrl" :src="game.coverUrl" :alt="`${game.name} cover`" class="cover" loading="lazy"/>
      <span v-else class="cover placeholder" aria-hidden="true">{{ initials(game.name) }}</span>
      <span v-if="props.commonIds.includes(game.igdbId)" class="common">In common</span>
      <span class="name">{{ game.name }}</span>
      <span class="meta">
        <template v-if="game.year">{{ game.year }}</template>
        <template v-if="game.year && game.platforms?.length"> · </template>
        {{ (game.platforms || []).slice(0, 3).join(', ') }}
      </span>
    </li>
  </ul>
</template>

<style scoped>
.game-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.game {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cover {
  width: 100%;
  aspect-ratio: 3 / 4;
  border-radius: 10px;
  object-fit: cover;
  background: #34495e;
}

.cover.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  color: #cecbf6;
  background: #3c3489;
}

.common {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  color: #412402;
  background: #ffa726;
}

.name {
  margin-top: 6px;
  font-size: 14px;
  color: rgba(235, 235, 235, .9);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.meta {
  font-size: 12px;
  color: rgba(235, 235, 235, .55);
}
</style>
