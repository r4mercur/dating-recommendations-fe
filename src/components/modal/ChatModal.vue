<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Start New Chat</h3>
        <Button
          icon="pi pi-times"
          class="p-button-text p-button-plain close-button"
          @click="closeModal"
        />
      </div>

      <div class="modal-body">
        <div class="form-group">
          <label for="contact-select">Select Contact:</label>
          <Select
            id="contact-select"
            v-model="selectedContact"
            :options="availableContacts"
            option-label="name"
            option-value="referenceId"
            placeholder="Choose a contact to chat with..."
            class="w-full contact-select"
            :pt="{ overlay: { class: 'contact-select-overlay' } }"
            :loading="loading"
          >
            <template #value="{ placeholder }">
              <div v-if="selectedContactData" class="contact-option">
                <img :src="selectedContactData.photo || defaultAvatar" :alt="selectedContactData.name" class="contact-photo" />
                <span class="contact-name">{{ selectedContactData.name }}</span>
              </div>
              <span v-else class="contact-placeholder">{{ placeholder }}</span>
            </template>

            <template #option="{ option }">
              <div class="contact-option">
                <img :src="option.photo || defaultAvatar" :alt="option.name" class="contact-photo" />
                <span class="contact-name">{{ option.name }}</span>
              </div>
            </template>
          </Select>
        </div>

        <div class="modal-actions">
          <Button
            label="Cancel"
            icon="pi pi-times"
            class="p-button-secondary"
            @click="closeModal"
          />
          <Button
            label="Start Chat"
            icon="pi pi-comments"
            :disabled="!selectedContact"
            @click="createChat"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue'
import {useUserStore} from '@/stores/user.js'
import {useReactionsStore} from '@/stores/reactions.js'
import Button from 'primevue/button'
import Select from 'primevue/select'
import defaultAvatar from '@/assets/avatar.jpg'

const emit = defineEmits(['close', 'chat-created'])

const userStore = useUserStore()
const reactionsStore = useReactionsStore()
const selectedContact = ref(null)
const loading = ref(false)

// everyone you matched with can be messaged
const availableContacts = computed(() => (reactionsStore.matches || []).map(match => ({
  referenceId: match.user.referenceId,
  name: match.user.name,
  photo: match.user.photo
})))

// the Select only hands back the value (referenceId), so look up the full contact for the trigger
const selectedContactData = computed(() =>
  availableContacts.value.find(contact => contact.referenceId === selectedContact.value) ?? null
)

onMounted(async () => {
  if (!reactionsStore.matches && userStore.user?.referenceId) {
    loading.value = true
    try {
      await reactionsStore.loadMatches()
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      loading.value = false
    }
  }
})

function closeModal() {
  emit('close')
}

async function createChat() {
  if (!selectedContact.value) return

  const selectedContactData = availableContacts.value.find(
    contact => contact.referenceId === selectedContact.value
  )

  if (!selectedContactData) return

  // Create chat ID from both users
  const chatId = [userStore.user.referenceId, selectedContact.value]
    .sort()
    .join('-')

  try {
    loading.value = true

    // Create chat on backend
    const response = await fetch('http://localhost:8081/create-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        participants: [userStore.user.name, selectedContactData.name]
      })
    })

    if (response.status === 201 || response.status === 200) {
      // Emit chat created event with contact info
      emit('chat-created', {
        chatId,
        contact: selectedContactData
      })
      closeModal()
    } else {
      const text = await response.text()
      console.error('Error creating chat:', text)
    }
  } catch (error) {
    console.error('Error creating chat:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: linear-gradient(145deg, #34495e, #2c3e50);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  color: rgba(235, 235, 235, 0.9);
  font-size: 1.25rem;
}

.close-button {
  color: rgb(224, 45, 45) !important;
}

.close-button:hover {
  transition: 0.5s;
  background-color: rgb(224, 45, 45) !important;
  color: rgba(235, 235, 235, 0.9) !important;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: rgba(235, 235, 235, 0.9);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.w-full {
  width: 100%;
}

.contact-select :deep(.p-select) {
  min-height: 56px;
  background: rgba(44, 62, 80, 0.6);
  border: 1px solid #34495e;
  border-radius: 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.contact-select :deep(.p-select:hover) {
  border-color: rgba(255, 167, 38, 0.5);
}

.contact-select :deep(.p-select:focus-within) {
  border-color: #ffa726;
  box-shadow: 0 0 0 3px rgba(255, 167, 38, 0.2);
}

.contact-option {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.contact-photo {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #34495e;
}

.contact-name {
  font-weight: 500;
  color: rgba(235, 235, 235, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-placeholder {
  color: rgba(235, 235, 235, 0.5);
}
</style>

<!-- the overlay is teleported to <body>, so it can't be reached by scoped styles -->
<style>
.contact-select-overlay {
  background: #2c3e50;
  border: 1px solid #34495e;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
}

.contact-select-overlay .p-select-list {
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-select-overlay .p-select-option {
  padding: 8px 10px;
  border-radius: 8px;
  color: rgba(235, 235, 235, 0.9);
}

.contact-select-overlay .p-select-option.p-focus,
.contact-select-overlay .p-select-option:hover {
  background: rgba(52, 73, 94, 0.9);
}

.contact-select-overlay .p-select-option.p-select-option-selected {
  background: rgba(255, 167, 38, 0.15);
  color: #ffcc80;
}
</style>

