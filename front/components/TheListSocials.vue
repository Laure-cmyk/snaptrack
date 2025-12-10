<script setup>
/* import { usefetchJson } from '../composables/useFetchJson'; */
import { reactive, watchEffect } from 'vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  addLabel: { type: String, default: 'Ajouter' },
  pendingLabel: { type: String, default: 'En attente' },
  addedLabel: { type: String, default: 'Amis' },
  showButton: { type: Boolean, default: true }
});
/* const {
data:
loading:
error: 
} = useFetchJson(); */

const emit = defineEmits(['action']);

const stateMap = reactive({});

watchEffect(() => {
  props.items.forEach((item, index) => {
    const key = item?.id ?? index;
    if (stateMap[key] === undefined) stateMap[key] = props.addLabel;
  });
});

async function handleClick(item, index) {
  const key = item?.id ?? index;
  if (stateMap[key] === props.pendingLabel) return;
  if (stateMap[key] === props.addedLabel) return;

  stateMap[key] = props.pendingLabel;

  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    stateMap[key] = props.addedLabel;
    emit('action', { item, index, results: 'success' });
  } catch (err) {
    stateMap[key] = props.addLabel;
    emit('action', { item, index, result: 'error', error: err });
  }
}
/* const STATUS_ADD = 'Add';
const requestState = ref(STATUS_ADD);
// change ref() for api responses
// or give STATUS_ADD to fetchJson
const handleClick = () => {
  // logic
}; */
</script>

<template>
  <v-list lines="two">
    <v-list-item
      v-for="(item, index) in items"
      :key="item?.id ?? index"
      :title="item?.name ?? item?.title ?? 'User ' + (index + 1)"
    >
      <template v-slot:append>
        <v-btn
          v-if="showButton"
          size="small"
          variant="outlined"
          :disabled="stateMap[item?.id ?? index] === pendingLabel"
          @click="() => handleClick(item, index)"
        >
          {{ stateMap[item?.id ?? index] }}
        </v-btn>
      </template>
      <v-divider v-if="index < items.length - 1" />
    </v-list-item>
  </v-list>
</template>

<!-- <template>
  <v-list lines="two">
    <v-list-item v-for="n in 3" :key="n" :title="'Username ' + n">
      <template v-slot:append>
        <v-btn size="small" variant="outlined" @click="handleClick">{{ requestState }}</v-btn>
      </template>
      <v-divider></v-divider>
    </v-list-item>
  </v-list>
</template>
 -->
