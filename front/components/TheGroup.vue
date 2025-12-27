<script setup>
import { ref, onMounted, watch } from 'vue';
import { getDeleteLabel, getDeleteResult } from '../utils/negativeAction';

const props = defineProps({
  groupId: { type: String, required: true }
});

const isLeaving = ref(false);

const group = ref({
  id: props.groupId,
  name: '',
  type: 'group',
  members: []
});

const emit = defineEmits(['close', 'leave']);

async function loadGroup() {
  /* API */
  group.value = {
    id: props.groupId,
    name: props.groupId === 'g1' ? 'Study Group' : 'Project Team',
    type: 'group',
    members: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  };
}

async function handleLeave() {
  if (isLeaving.value) return;

  isLeaving.value = true;

  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    /* API */
    emit('leave', group.value);
  } catch (err) {
    console.error('Erreur');
    isLeaving.value = false;
  }
}

onMounted(async () => {
  loadGroup();
});

watch(
  () => props.groupId,
  () => {
    loadGroup();
  }
);
</script>
<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-btn icon="mdi-arrow-left" variant="text" @click="emit('close')" class="mr-2"></v-btn>
      {{ group.name }}
    </v-card-title>
    <v-card-subtitle>{{ group.members.length }} membres</v-card-subtitle>
    <v-card-text>
      <v-list lines="two">
        <v-list-item v-for="member in group.members" :key="member.id" :title="member.name">
          <template v-slot:prepend>
            <v-avatar color="primary">
              <span class="text-white">{{ member.name.charAt(0) }}</span>
            </v-avatar>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-card-actions class="justify-end">
      <v-btn
        color="error"
        variant="outlined"
        :disabled="isLeaving"
        :loading="isLeaving"
        @click="handleLeave"
      >
        {{ getDeleteLabel(group) }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
<style></style>
