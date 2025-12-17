<script setup>
/* import { usefetchJson } from '../composables/useFetchJson'; */
import { reactive, watchEffect } from 'vue';

const props = defineProps({
  items: { type: Array, default: () => [] },
  addLabel: { type: String, default: 'Accepter' },
  pendingLabel: { type: String, default: 'En attente' },
  addedLabel: { type: String, default: 'Amis' },
  declineLabel: { type: String, default: 'Refuser' },
  showButton: { type: Boolean, default: true }
});

const emit = defineEmits(['action']);

const stateMap = reactive({});

watchEffect(() => {
  props.items.forEach((item, index) => {
    const key = item?.id ?? index;
    if (stateMap[key] === undefined) {
      stateMap[key] =
        item.type === 'friend' || item.type === 'group' ? props.addedLabel : props.addLabel;
    }
  });
  Object.keys(stateMap).forEach(key => {
    if (!props.items.find(item => (item?.id ?? null).toString() === key)) {
      delete stateMap[key];
    }
  });
});

async function handleAccept(item, index) {
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

async function handleDecline(item, index) {
  const key = item?.id ?? index;
  if (stateMap[key] === props.pendingLabel) return;
  if (stateMap[key] === props.addedLabel) return;

  /*  stateMap[key] = props.pendingLabel; */

  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    emit('action', { item, index, result: 'declined' });
  } catch (err) {
    stateMap[key] = props.addLabel;
    emit('action', { item, index, result: 'error', error: err });
  }
}
</script>

<template>
  <v-list lines="two">
    <v-list-item
      v-for="(item, index) in items"
      :key="item?.id ?? index"
      :title="item?.name ?? item?.title ?? 'User ' + (index + 1)"
    >
      <template v-slot:append>
        <template
          v-if="showButton && item.type === 'invite' && stateMap[item?.id ?? index] === addLabel"
        >
          <v-btn size="small" variant="outlined" @click="() => handleAccept(item, index)">
            {{ stateMap[item?.id ?? index] }}
          </v-btn>
          <v-btn
            size="small"
            variant="outlined"
            color="error"
            @click="() => handleDecline(item, index)"
          >
            {{ declineLabel }}
          </v-btn>
        </template>
        <v-btn v-else-if="showButton && item.type" size="small" variant="outlined" disabled>
          {{ stateMap[item?.id ?? index] }}
        </v-btn>
      </template>
      <v-divider v-if="index < items.length - 1" />
    </v-list-item>
  </v-list>
</template>
