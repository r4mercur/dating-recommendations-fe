import {onBeforeUnmount, ref, watch} from 'vue';
import {apiFetch} from '@/api.js';

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

/**
 * Debounced search against an external catalog proxied by the backend (/api/music/search, /api/games/search).
 * The backend caches results, so searching while typing is fine. A 503 means the external service is
 * unavailable: `error` then holds the backend's message.
 */
export function useCatalogSearch(path, {debounce = 300} = {}) {
    const query = ref('');
    const results = ref([]);
    const loading = ref(false);
    const error = ref(null);
    let timer = null;
    let latest = 0;

    async function run(value) {
        const request = ++latest;
        loading.value = true;
        try {
            const found = await apiFetch(`${path}?q=${encodeURIComponent(value)}`);
            if (request === latest) {
                results.value = found;
                error.value = null;
            }
        } catch (e) {
            if (request === latest) {
                results.value = [];
                error.value = e.message;
            }
        } finally {
            if (request === latest) loading.value = false;
        }
    }

    watch(query, (value) => {
        clearTimeout(timer);
        const trimmed = value.trim().slice(0, MAX_QUERY_LENGTH);
        if (trimmed.length < MIN_QUERY_LENGTH) {
            latest++;
            results.value = [];
            loading.value = false;
            return;
        }
        timer = setTimeout(() => run(trimmed), debounce);
    });

    onBeforeUnmount(() => clearTimeout(timer));

    function reset() {
        query.value = '';
        results.value = [];
        error.value = null;
    }

    return {query, results, loading, error, reset};
}
