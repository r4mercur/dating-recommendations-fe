<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/stores/chat.js'

defineProps({
  selectedChatId: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['chat-selected'])

const chatStore = useChatStore()

// mocking data
const chats = computed(() => {
  return chatStore.chats.length > 0 ? chatStore.chats : [
    {
      id: 1,
      name: 'Sarah Weber',
      avatar: '/src/assets/avatar.jpg',
      lastMessage: 'Hast du Lust auf einen Kaffee? ☕',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
      unreadCount: 2,
      isOnline: true
    },
    {
      id: 2,
      name: 'Julia Schmidt',
      avatar: '/src/assets/avatar.jpg',
      lastMessage: 'Das war ein toller Abend! 😊',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      unreadCount: 0,
      isOnline: false
    },
    {
      id: 3,
      name: 'Lisa Müller',
      avatar: '/src/assets/avatar.jpg',
      lastMessage: 'Bis später! 👋',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      unreadCount: 1,
      isOnline: true
    }
  ]
})

const selectChat = (chat) => {
  emit('chat-selected', chat)
}

const formatTime = (timestamp) => {
  const now = new Date()
  const diff = now - timestamp

  if (diff < 60 * 1000) return 'Jetzt'
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))} min`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))} h`

  return timestamp.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}
</script>

<template>
  <div class="chat-menu">
    <div class="chat-menu-header">
      <h2>Chats</h2>
      <button class="new-chat-button">
        <i class="pi pi-plus"></i>
      </button>
    </div>

    <div class="chat-list">
      <div
        v-for="chat in chats"
        :key="chat.id"
        :class="['chat-item', { active: selectedChatId === chat.id }]"
        @click="selectChat(chat)"
      >
        <div class="chat-avatar-container">
          <img :src="chat.avatar" :alt="chat.name" class="chat-avatar" />
          <div v-if="chat.isOnline" class="online-indicator"></div>
        </div>

        <div class="chat-content">
          <div class="chat-header">
            <h3 class="chat-name">{{ chat.name }}</h3>
            <span class="chat-time">{{ formatTime(chat.timestamp) }}</span>
          </div>
          <div class="chat-preview">
            <p class="last-message">{{ chat.lastMessage }}</p>
            <div v-if="chat.unreadCount > 0" class="unread-badge">
              {{ chat.unreadCount }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chat-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #34495e;
  margin-bottom: 16px;
}

.chat-menu-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: rgba(235, 235, 235, 0.64);
}

.new-chat-button {
  width: 36px;
  height: 36px;
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

.new-chat-button:hover {
  background: linear-gradient(135deg, #ffb74d, #ffa726);
  border-color: #ffa726;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-item {
  display: flex;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.chat-item:hover {
  background: rgba(52, 73, 94, 0.3);
  border-color: #34495e;
}

.chat-item.active {
  background: linear-gradient(145deg, #34495e, #2c3e50);
  border-color: #ffa726;
}

.chat-avatar-container {
  position: relative;
  margin-right: 12px;
}

.chat-avatar {
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

.chat-content {
  flex: 1;
  min-width: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.chat-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: rgba(235, 235, 235, 0.64);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-time {
  font-size: 12px;
  color: #656d76;
  white-space: nowrap;
}

.chat-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  font-size: 14px;
  color: #656d76;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.unread-badge {
  background: #ef5350;
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
  margin-left: 8px;
}
</style>