import {readonly, ref} from 'vue'

/** short messages in the corner of the screen, rendered by ToastHost */
const toasts = ref([])
let nextId = 0

function remove(id) {
    toasts.value = toasts.value.filter(toast => toast.id !== id)
}

/**
 * @param {{severity?: 'success'|'info'|'warn'|'error', summary: string, detail?: string, life?: number}} message
 *        life: milliseconds until the toast disappears, 0 keeps it until it is closed
 */
function add({severity = 'info', summary, detail = null, life = 3000}) {
    const id = nextId++;
    toasts.value = [...toasts.value, {id, severity, summary, detail}];
    if (life > 0) setTimeout(() => remove(id), life);
    return id;
}

export function useToast() {
    return {add, remove, toasts: readonly(toasts)};
}
