<script setup>
import {computed, onMounted, reactive, ref} from 'vue'
import MultiSelect from '@/components/ui/MultiSelect.vue'
import RangeSlider from '@/components/ui/RangeSlider.vue'
import {apiFetch} from '@/api.js'
import {useUserStore} from '@/stores/user'
import {useRecommendationsStore} from '@/stores/recommendation.js'
import {useReactionsStore} from '@/stores/reactions.js'
import {TagCategory, useTagsStore} from '@/stores/tags.js'
import ProfileSection from '@/components/ProfileSection.vue'
import ProfileUploadModal from '@/components/modal/ProfileUploadModal.vue'
import SongList from '@/components/profile/SongList.vue'
import SongEditor from '@/components/profile/SongEditor.vue'
import SpotifyEmbed from '@/components/profile/SpotifyEmbed.vue'
import GameGrid from '@/components/profile/GameGrid.vue'
import GameEditor from '@/components/profile/GameEditor.vue'
import defaultAvatar from '@/assets/avatar.jpg'
import {
  BIO_MAX_LENGTH,
  fromIsoDate,
  genderLabel,
  GENDERS,
  latestBirthDate,
  MAX_AGE,
  MAX_DISTANCE_KM,
  MAX_TAGS_PER_CATEGORY,
  MIN_AGE,
  toIsoDate
} from '@/constants/profile.js'

const userStore = useUserStore()
const recommendationsStore = useRecommendationsStore()
const reactionsStore = useReactionsStore()
const tagsStore = useTagsStore()

const showUploadModal = ref(false)
const user = computed(() => userStore.user)
const avatar = computed(() => userStore.avatar)
/** latest birth date that is old enough, yyyy-MM-dd like the value of the date field */
const maxBirthDate = toIsoDate(latestBirthDate())

const stats = reactive({matches: null, chats: null, likes: null})

/** one draft per section, filled when the section switches to edit mode */
const draft = reactive({
  bio: '',
  basics: {name: '', birthDate: '', gender: null},
  address: {street: '', zipCode: '', city: '', country: ''},
  tags: {interests: [], hobbies: []},
  preferences: {seekingGenders: [], ageRange: [MIN_AGE, MAX_AGE], maxDistanceKm: 50},
  songs: [],
  games: [],
})

/** track shown in the Spotify player, the profile song by default */
const playingTrackId = ref(null)
const shownTrackId = computed(() => {
  const songs = user.value?.songs || []
  if (songs.some(song => song.spotifyTrackId === playingTrackId.value)) return playingTrackId.value
  return (songs.find(song => song.anthem) ?? songs[0])?.spotifyTrackId ?? null
})

const birthDateText = computed(() => user.value?.birthDate
    ? fromIsoDate(user.value.birthDate).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric'})
    : null)

const preferencesText = computed(() => {
  const preferences = user.value?.preferences
  if (!preferences) return null
  const genders = preferences.seekingGenders.length === GENDERS.length
      ? 'Everyone'
      : preferences.seekingGenders.map(genderLabel).join(', ')
  return {genders, ages: `${preferences.minAge}–${preferences.maxAge}`, distance: `${preferences.maxDistanceKm} km`}
})

function tagLabels(slugs) {
  return (slugs || []).map(slug => tagsStore.label(slug))
}

/** profile changes that influence the recommendations invalidate the loaded ones */
function afterMatchingChange() {
  recommendationsStore.reset()
}

async function saveBio() {
  await userStore.updateUser({bio: draft.bio.trim()})
}

async function saveBasics() {
  const {name, birthDate, gender} = draft.basics
  if (!name.trim()) throw new Error('Name is required.')
  if (!birthDate) throw new Error('Birth date is required.')
  if (birthDate > maxBirthDate) throw new Error(`You need to be at least ${MIN_AGE}.`)
  await userStore.updateUser({name: name.trim(), birthDate, gender})
  afterMatchingChange()
}

async function saveAddress() {
  const {street, zipCode, city, country} = draft.address
  if (!zipCode.trim() || !city.trim() || !country.trim()) throw new Error('Zip code, city and country are required.')
  await userStore.updateUser({
    address: {street: street.trim() || null, zipCode: zipCode.trim(), city: city.trim(), country: country.trim()}
  })
  afterMatchingChange()
}

async function saveTags() {
  await userStore.updateUser({interests: draft.tags.interests, hobbies: draft.tags.hobbies})
  afterMatchingChange()
}

async function savePreferences() {
  const {seekingGenders, ageRange, maxDistanceKm} = draft.preferences
  if (!seekingGenders.length) throw new Error('Choose at least one gender.')
  await userStore.updatePreferences({seekingGenders, minAge: ageRange[0], maxAge: ageRange[1], maxDistanceKm})
  afterMatchingChange()
}

async function saveSongs() {
  await userStore.saveSongs(draft.songs)
  afterMatchingChange()
}

async function saveGames() {
  await userStore.saveGames(draft.games)
  afterMatchingChange()
}

function editSongs() {
  draft.songs = (user.value.songs || []).map(song => ({...song}))
}

function editGames() {
  draft.games = (user.value.games || []).map(game => ({...game}))
}

function editBio() {
  draft.bio = user.value.bio || ''
}

function editBasics() {
  draft.basics = {name: user.value.name, birthDate: user.value.birthDate ?? '', gender: user.value.gender}
}

function editAddress() {
  const address = user.value.address || {}
  draft.address = {
    street: address.street || '',
    zipCode: address.zipCode || '',
    city: address.city || '',
    country: address.country || 'DE'
  }
}

function editTags() {
  draft.tags = {interests: [...(user.value.interests || [])], hobbies: [...(user.value.hobbies || [])]}
}

function editPreferences() {
  const preferences = user.value.preferences
  draft.preferences = {
    seekingGenders: [...(preferences?.seekingGenders || GENDERS.map(gender => gender.value))],
    ageRange: [preferences?.minAge ?? MIN_AGE, preferences?.maxAge ?? MAX_AGE],
    maxDistanceKm: preferences?.maxDistanceKm ?? 50,
  }
}

async function loadStats() {
  const [matches, conversations, likes] = await Promise.allSettled([
    reactionsStore.loadMatches(),
    apiFetch('/api/me/conversations'),
    apiFetch('/api/me/likes-received'),
  ])
  stats.matches = matches.status === 'fulfilled' ? matches.value.length : null
  stats.chats = conversations.status === 'fulfilled'
      ? conversations.value.filter(conversation => conversation.lastMessage).length
      : null
  stats.likes = likes.status === 'fulfilled' ? likes.value.length : null
}

onMounted(() => {
  tagsStore.load()
  loadStats()
  // load recommendations right after login so the discover page is ready
  if (user.value?.referenceId && !recommendationsStore.loaded) {
    recommendationsStore.load()
  }
})
</script>

<template>
  <div class="profile-container" v-if="user">
    <aside class="profile-sidebar">
      <div class="avatar-section">
        <button class="avatar-button" type="button" @click="showUploadModal = true" title="Change profile picture">
          <img :src="avatar || defaultAvatar" :alt="user.name" class="profile-avatar"/>
          <span class="avatar-overlay"><i class="icon icon-camera" aria-hidden="true"></i> Change</span>
        </button>
        <h1 class="profile-name">{{ user.name }}</h1>
        <p class="profile-subline">
          {{ user.age }}<template v-if="user.address?.city"> · {{ user.address.city }}</template>
        </p>
      </div>

      <div class="profile-bio" v-if="user.bio">
        <p>{{ user.bio }}</p>
      </div>

      <div class="profile-details">
        <div class="detail-item">
          <i class="icon icon-envelope"></i>
          <span>{{ user.email }}</span>
        </div>
        <div class="detail-item" v-if="user.gender">
          <i class="icon icon-user"></i>
          <span>{{ genderLabel(user.gender) }}</span>
        </div>
        <div class="detail-item" v-if="user.status && user.status !== 'ACTIVE'">
          <i class="icon icon-eye-slash"></i>
          <span>Profile hidden ({{ user.status.toLowerCase() }})</span>
        </div>
      </div>
    </aside>

    <div class="profile-content">
      <div class="profile-header">
        <h2>Your profile</h2>
      </div>

      <div class="info-grid">
        <ProfileSection title="Activity" icon="icon-chart-bar">
          <div class="stats-grid">
            <router-link to="/matches" class="stat-item">
              <span class="stat-number">{{ stats.matches ?? '–' }}</span>
              <span class="stat-label red-color">Matches</span>
            </router-link>
            <router-link to="/messages" class="stat-item">
              <span class="stat-number">{{ stats.chats ?? '–' }}</span>
              <span class="stat-label green-color">Chats</span>
            </router-link>
            <div class="stat-item">
              <span class="stat-number">{{ stats.likes ?? '–' }}</span>
              <span class="stat-label orange-color">Likes received</span>
            </div>
          </div>
        </ProfileSection>

        <ProfileSection title="About me" icon="icon-comment" :save="saveBio" @edit="editBio">
          <p v-if="user.bio" class="bio-text">{{ user.bio }}</p>
          <p v-else class="empty">Tell others something about you. Profiles with a bio get more likes.</p>
          <template #edit>
            <textarea v-model="draft.bio" rows="4" class="textarea" :maxlength="BIO_MAX_LENGTH"
                      placeholder="What should people know about you?" aria-label="About me"></textarea>
            <span class="counter">{{ draft.bio.length }}/{{ BIO_MAX_LENGTH }}</span>
          </template>
        </ProfileSection>

        <ProfileSection title="Basic information" icon="icon-id-card" :save="saveBasics" @edit="editBasics">
          <dl class="info-list">
            <div class="info-item"><dt>Name</dt><dd>{{ user.name }}</dd></div>
            <div class="info-item"><dt>Birth date</dt><dd>{{ birthDateText ?? '–' }} ({{ user.age }})</dd></div>
            <div class="info-item"><dt>Gender</dt><dd>{{ genderLabel(user.gender) }}</dd></div>
          </dl>
          <template #edit>
            <label class="field">Name
              <input v-model="draft.basics.name" class="input" maxlength="255"/>
            </label>
            <div class="two-columns">
              <label class="field">Birth date
                <input v-model="draft.basics.birthDate" type="date" class="input" :max="maxBirthDate"/>
              </label>
              <label class="field">Gender
                <select v-model="draft.basics.gender" class="select">
                  <option v-for="gender in GENDERS" :key="gender.value" :value="gender.value">{{ gender.label }}</option>
                </select>
              </label>
            </div>
          </template>
        </ProfileSection>

        <ProfileSection title="Location" icon="icon-map-marker" :save="saveAddress" @edit="editAddress">
          <dl class="info-list">
            <div class="info-item"><dt>City</dt><dd>{{ user.address?.zipCode }} {{ user.address?.city }}</dd></div>
            <div class="info-item" v-if="user.address?.street"><dt>Street</dt><dd>{{ user.address.street }}</dd></div>
            <div class="info-item"><dt>Country</dt><dd>{{ user.address?.country }}</dd></div>
          </dl>
          <p class="hint">Others only see your city. The zip code decides who is nearby.</p>
          <template #edit>
            <label class="field">Street and number (optional)
              <input v-model="draft.address.street" class="input" autocomplete="street-address"/>
            </label>
            <div class="two-columns">
              <label class="field">Zip code
                <input v-model="draft.address.zipCode" class="input" autocomplete="postal-code"/>
              </label>
              <label class="field">City
                <input v-model="draft.address.city" class="input" autocomplete="address-level2"/>
              </label>
            </div>
            <label class="field">Country
              <input v-model="draft.address.country" class="input" autocomplete="country"/>
            </label>
          </template>
        </ProfileSection>

        <ProfileSection title="Interests and hobbies" icon="icon-tags" :save="saveTags" @edit="editTags">
          <div class="tag-group">
            <span class="tag-group-label">Interests</span>
            <div class="interests-tags">
              <span v-for="label in tagLabels(user.interests)" :key="label" class="interest-tag">{{ label }}</span>
              <span v-if="!user.interests?.length" class="empty">None yet</span>
            </div>
          </div>
          <div class="tag-group">
            <span class="tag-group-label">Hobbies</span>
            <div class="interests-tags">
              <span v-for="label in tagLabels(user.hobbies)" :key="label" class="interest-tag hobby">{{ label }}</span>
              <span v-if="!user.hobbies?.length" class="empty">None yet</span>
            </div>
          </div>
          <template #edit>
            <label class="field">Interests
              <MultiSelect v-model="draft.tags.interests" :options="tagsStore.options(TagCategory.INTEREST)"
                           filter
                           :selection-limit="MAX_TAGS_PER_CATEGORY"/>
            </label>
            <label class="field">Hobbies
              <MultiSelect v-model="draft.tags.hobbies" :options="tagsStore.options(TagCategory.HOBBY)"
                           filter
                           :selection-limit="MAX_TAGS_PER_CATEGORY"/>
            </label>
          </template>
        </ProfileSection>

        <ProfileSection title="Music" icon="icon-headphones" :save="saveSongs" @edit="editSongs">
          <template v-if="user.songs?.length">
            <SpotifyEmbed v-if="shownTrackId" :trackId="shownTrackId" title="Your profile song on Spotify"/>
            <SongList :songs="user.songs" playable :activeTrackId="shownTrackId" class="song-list"
                      @play="song => playingTrackId = song.spotifyTrackId"/>
          </template>
          <p v-else class="empty">Add your profile song and favorite tracks. Shared artists show up as things in common.</p>
          <template #edit>
            <SongEditor v-model="draft.songs"/>
          </template>
        </ProfileSection>

        <ProfileSection title="Favorite games" icon="icon-th-large" :save="saveGames" @edit="editGames">
          <GameGrid v-if="user.games?.length" :games="user.games"/>
          <p v-else class="empty">Show what you play. You can also pick games from your Steam library.</p>
          <template #edit>
            <GameEditor v-model="draft.games"/>
          </template>
        </ProfileSection>

        <ProfileSection title="Who you're looking for" icon="icon-search" :save="savePreferences" @edit="editPreferences">
          <dl class="info-list" v-if="preferencesText">
            <div class="info-item"><dt>Gender</dt><dd>{{ preferencesText.genders }}</dd></div>
            <div class="info-item"><dt>Age</dt><dd>{{ preferencesText.ages }}</dd></div>
            <div class="info-item"><dt>Distance</dt><dd>up to {{ preferencesText.distance }}</dd></div>
          </dl>
          <template #edit>
            <label class="field">Show me
              <MultiSelect v-model="draft.preferences.seekingGenders" :options="GENDERS"/>
            </label>
            <div class="field">
              <span>Age {{ draft.preferences.ageRange[0] }}–{{ draft.preferences.ageRange[1] }}</span>
              <RangeSlider v-model="draft.preferences.ageRange" range :min="MIN_AGE" :max="MAX_AGE" class="slider"
                           aria-label="Age range"/>
            </div>
            <div class="field">
              <span>Up to {{ draft.preferences.maxDistanceKm }} km</span>
              <RangeSlider v-model="draft.preferences.maxDistanceKm" :min="1" :max="MAX_DISTANCE_KM" class="slider"
                           aria-label="Maximum distance"/>
            </div>
          </template>
        </ProfileSection>
      </div>
    </div>
  </div>

  <ProfileUploadModal
      v-if="showUploadModal"
      @close="showUploadModal = false"
      @uploaded="showUploadModal = false"
  />
</template>

<style scoped>
.profile-container {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  gap: 30px;
  min-height: calc(100vh - 200px);
}

.profile-sidebar {
  flex: 0 0 300px;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #34495e;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  height: fit-content;
  position: sticky;
  top: 30px;
}

.avatar-section {
  text-align: center;
  margin-bottom: 24px;
}

.avatar-button {
  position: relative;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  cursor: pointer;
}

.profile-avatar {
  display: block;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #34495e;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 50%;
  font-weight: 600;
  color: #fff;
  background: rgba(0, 0, 0, .45);
  opacity: 0;
  transition: opacity .2s ease;
}

.avatar-button:hover .avatar-overlay,
.avatar-button:focus-visible .avatar-overlay {
  opacity: 1;
}

.profile-name {
  font-size: 24px;
  font-weight: 600;
  margin: 16px 0 4px 0;
  color: rgba(235, 235, 235, 0.9);
}

.profile-subline {
  margin: 0;
  color: rgba(235, 235, 235, 0.64);
}

.profile-bio {
  padding: 16px 0;
  border-bottom: 1px solid #34495e;
  margin-bottom: 16px;
}

.profile-bio p {
  margin: 0;
  line-height: 1.5;
  color: rgba(235, 235, 235, 0.8);
}

.profile-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(235, 235, 235, 0.64);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.detail-item i {
  width: 16px;
}

.profile-content {
  flex: 1;
  min-width: 0;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #34495e;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.profile-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #34495e;
}

.profile-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  /* minmax(0, …): long content (e.g. song titles in search results) is truncated instead of widening the column */
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.info-item dt {
  font-weight: 500;
  color: #8c959f;
}

.info-item dd {
  margin: 0;
  text-align: right;
  color: rgba(235, 235, 235, 0.8);
}

.bio-text {
  margin: 0;
  line-height: 1.6;
  white-space: pre-line;
  color: rgba(235, 235, 235, 0.8);
}

.empty,
.hint {
  margin: 0;
  font-size: 14px;
  color: rgba(235, 235, 235, 0.5);
}

.hint {
  margin-top: 12px;
}

.song-list {
  margin-top: 12px;
}

.counter {
  align-self: flex-end;
  font-size: 12px;
  color: rgba(235, 235, 235, 0.5);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 1rem;
  font-size: 14px;
  font-weight: 500;
  color: rgba(235, 235, 235, 0.8);
}

.slider {
  margin: 10px 8px 4px;
}

.two-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.tag-group + .tag-group {
  margin-top: 16px;
}

.tag-group-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: #8c959f;
}

.interests-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.interest-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: #ffcc80;
  background: rgba(255, 167, 38, .12);
}

.interest-tag.hobby {
  color: #9fe1cb;
  background: rgba(29, 158, 117, .15);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.red-color {
  color: #ef5350;
}

.green-color {
  color: #66bb6a;
}

.orange-color {
  color: #ffa726;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: linear-gradient(145deg, #34495e, #2c3e50);
  border-radius: 6px;
  border: 1px solid #34495e;
  text-decoration: none;
  transition: border-color .2s ease;
}

a.stat-item:hover {
  border-color: #ffa726;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: white;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .profile-container {
    flex-direction: column;
    padding: 20px;
    gap: 20px;
  }

  .profile-sidebar {
    flex: none;
    position: static;
  }

  .profile-avatar {
    width: 150px;
    height: 150px;
  }

  .stats-grid,
  .two-columns {
    grid-template-columns: 1fr;
  }
}
</style>
