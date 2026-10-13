<script setup>
import {computed} from 'vue'
import {useChatStore} from '@/stores/chat.js'
import defaultAvatar from '@/assets/avatar.jpg'
import {formatChatTime} from '@/utils/time.js'

defineProps({
  activeMatchId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['select'])

const chatStore = useChatStore()
const conversations = computed(() => chatStore.conversations)

function preview(conversation) {
  const message = conversation.lastMessage
  if (!message) return 'New match. Say hi!'
  return message.senderReferenceId === chatStore.myReferenceId ? `You: ${message.content}` : message.content
}
</script>

<template>
  <div class="chat-menu">
    <div class="chat-menu-header">
      <h2>Chats</h2>
      <span v-if="!chatStore.connected && chatStore.loaded" class="offline" title="Reconnecting…">
        <i class="icon icon-spin icon-spinner" aria-hidden="true"></i> Reconnecting
      </span>
    </div>

    <p v-if="!chatStore.loaded" class="state"><i class="icon icon-spin icon-spinner" aria-hidden="true"></i> Loading chats…</p>

    <div v-else-if="!conversations.length" class="state empty">
      <i class="icon icon-heart" aria-hidden="true"></i>
      <p>No chats yet. When you match with someone, your chat shows up here.</p>
      <router-link to="/matches" class="discover-link">Discover people</router-link>
    </div>

    <ul v-else class="chat-list">
      <li v-for="conversation in conversations" :key="conversation.matchReferenceId">
        <button
            type="button"
            :class="['chat-item', {active: activeMatchId === conversation.matchReferenceId, unread: conversation.unreadCount > 0}]"
            :aria-current="activeMatchId === conversation.matchReferenceId ? 'true' : undefined"
            @click="emit('select', conversation.matchReferenceId)"
        >
          <span class="chat-avatar-container">
            <img :src="conversation.user.photo || defaultAvatar" :alt="conversation.user.name" class="chat-avatar"/>
            <span v-if="conversation.user.online" class="online-indicator" title="Online"></span>
          </span>

          <span class="chat-content">
            <span class="chat-header">
              <span class="chat-name">{{ conversation.user.name }}</span>
              <span class="chat-time">
                {{ formatChatTime(conversation.lastMessage?.createdAt ?? conversation.matchedAt) }}
              </span>
            </span>
            <span class="chat-preview">
              <span class="last-message" :class="{fresh: !conversation.lastMessage}">{{ preview(conversation) }}</span>
              <span v-if="conversation.unreadCount > 0" class="unread-badge"
                    :aria-label="`${conversation.unreadCount} unread`">{{ conversation.unreadCount }}</span>
            </span>
          </span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.chat-menu {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chat-menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 16px;
  border-bottom: 1px solid #34495e;
  margin-bottom: 12px;
}

.chat-menu-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: rgba(235, 235, 235, 0.8);
}

.offline {
  font-size: 12px;
  color: #fac775;
}

.state {
  margin: 0;
  padding: 24px 8px;
  text-align: center;
  color: rgba(235, 235, 235, 0.55);
}

.state.empty i {
  font-size: 32px;
  color: rgba(235, 235, 235, 0.3);
}

.state.empty p {
  margin: 12px 0 16px;
  font-size: 14px;
}

.discover-link {
  display: inline-block;
  padding: 8px 18px;
  border: 1px solid #ffa726;
  border-radius: 18px;
  color: #ffa726;
  text-decoration: none;
}

.chat-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chat-item {
  display: flex;
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid transparent;
  text-align: left;
  font: inherit;
  color: inherit;
  background: none;
  cursor: pointer;
  transition: background-color .2s, border-color .2s;
}

.chat-item:hover {
  background: rgba(52, 73, 94, 0.3);
  border-color: #34495e;
}

.chat-item:focus-visible {
  outline: 2px solid #ffa726;
  outline-offset: 2px;
}

.chat-item.active {
  background: linear-gradient(145deg, #34495e, #2c3e50);
  border-color: #ffa726;
}

.chat-avatar-container {
  position: relative;
  flex-shrink: 0;
  margin-right: 12px;
}

.chat-avatar {
  display: block;
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
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex: 1;
  min-width: 0;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.chat-name {
  font-size: 16px;
  font-weight: 600;
  color: rgba(235, 235, 235, 0.85);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-time {
  flex-shrink: 0;
  font-size: 12px;
  color: #8c959f;
}

.chat-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  flex: 1;
  font-size: 14px;
  color: #8c959f;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.last-message.fresh {
  color: #ffcc80;
}

.chat-item.unread .last-message {
  color: rgba(235, 235, 235, 0.9);
  font-weight: 600;
}

.unread-badge {
  flex-shrink: 0;
  min-width: 20px;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  color: white;
  background: #ef5350;
}
</style>
