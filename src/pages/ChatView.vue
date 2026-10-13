<script setup>
import {computed, onBeforeUnmount, onMounted} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import ChatMenu from '@/components/ChatMenu.vue'
import Chat from '@/components/Chat.vue'
import {useChatStore} from '@/stores/chat.js'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()

/** the open chat lives in the URL (/messages/:matchId), so links like "Send a message" can open it directly */
const activeMatchId = computed(() => route.params.matchId || null)

function select(matchId) {
  router.push({name: 'messages', params: {matchId}})
}

function back() {
  chatStore.activeMatchId = null
  router.push({name: 'messages'})
}

onMounted(() => {
  if (!chatStore.loaded) chatStore.loadConversations()
})

// no chat is open anymore: new messages count as unread instead of being marked read right away
onBeforeUnmount(() => {
  chatStore.activeMatchId = null
})
</script>

<template>
  <div class="chat-view-container" :class="{'has-active': activeMatchId}">
    <div class="chat-sidebar">
      <ChatMenu :activeMatchId="activeMatchId" @select="select"/>
    </div>

    <div class="chat-content">
      <Chat :matchId="activeMatchId" @back="back"/>
    </div>
  </div>
</template>

<style scoped>
.chat-view-container {
  display: flex;
  max-width: 1200px;
  height: calc(100vh - 140px);
  margin: 0 auto;
  padding: 30px;
  gap: 30px;
}

.chat-sidebar,
.chat-content {
  min-height: 0;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid #34495e;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.chat-sidebar {
  flex: 0 0 350px;
  display: flex;
  flex-direction: column;
}

.chat-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* phones: either the list or the open chat */
@media (max-width: 768px) {
  .chat-view-container {
    height: calc(100vh - 110px);
    padding: 16px;
  }

  .chat-sidebar {
    flex: 1;
  }

  .chat-content {
    display: none;
    padding: 16px;
  }

  .has-active .chat-sidebar {
    display: none;
  }

  .has-active .chat-content {
    display: flex;
  }
}
</style>
