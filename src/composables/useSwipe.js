import {ref} from 'vue';

/**
 * Horizontal swipe on an element. Vertical movement is left to the browser so the page keeps scrolling
 * (the element needs `touch-action: pan-y`).
 *
 * @param onSwipe called with 'left' or 'right' once the element is released beyond the threshold
 * @param onTap   called for a press without drag
 */
export function useSwipe({onSwipe, onTap, threshold = 90}) {
    const offset = ref(0);
    const dragging = ref(false);
    let start = null;

    function onPointerDown(event) {
        if (event.button !== 0) return;
        start = {x: event.clientX, y: event.clientY};
        // keep receiving moves when a fast swipe leaves the element right away
        event.currentTarget.setPointerCapture(event.pointerId);
    }

    function onPointerMove(event) {
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;

        if (!dragging.value) {
            if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
                dragging.value = true;
            } else {
                if (Math.abs(dy) > 8) start = null; // vertical: the user scrolls
                return;
            }
        }
        offset.value = dx;
    }

    function onPointerUp() {
        if (!start) return;
        start = null;
        if (!dragging.value) {
            onTap?.();
            return;
        }
        dragging.value = false;
        if (Math.abs(offset.value) >= threshold) {
            onSwipe(offset.value > 0 ? 'right' : 'left');
        } else {
            offset.value = 0;
        }
    }

    function onPointerCancel() {
        start = null;
        dragging.value = false;
        offset.value = 0;
    }

    return {
        offset,
        dragging,
        /** progress towards the threshold, -1 (pass) to 1 (like) */
        progress: () => Math.max(-1, Math.min(1, offset.value / threshold)),
        listeners: {
            pointerdown: onPointerDown,
            pointermove: onPointerMove,
            pointerup: onPointerUp,
            pointercancel: onPointerCancel,
        },
    };
}
