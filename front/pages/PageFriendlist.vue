<script setup>
import { ref } from 'vue';
import TheListSocials from '../components/TheListSocials.vue';

const tab = ref('friends');

const friends = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Eve' }
];

const groups = [
  { id: 'g1', name: 'Study Group' },
  { id: 'g2', name: 'Project Team' }
];

function onAction(payload) {
  console.log('Received action:', payload);
}
</script>
<template>
  <v-card>
    <v-tabs v-model="tab" direction="horizontal">
      <v-tab prepend-icon="mdi-account" text="Amis" value="friends"></v-tab>
      <v-tab prepend-icon="mdi-lock" text="Groupes" value="groups"></v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="friends">
        <v-card flat>
          <TheListSocials :items="friends" @action="onAction" />
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="groups">
        <v-card flat>
          <TheListSocials :items="groups" :show-button="false" />
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
  <!-- <TheFriendlist/> -->
</template>
<style scoped></style>
