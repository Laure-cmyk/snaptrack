<script setup>
import { ref } from 'vue';
import TheListSocials from '../components/TheListSocials.vue';

const tab = ref('friends');

const friends = ref([
  { id: 1, name: 'Alice', type: 'friend' },
  { id: 2, name: 'Bob', type: 'friend' },
  { id: 3, name: 'Eve', type: 'friend' }
]);

const friendInvite = ref([{ id: 4, name: 'Jean-luc', type: 'invite', category: 'friend' }]);

const groupInvite = ref([{ id: 'g3', name: 'ToilettesRun', type: 'invite', category: 'group' }]);

const groups = ref([
  { id: 'g1', name: 'Study Group', type: 'group' },
  { id: 'g2', name: 'Project Team', type: 'group' }
]);

async function onAction(payload) {
  console.log('Received action:', payload);
  const { item, result } = payload;
  if (result === 'success' && item.type === 'invite') {
    try {
      const isGroupInvite = item.category === 'group';
      const inviteList = isGroupInvite ? groupInvite : friendList;
      const targetList = isGroupInvite ? groups : friends;
      const targetType = isGroupInvite ? 'group' : 'friend';
      // API
      const inviteIndex = inviteList.value.findIndex(i => i.id === item.id);
      if (inviteIndex !== -1) {
        const movedItem = inviteList.value.splice(inviteIndex, 1)[0];
        movedItem.type = targetType;
        targetList.value.push(movedItem);
      }
    } catch (err) {
      console.error('Erreur');
    }
  } else if (result === 'declined' && item.type === 'invite') {
    try {
      const isGroupInvite = item.category === 'group';
      const inviteList = isGroupInvite ? groupInvite : inviteList;
      // API
      const inviteIndex = inviteList.value.findIndex(i => i.id === item.id);
      if (inviteIndex !== -1) {
        inviteList.value.splice(inviteIndex, 1);
      }
    } catch (err) {
      console.error('Erreur');
    }
  }
}
</script>
<template>
  <v-card>
    <v-tabs v-model="tab" direction="horizontal">
      <v-badge inline location="top-right" color="error" :content="friendInvite.length">
        <v-tab prepend-icon="mdi-account" text="Amis" value="friends"></v-tab
      ></v-badge>
      <v-badge inline location="top-right" color="error" :content="groupInvite.length">
        <v-tab prepend-icon="mdi-lock" text="Groupes" value="groups"></v-tab
      ></v-badge>
    </v-tabs>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="friends">
        <v-card flat>
          <TheListSocials :items="[...friendInvite, ...friends]" @action="onAction" />
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="groups">
        <v-card flat>
          <TheListSocials :items="[...groupInvite, ...groups]" @action="onAction" />
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
</template>
<style scoped></style>
