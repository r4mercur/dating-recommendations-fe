const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Short relative time for lists: "now", "5 min", "3 h", "Yesterday", "Mon", "12.03." */
export function formatChatTime(value) {
    if (!value) return '';
    const date = new Date(value);
    const diff = Date.now() - date.getTime();
    if (diff < MINUTE) return 'now';
    if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min`;
    if (diff < DAY && date.getDate() === new Date().getDate()) return `${Math.floor(diff / HOUR)} h`;
    if (diff < 2 * DAY) return 'Yesterday';
    if (diff < 7 * DAY) return date.toLocaleDateString('en-GB', {weekday: 'short'});
    return date.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit'});
}

export function formatMessageTime(value) {
    return new Date(value).toLocaleTimeString('de-DE', {hour: '2-digit', minute: '2-digit'});
}

/** Day separator in a conversation: "Today", "Yesterday" or the date. */
export function formatDay(value) {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date(today.getTime() - DAY);
    const sameDay = (a, b) => a.toDateString() === b.toDateString();
    if (sameDay(date, today)) return 'Today';
    if (sameDay(date, yesterday)) return 'Yesterday';
    return date.toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'long'});
}
