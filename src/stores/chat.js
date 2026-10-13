import {defineStore} from "pinia";
import {Client} from "@stomp/stompjs";
import {apiFetch} from "@/api.js";

const PAGE_SIZE = 30;
export const MESSAGE_MAX_LENGTH = 2000;

/** the STOMP client lives outside the reactive state */
let client = null;

/** timestamps come with a varying number of fraction digits, so compare them as dates, not as strings */
function time(value) {
    return Date.parse(value);
}

function brokerUrl() {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}/ws`;
}

/**
 * Chats (roadmap phase 4): a conversation is an active match. History, sending and read state go over REST,
 * new messages, read receipts and new or ended matches arrive in real time over STOMP (/ws).
 */
export const useChatStore = defineStore('chat', {
    state: () => ({
        conversations: [],
        loaded: false,
        /** matchReferenceId -> {items, hasMore, loading} */
        threads: {},
        activeMatchId: null,
        /** matches that ended while their chat was loaded, e.g. unmatch or block */
        ended: [],
        connected: false,
        myReferenceId: null,
    }),
    getters: {
        unreadTotal: (state) => state.conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
        activeConversation: (state) => state.conversations.find(c => c.matchReferenceId === state.activeMatchId) ?? null,
        thread: (state) => (matchReferenceId) => state.threads[matchReferenceId] ?? {items: [], hasMore: false, loading: false},
    },
    actions: {
        /** Connects once after login; reconnects on its own and catches up on everything missed meanwhile. */
        /**
         * @param getToken returns a valid access token (refreshed if needed); asked before every (re)connect,
         *                 so an automatic reconnect after hours offline doesn't use an expired token
         */
        connect(getToken, myReferenceId) {
            this.myReferenceId = myReferenceId;
            if (client) client.deactivate();
            client = new Client({
                brokerURL: brokerUrl(),
                reconnectDelay: 5000,
                beforeConnect: async () => {
                    client.connectHeaders = {Authorization: `Bearer ${await getToken()}`};
                },
                onConnect: () => {
                    this.connected = true;
                    client.subscribe('/user/queue/messages', frame => this.receiveMessage(JSON.parse(frame.body)));
                    client.subscribe('/user/queue/read-receipts', frame => this.receiveReadReceipt(JSON.parse(frame.body)));
                    client.subscribe('/user/queue/conversations', frame => this.receiveConversationEvent(JSON.parse(frame.body)));
                    client.subscribe('/user/queue/errors', frame => console.warn('Chat error:', frame.body));
                    // pushes missed while offline are not replayed
                    this.loadConversations();
                    if (this.activeMatchId) this.loadMessages(this.activeMatchId);
                },
                onWebSocketClose: () => {
                    this.connected = false;
                },
                onStompError: frame => console.warn('Chat connection error:', frame.headers.message),
            });
            client.activate();
        },
        disconnect() {
            client?.deactivate();
            client = null;
            this.$reset();
        },

        async loadConversations() {
            try {
                this.conversations = await apiFetch('/api/me/conversations');
                this.loaded = true;
                // the list may have been requested before the open chat was marked as read
                const open = this.conversations.find(c => c.matchReferenceId === this.activeMatchId);
                if (open?.unreadCount) this.markRead(open.matchReferenceId);
            } catch (error) {
                console.error('Error loading conversations:', error);
            }
        },
        /** Opens a chat: loads the newest messages and marks them as read. */
        async open(matchReferenceId) {
            this.activeMatchId = matchReferenceId;
            if (!matchReferenceId) return;
            await this.loadMessages(matchReferenceId);
            this.markRead(matchReferenceId);
        },
        async loadMessages(matchReferenceId) {
            this.threads[matchReferenceId] ??= {items: [], hasMore: false, loading: false};
            // read it back: the store hands out the reactive proxy, the assigned object itself is not tracked
            const thread = this.threads[matchReferenceId];
            thread.loading = true;
            try {
                const page = await apiFetch(`/api/me/conversations/${encodeURIComponent(matchReferenceId)}/messages?size=${PAGE_SIZE}`);
                thread.items = page.items;
                thread.hasMore = page.hasMore;
            } finally {
                thread.loading = false;
            }
        },
        async loadOlder(matchReferenceId) {
            const thread = this.threads[matchReferenceId];
            if (!thread || thread.loading || !thread.hasMore || !thread.items.length) return;
            thread.loading = true;
            try {
                const before = encodeURIComponent(thread.items[0].referenceId);
                const page = await apiFetch(`/api/me/conversations/${encodeURIComponent(matchReferenceId)}/messages?size=${PAGE_SIZE}&before=${before}`);
                const known = new Set(thread.items.map(message => message.referenceId));
                thread.items = [...page.items.filter(message => !known.has(message.referenceId)), ...thread.items];
                thread.hasMore = page.hasMore;
            } finally {
                thread.loading = false;
            }
        },
        /** Sends over REST (clear errors); the push over STOMP then reaches both participants and other tabs. */
        async send(matchReferenceId, content) {
            const message = await apiFetch(`/api/me/conversations/${encodeURIComponent(matchReferenceId)}/messages`, {
                method: 'POST',
                body: JSON.stringify({content})
            });
            this.receiveMessage(message);
            return message;
        },
        /** Always tells the backend: a message that arrives in the open chat never raised the local counter. */
        async markRead(matchReferenceId) {
            const conversation = this.conversations.find(c => c.matchReferenceId === matchReferenceId);
            if (conversation) conversation.unreadCount = 0;
            try {
                await apiFetch(`/api/me/conversations/${encodeURIComponent(matchReferenceId)}/read`, {method: 'POST'});
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        },

        receiveMessage(message) {
            const thread = this.threads[message.matchReferenceId];
            if (thread && !thread.items.some(existing => existing.referenceId === message.referenceId)) {
                thread.items = [...thread.items, message];
            }

            const conversation = this.conversations.find(c => c.matchReferenceId === message.matchReferenceId);
            if (!conversation) {
                this.loadConversations();
                return;
            }
            const isNewest = !conversation.lastMessage || time(conversation.lastMessage.createdAt) <= time(message.createdAt);
            if (isNewest && conversation.lastMessage?.referenceId !== message.referenceId) {
                conversation.lastMessage = message;
                const fromOther = message.senderReferenceId !== this.myReferenceId;
                if (fromOther && message.matchReferenceId === this.activeMatchId && document.visibilityState === 'visible') {
                    this.markRead(message.matchReferenceId);
                } else if (fromOther) {
                    conversation.unreadCount += 1;
                }
            }
            // most recent activity first
            this.conversations = [conversation, ...this.conversations.filter(c => c !== conversation)];
        },
        /** The other person read my messages up to readAt. */
        receiveReadReceipt({matchReferenceId, readerReferenceId, readAt}) {
            if (readerReferenceId === this.myReferenceId) return;
            const thread = this.threads[matchReferenceId];
            if (!thread) return;
            thread.items = thread.items.map(message =>
                message.senderReferenceId === this.myReferenceId && !message.readAt && time(message.createdAt) <= time(readAt)
                    ? {...message, readAt}
                    : message);
        },
        receiveConversationEvent({type, matchReferenceId}) {
            if (type === 'ENDED') {
                this.conversations = this.conversations.filter(c => c.matchReferenceId !== matchReferenceId);
                if (!this.ended.includes(matchReferenceId)) this.ended.push(matchReferenceId);
            } else {
                this.loadConversations();
            }
        },
    }
});
