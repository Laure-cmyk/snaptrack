<script setup>
/* import { usefetchJson } from '../composables/useFetchJson'; */
import { reactive, watchEffect } from 'vue';
import { getDeleteLabel, getDeleteResult } from '../../utils/negativeAction';

const props = defineProps({
  items: { type: Array, default: () => [] },
  addLabel: { type: String, default: 'Accepter' },
  pendingLabel: { type: String, default: 'En attente' },
  addedLabel: { type: String, default: 'Amis' },
  deleteLabel: { type: String, default: 'Refuser' },
  showButton: { type: Boolean, default: true }
});

const emit = defineEmits(['action', 'click']);

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
    emit('action', { item, index, result: 'success' });
  } catch (err) {
    stateMap[key] = props.addLabel;
    emit('action', { item, index, result: 'error', error: err });
  }
}

async function handleDelete(item, index) {
  const key = item?.id ?? index;
  if (stateMap[key] === props.pendingLabel) return;

  stateMap[key] = props.pendingLabel;

  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    const result = getDeleteResult(item);
    emit('action', { item, index, result });
  } catch (err) {
    stateMap[key] = item.type === 'invite' ? props.addLabel : props.addedLabel;
    emit('action', { item, index, result: 'error', error: err });
  }
}

function handleClick(item) {
  if (item.type === 'group') {
    emit('click', item);
  }
}
</script>

<template>
  <v-list lines="two">
    <v-list-item
      v-for="(item, index) in items"
      :key="item?.id ?? index"
      @click="() => handleClick(item)"
      :title="item?.name ?? item?.title ?? 'User ' + (index + 1)"
    >
      <template v-slot:append>
        <template
          v-if="showButton && item.type === 'invite' && stateMap[item?.id ?? index] === addLabel"
        >
          <v-btn size="small" variant="outlined" @click.stop="() => handleAccept(item, index)">
            {{ stateMap[item?.id ?? index] }}
          </v-btn>
          <v-btn
            size="small"
            variant="outlined"
            color="error"
            @click.stop="() => handleDelete(item, index)"
          >
            {{ getDeleteLabel(item) }}
          </v-btn>
        </template>
        <v-btn
          v-else-if="
            showButton && item.type === 'invite' && stateMap[item?.id ?? index] !== addLabel
          "
          size="small"
          variant="outlined"
          disabled
        >
          {{ stateMap[item?.id ?? index] }}
        </v-btn>
        <v-btn
          v-else-if="showButton && item.type === 'friend'"
          size="small"
          color="error"
          variant="text"
          :disabled="stateMap[item?.id ?? index] === pendingLabel"
          @click.stop="() => handleDelete(item, index)"
        >
          {{ getDeleteLabel(item) }}
        </v-btn>
      </template>
      <v-divider v-if="index < items.length - 1" />
    </v-list-item>
  </v-list>
</template>
