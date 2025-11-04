import {defineStore} from "pinia";
import {router} from "@/router.js";

export const useChatStore = defineStore('chat', {
    state: () => {
        return {
            chats: [],
            activeChat: null
        }
    },
    actions: {}
})