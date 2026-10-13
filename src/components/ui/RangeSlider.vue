<script setup>
import {computed} from 'vue'

const props = defineProps({
  min: {type: Number, default: 0},
  max: {type: Number, default: 100},
  /** two thumbs, the model is then [from, to] */
  range: {type: Boolean, default: false},
  ariaLabel: {type: String, default: null},
})

const model = defineModel({type: [Number, Array], required: true})

const low = computed(() => props.range ? model.value[0] : props.min)
const high = computed(() => props.range ? model.value[1] : model.value)

const percent = value => ((value - props.min) / (props.max - props.min)) * 100
const fillStyle = computed(() => ({left: `${percent(low.value)}%`, right: `${100 - percent(high.value)}%`}))

function setFrom(event) {
  const value = Math.min(Number(event.target.value), model.value[1])
  event.target.value = value
  model.value = [value, model.value[1]]
}

function setTo(event) {
  const value = Math.max(Number(event.target.value), model.value[0])
  event.target.value = value
  model.value = [model.value[0], value]
}
</script>

<template>
  <div class="slider">
    <div class="track"><div class="fill" :style="fillStyle"></div></div>
    <template v-if="range">
      <input type="range" :min="min" :max="max" :value="model[0]" :aria-label="ariaLabel && `${ariaLabel} from`"
             @input="setFrom"/>
      <input type="range" :min="min" :max="max" :value="model[1]" :aria-label="ariaLabel && `${ariaLabel} to`"
             @input="setTo"/>
    </template>
    <input v-else v-model.number="model" type="range" :min="min" :max="max" :aria-label="ariaLabel"/>
  </div>
</template>

<style scoped>
.slider {
  position: relative;
  height: 20px;
}

.track {
  position: absolute;
  top: 50%;
  left: 10px; /* half a thumb: the thumb centers then match the fill */
  right: 10px;
  height: 3px;
  border-radius: 2px;
  background: var(--ui-surface-700);
  transform: translateY(-50%);
}

.fill {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 2px;
  background: var(--ui-primary);
}

/* the inputs lie on top of each other, only the thumbs take pointer events */
input[type='range'] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  background: none;
  pointer-events: none;
  appearance: none;
}

input[type='range']::-webkit-slider-runnable-track {
  height: 20px;
  background: none;
}

input[type='range']::-moz-range-track {
  height: 20px;
  background: none;
}

input[type='range']::-webkit-slider-thumb {
  width: 20px;
  height: 20px;
  box-sizing: border-box;
  border: 2px solid var(--ui-primary);
  border-radius: 50%;
  background: var(--ui-surface-900);
  pointer-events: auto;
  cursor: grab;
  appearance: none;
}

input[type='range']::-moz-range-thumb {
  width: 20px;
  height: 20px;
  box-sizing: border-box;
  border: 2px solid var(--ui-primary);
  border-radius: 50%;
  background: var(--ui-surface-900);
  pointer-events: auto;
  cursor: grab;
}

input[type='range']:focus-visible::-webkit-slider-thumb {
  box-shadow: var(--ui-focus-ring);
}

input[type='range']:focus-visible::-moz-range-thumb {
  box-shadow: var(--ui-focus-ring);
}

input[type='range']:focus {
  outline: none;
}
</style>
