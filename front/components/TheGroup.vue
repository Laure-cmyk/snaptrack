<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  groupId: { type: String, required: true }
});

const group = ref({
  id: props.groupId,
  name: '',
  members: []
});

const emit = defineEmits(['close']);

async function loadGroup() {
  /* API */
  group.value = {
    id: props.groupId,
    name: props.groupId === 'g1' ? 'Study Group' : 'Project Team',
    members: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]
  };
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
  </v-card>
</template>
<style></style>
