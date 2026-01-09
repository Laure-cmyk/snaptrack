<script setup>
import { ref, onMounted, watch } from 'vue';
import { getDeleteLabel, getDeleteResult } from '../../utils/negativeAction';

const props = defineProps({
  groupId: { type: String, required: true }
});

const isLeaving = ref(false);
const loading = ref(true);

const group = ref({
  id: props.groupId,
  name: '',
  type: 'group',
  members: []
});

const emit = defineEmits(['close', 'leave']);

async function loadGroup() {
  loading.value = true;
  try {
    const res = await fetch(`/groups/${props.groupId}/members`);
    const data = await res.json();

    group.value = {
      id: data.groupId,
      name: data.groupName,
      type: 'group',
      members: data.members.map(m => ({
        id: m._id,
        name: m.username,
        profilePicture: m.profilePicture
      }))
    };
  } catch (err) {
    console.error('Error loading group:', err);
  } finally {
    loading.value = false;
  }
}

async function handleLeave() {
  if (isLeaving.value) return;

  isLeaving.value = true;

  try {
    emit('leave', group.value);
  } catch (err) {
    console.error('Error leaving group:', err);
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
            <v-avatar color="grey-lighten-1">
              <v-img v-if="member.profilePicture" :src="member.profilePicture" cover />
              <span v-else class="text-h6">{{ member.name?.charAt(0).toUpperCase() }}</span>
            </v-avatar>
          </template>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-card-actions class="justify-end">
      <v-btn color="error" variant="outlined" :disabled="isLeaving" :loading="isLeaving" @click="handleLeave">
        {{ getDeleteLabel(group) }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
<style></style>
