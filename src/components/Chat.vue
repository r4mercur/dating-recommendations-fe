<script setup>
import {computed, nextTick, onBeforeUnmount, ref, watch} from 'vue'
import {MESSAGE_MAX_LENGTH, useChatStore} from '@/stores/chat.js'
import defaultAvatar from '@/assets/avatar.jpg'
import {formatDay, formatMessageTime} from '@/utils/time.js'

const props = defineProps({
  matchId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['back'])

const chatStore = useChatStore()
const newMessage = ref('')
const sending = ref(false)
const error = ref(null)
const messagesContainer = ref(null)
const messagesList = ref(null)
const input = ref(null)

const conversation = computed(() => chatStore.conversations.find(c => c.matchReferenceId === props.matchId) ?? null)
const thread = computed(() => chatStore.thread(props.matchId))
const ended = computed(() => chatStore.ended.includes(props.matchId))
const myId = computed(() => chatStore.myReferenceId)

/** messages with a day separator before the first message of each day */
const entries = computed(() => {
  let lastDay = null
  return thread.value.items.flatMap(message => {
    const day = new Date(message.createdAt).toDateString()
    const separator = day !== lastDay ? [{type: 'day', key: `day-${day}`, label: formatDay(message.createdAt)}] : []
    lastDay = day
    return [...separator, {type: 'message', key: message.referenceId, message}]
  })
})

/** my newest message, it shows whether it was read */
const lastOwnMessageId = computed(() => [...thread.value.items].reverse()
    .find(message => message.senderReferenceId === myId.value)?.referenceId)

/** true while the reader is at the newest messages: then the view stays at the bottom */
let pinned = true

function isNearBottom() {
  const el = messagesContainer.value
  return !el || el.scrollHeight - el.scrollTop - el.clientHeight < 120
}

function scrollToBottom() {
  nextTick(() => {
    const el = messagesContainer.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

async function onScroll() {
  pinned = isNearBottom()
  const el = messagesContainer.value
  if (!el || el.scrollTop > 80 || !thread.value.hasMore || thread.value.loading) return
  // keep the visible message in place while older ones are added above
  const fromBottom = el.scrollHeight - el.scrollTop
  await chatStore.loadOlder(props.matchId)
  await nextTick()
  el.scrollTop = el.scrollHeight - fromBottom
}

async function sendMessage() {
  const content = newMessage.value.trim()
  if (!content || sending.value || ended.value) return
  sending.value = true
  error.value = null
  try {
    await chatStore.send(props.matchId, content)
    newMessage.value = ''
    scrollToBottom()
  } catch (e) {
    error.value = e.status === 404 ? 'This chat is no longer available.' : `Couldn't send your message: ${e.message}`
  } finally {
    sending.value = false
    nextTick(() => input.value?.focus())
  }
}

function onKeydown(event) {
  // Enter sends, Shift+Enter adds a line break
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault()
    sendMessage()
  }
}

watch(() => props.matchId, async (matchId) => {
  newMessage.value = ''
  error.value = null
  pinned = true
  await chatStore.open(matchId)
  if (!matchId) return
  scrollToBottom()
  input.value?.focus()
}, {immediate: true})

// follow new messages, but don't yank the view away while reading older ones
watch(() => thread.value.items.at(-1)?.referenceId, (last, previous) => {
  if (!last || last === previous) return
  const mine = thread.value.items.at(-1).senderReferenceId === myId.value
  if (mine || pinned) scrollToBottom()
})

// the visible area shrinks (header or error appears) or the content grows (hints, read state):
// stay at the bottom if the reader was there
const resizeObserver = new ResizeObserver(() => {
  const el = messagesContainer.value
  if (el && pinned) el.scrollTop = el.scrollHeight
})
watch([messagesContainer, messagesList], (elements, previous = []) => {
  previous.filter(Boolean).forEach(el => resizeObserver.unobserve(el))
  elements.filter(Boolean).forEach(el => resizeObserver.observe(el))
}, {immediate: true, flush: 'post'})
onBeforeUnmount(() => resizeObserver.disconnect())
</script>

<template>
  <div class="chat-container">
    <div v-if="!matchId" class="no-chat-selected">
      <i class="icon icon-comments" aria-hidden="true"></i>
      <h3>Select a chat</h3>
      <p>Pick one of your matches on the left to start talking.</p>
    </div>

    <template v-else>
      <div class="chat-header">
        <button type="button" class="back-button" aria-label="Back to chats" @click="emit('back')">
          <i class="icon icon-arrow-left" aria-hidden="true"></i>
        </button>
        <div v-if="conversation" class="chat-header-info">
          <div class="chat-avatar-container">
            <img :src="conversation.user.photo || defaultAvatar" :alt="conversation.user.name" class="chat-header-avatar"/>
            <div v-if="conversation.user.online" class="online-indicator"></div>
          </div>
          <div>
            <h3 class="chat-header-name">{{ conversation.user.name }}</h3>
            <p class="chat-header-status">{{ conversation.user.online ? 'Online' : 'Offline' }}</p>
          </div>
        </div>
        <h3 v-else class="chat-header-name">Chat</h3>
      </div>

      <div class="messages-container" ref="messagesContainer" @scroll.passive="onScroll" aria-live="polite">
        <div class="messages-list" ref="messagesList">
          <p v-if="thread.loading && !thread.items.length" class="thread-state">
            <i class="icon icon-spin icon-spinner" aria-hidden="true"></i> Loading messages…
          </p>
          <p v-else-if="thread.hasMore" class="thread-state small">
            <i v-if="thread.loading" class="icon icon-spin icon-spinner" aria-hidden="true"></i>
            {{ thread.loading ? 'Loading earlier messages…' : 'Scroll up for earlier messages' }}
          </p>
          <div v-if="!thread.loading && !thread.items.length && conversation" class="thread-empty">
            <i class="icon icon-heart-fill" aria-hidden="true"></i>
            <p>You matched with {{ conversation.user.name }}. Say hi!</p>
          </div>

          <template v-for="entry in entries" :key="entry.key">
            <div v-if="entry.type === 'day'" class="day-separator"><span>{{ entry.label }}</span></div>
            <div v-else :class="['message', entry.message.senderReferenceId === myId ? 'me' : 'other']">
              <div class="message-content">
                <p>{{ entry.message.content }}</p>
                <span class="message-time">
                  {{ formatMessageTime(entry.message.createdAt) }}
                  <template v-if="entry.message.referenceId === lastOwnMessageId">
                    · {{ entry.message.readAt ? 'Read' : 'Sent' }}
                  </template>
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <p v-if="ended" class="ended">This chat has ended. You can't send messages here anymore.</p>
      <form v-else class="message-input-container" @submit.prevent="sendMessage">
        <p v-if="error" class="send-error" role="alert">{{ error }}</p>
        <div class="message-input">
          <textarea
              ref="input"
              v-model="newMessage"
              rows="1"
              :maxlength="MESSAGE_MAX_LENGTH"
              placeholder="Write a message…"
              aria-label="Message"
              class="message-text-input"
              @keydown="onKeydown"
          ></textarea>
          <span v-if="newMessage.length > MESSAGE_MAX_LENGTH - 200" class="counter">
            {{ newMessage.length }}/{{ MESSAGE_MAX_LENGTH }}
          </span>
          <button type="submit" class="send-button" :disabled="!newMessage.trim() || sending" aria-label="Send">
            <i :class="['icon', sending ? 'icon-spin icon-spinner' : 'icon-send']" aria-hidden="true"></i>
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<style scoped>
.chat-container {
  height: 100%;
  min-height: 0;
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
  color: #8c959f;
}

.no-chat-selected i {
  font-size: 4rem;
  margin-bottom: 16px;
  color: #656d76;
}

.no-chat-selected h3 {
  margin: 0 0 8px 0;
  color: rgba(235, 235, 235, 0.8);
}

.no-chat-selected p {
  margin: 0;
  font-size: 14px;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 0 16px;
  border-bottom: 1px solid #34495e;
}

.back-button {
  display: none;
  width: 40px;
  height: 40px;
  border: 1px solid #34495e;
  border-radius: 50%;
  color: rgba(235, 235, 235, 0.8);
  background: none;
  cursor: pointer;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.chat-avatar-container {
  position: relative;
  flex-shrink: 0;
}

.chat-header-avatar {
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

.chat-header-name {
  margin: 0 0 2px 0;
  font-size: 18px;
  font-weight: 600;
  color: rgba(235, 235, 235, 0.9);
}

.chat-header-status {
  margin: 0;
  font-size: 13px;
  color: #8c959f;
}

.messages-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 4px;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 100%;
}

.thread-state {
  margin: 0;
  text-align: center;
  color: #8c959f;
}

.thread-state.small {
  font-size: 12px;
}

.thread-empty {
  margin: auto;
  text-align: center;
  color: #ffcc80;
}

.thread-empty i {
  font-size: 28px;
  color: #ff4d79;
}

.day-separator {
  display: flex;
  justify-content: center;
  margin: 8px 0;
}

.day-separator span {
  padding: 2px 12px;
  border-radius: 10px;
  font-size: 12px;
  color: #b0bec5;
  background: #22313f;
}

.message {
  display: flex;
}

.message.me {
  justify-content: flex-end;
}

.message-content {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 16px;
}

.message.me .message-content {
  background: linear-gradient(135deg, #ffb74d, #ffa726);
  color: #2c1a00;
  border-bottom-right-radius: 4px;
}

.message.other .message-content {
  background: linear-gradient(145deg, #34495e, #2c3e50);
  color: rgba(235, 235, 235, 0.9);
  border-bottom-left-radius: 4px;
}

.message-content p {
  margin: 0 0 4px 0;
  line-height: 1.4;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.message-time {
  font-size: 11px;
  opacity: 0.75;
}

.ended {
  margin: 0;
  padding: 16px 0 0;
  border-top: 1px solid #34495e;
  text-align: center;
  color: #8c959f;
}

.message-input-container {
  border-top: 1px solid #34495e;
  padding: 16px 0 0;
}

.send-error {
  margin: 0 0 8px;
  font-size: 13px;
  color: #f7a1a1;
}

.message-input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: linear-gradient(145deg, #34495e, #2c3e50);
  border: 1px solid #34495e;
  border-radius: 24px;
  padding: 6px 6px 6px 16px;
}

.message-input:focus-within {
  border-color: #ffa726;
}

.message-text-input {
  flex: 1;
  min-height: 24px;
  max-height: 140px;
  padding: 8px 0;
  border: none;
  outline: none;
  resize: none;
  font: inherit;
  font-size: 15px;
  line-height: 1.4;
  color: rgba(235, 235, 235, 0.9);
  background: none;
  field-sizing: content;
}

.message-text-input::placeholder {
  color: #8c959f;
}

.counter {
  align-self: center;
  font-size: 12px;
  color: #fac775;
}

.send-button {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  color: white;
  background: linear-gradient(135deg, #ffb74d, #ffa726);
  cursor: pointer;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .back-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .message-content {
    max-width: 85%;
  }
}
</style>
