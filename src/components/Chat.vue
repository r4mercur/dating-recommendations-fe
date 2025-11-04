<script setup>
import { ref, computed, nextTick, watch } from 'vue'

const props = defineProps({
  selectedChat: {
    type: Object,
    default: null
  }
})
const newMessage = ref('')
const messagesContainer = ref(null)

const messages = computed(() => {
  if (!props.selectedChat) return []

  // mocking data
  const mockMessages = {
    1: [
      {
        id: 1,
        text: 'Hey! Wie geht es dir denn so? 😊',
        sender: 'other',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        senderName: props.selectedChat.name
      },
      {
        id: 2,
        text: 'Hi Sarah! Mir geht es super, danke der Nachfrage! Und dir?',
        sender: 'me',
        timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        senderName: 'Ich'
      },
      {
        id: 3,
        text: 'Auch sehr gut! Hast du Lust auf einen Kaffee? ☕',
        sender: 'other',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        senderName: props.selectedChat.name
      }
    ],
    2: [
      {
        id: 1,
        text: 'Der Abend gestern war wirklich toll! 🌟',
        sender: 'me',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        senderName: 'Ich'
      },
      {
        id: 2,
        text: 'Das war ein toller Abend! 😊',
        sender: 'other',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        senderName: props.selectedChat.name
      }
    ],
    3: [
      {
        id: 1,
        text: 'Wir sehen uns später! 👋',
        sender: 'me',
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000),
        senderName: 'Ich'
      },
      {
        id: 2,
        text: 'Bis später! 👋',
        sender: 'other',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
        senderName: props.selectedChat.name
      }
    ]
  }

  return mockMessages[props.selectedChat.id] || []
})

const sendMessage = () => {
  if (!newMessage.value.trim()) return

  // send message to messaging service here
  console.log('Message sending:', newMessage.value)
  newMessage.value = ''
}

const formatMessageTime = (timestamp) => {
  return timestamp.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// scroll to bottom when chat changes or new message arrives
watch(() => props.selectedChat, () => {
  scrollToBottom()
}, { immediate: true })

watch(messages, () => {
  scrollToBottom()
})
</script>

<template>
  <div class="chat-container">
    <div v-if="!selectedChat" class="no-chat-selected">
      <i class="pi pi-comments" style="font-size: 4rem; color: #656d76; margin-bottom: 16px;"></i>
      <h3>Select a chat</h3>
      <p>Select one of your chat links to start the conversation.</p>
    </div>

    <template v-else>
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="chat-avatar-container">
            <img :src="selectedChat.avatar" :alt="selectedChat.name" class="chat-header-avatar" />
            <div v-if="selectedChat.isOnline" class="online-indicator"></div>
          </div>
          <div>
            <h3 class="chat-header-name">{{ selectedChat.name }}</h3>
            <p class="chat-header-status">
              {{ selectedChat.isOnline ? 'Online' : 'Last online a while ago' }}
            </p>
          </div>
        </div>

        <div class="chat-actions">
          <button class="action-button">
            <i class="pi pi-phone"></i>
          </button>
          <button class="action-button">
            <i class="pi pi-video"></i>
          </button>
          <button class="action-button">
            <i class="pi pi-ellipsis-v"></i>
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="messages-container" ref="messagesContainer">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="['message', message.sender]"
        >
          <div class="message-content">
            <p>{{ message.text }}</p>
            <span class="message-time">{{ formatMessageTime(message.timestamp) }}</span>
          </div>
        </div>
      </div>

      <!-- Message Input -->
      <div class="message-input-container">
        <div class="message-input">
          <button class="attach-button">
            <i class="pi pi-paperclip"></i>
          </button>

          <input
            v-model="newMessage"
            type="text"
            placeholder="Write a message..."
            @keydown.enter="sendMessage"
            class="message-text-input"
          />

          <button class="emoji-button">
            <i class="pi pi-face-smile"></i>
          </button>

          <button
            class="send-button"
            @click="sendMessage"
            :disabled="!newMessage.trim()"
          >
            <i class="pi pi-send"></i>
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.chat-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.no-chat-selected {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #656d76;
}

.no-chat-selected h3 {
  margin: 0 0 8px 0;
  color: rgba(235, 235, 235, 0.64);
}

.no-chat-selected p {
  margin: 0;
  font-size: 14px;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #34495e;
  margin-bottom: 16px;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-avatar-container {
  position: relative;
}

.chat-header-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #66bb6a;
  border: 2px solid #2c3e50;
  border-radius: 50%;
}

.chat-header-name {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: rgba(235, 235, 235, 0.64);
}

.chat-header-status {
  margin: 0;
  font-size: 14px;
  color: #656d76;
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.action-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(145deg, #34495e, #2c3e50);
  border: 1px solid #34495e;
  color: rgba(235, 235, 235, 0.64);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-button:hover {
  background: linear-gradient(135deg, #ffb74d, #ffa726);
  border-color: #ffa726;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
}

.message.me {
  justify-content: flex-end;
}

.message.other {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 16px;
  position: relative;
}

.message.me .message-content {
  background: linear-gradient(135deg, #ffb74d, #ffa726);
  color: white;
  border-bottom-right-radius: 4px;
}

.message.other .message-content {
  background: linear-gradient(145deg, #34495e, #2c3e50);
  color: rgba(235, 235, 235, 0.64);
  border-bottom-left-radius: 4px;
}

.message-content p {
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
}

.message-input-container {
  border-top: 1px solid #34495e;
  padding: 16px 0;
}

.message-input {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(145deg, #34495e, #2c3e50);
  border: 1px solid #34495e;
  border-radius: 24px;
  padding: 8px 16px;
}

.attach-button,
.emoji-button {
  background: none;
  border: none;
  color: rgba(235, 235, 235, 0.64);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
}

.attach-button:hover,
.emoji-button:hover {
  background: rgba(255, 183, 77, 0.1);
  color: #ffa726;
}

.message-text-input {
  flex: 1;
  background: none;
  border: none;
  color: rgba(235, 235, 235, 0.64);
  font-size: 16px;
  outline: none;
  padding: 8px;
}

.message-text-input::placeholder {
  color: #656d76;
}

.send-button {
  background: linear-gradient(135deg, #ffb74d, #ffa726);
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 50%;
  transition: all 0.2s;
}

.send-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffa726, #ff9800);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>