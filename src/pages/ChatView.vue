<script setup>
import {ref} from 'vue'
import ChatMenu from '@/components/ChatMenu.vue'
import Chat from '@/components/Chat.vue'
import ChatModal from "@/components/modal/ChatModal.vue";

const selectedChat = ref(null)
const showNewChatModal = ref(false)

const handleChatSelected = (chat) => {
  selectedChat.value = chat
}
const handleNewChat = () => {
  selectedChat.value = null

  // show new chat modal
  showNewChatModal.value = true
}
</script>

<template>
  <div class="chat-view-container">
    <div class="chat-sidebar">
      <ChatMenu
        :selectedChatId="selectedChat?.id"
        @chat-selected="handleChatSelected"
        @new-chat="handleNewChat"
      />
    </div>

    <div class="chat-content">
      <Chat :selectedChat="selectedChat" />
    </div>

    <ChatModal v-if="showNewChatModal" @close="showNewChatModal = false" />
  </div>
</template>

<style scoped>
.chat-view-container {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  gap: 30px;
  min-height: calc(100vh - 200px);
}

.chat-sidebar {
  flex: 0 0 350px;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #34495e;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  height: fit-content;
  max-height: calc(100vh - 260px);
  position: sticky;
  top: 30px;
  overflow: hidden;
}

.chat-content {
  flex: 1;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #34495e;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  min-height: calc(100vh - 260px);
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .chat-view-container {
    flex-direction: column;
    padding: 20px;
    gap: 20px;
  }

  .chat-sidebar {
    flex: none;
    position: static;
    max-height: 300px;
  }

  .chat-content {
    min-height: calc(100vh - 400px);
  }
}
</style>