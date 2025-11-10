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
            class="w-full"
            :loading="loading"
          />
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
import Button from 'primevue/button'
import Select from 'primevue/select'

const emit = defineEmits(['close', 'chat-created'])

const userStore = useUserStore()
const selectedContact = ref(null)
const loading = ref(false)

// Compute available contacts from accepted contacts
const availableContacts = computed(() => {
  if (!userStore.contacts || userStore.contacts.length === 0) {
    return []
  }

  // Filter for accepted contacts and extract contact user info
  return userStore.contacts
    .filter(contact => contact.status === 'ACCEPTED')
    .map(contact => ({
      referenceId: contact.contactUser.referenceId,
      name: contact.contactUser.name,
      email: contact.contactUser.email,
      photo: contact.contactUser.photo
    }))
})

onMounted(async () => {
  // Load contacts if not already loaded
  if (!userStore.contacts && userStore.user?.referenceId) {
    loading.value = true
    try {
      await userStore.getContactsForUser(userStore.user.referenceId)
    } catch (error) {
      console.error('Error loading contacts:', error)
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
</style>
