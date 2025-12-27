<script setup>
import { ref } from 'vue';
import TheListSocials from '../components/TheListSocials.vue';
import TheGroup from '../components/TheGroup.vue';

/* TO IMPLEMENT ONCE FRONT BRANCHES ARE MERGED :
Modal to confirm negative action
Search Bar
Bottom Nav
 */

const tab = ref('friends');
const selectedGroupId = ref(null);

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
      const inviteList = isGroupInvite ? groupInvite : friendInvite;
      const targetList = isGroupInvite ? groups : friends;
      const targetType = isGroupInvite ? 'group' : 'friend';
      /* API */
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
      /* API */
      const isGroupInvite = item.category === 'group';
      const inviteList = isGroupInvite ? groupInvite : friendInvite;
      const inviteIndex = inviteList.value.findIndex(i => i.id === item.id);
      if (inviteIndex !== -1) {
        inviteList.value.splice(inviteIndex, 1);
      }
    } catch (err) {
      console.error('Erreur');
    }
  } else if (result === 'removed' && item.type === 'friend') {
    try {
      /* API */
      const friendIndex = friends.value.findIndex(i => i.id === item.id);
      if (friendIndex !== -1) {
        friends.value.splice(friendIndex, 1);
      }
    } catch (err) {
      console.error('Erreur');
    }
  } else if (result === 'left' && item.type === 'group') {
    try {
      /* API */
      const groupIndex = groups.value.findIndex(i => i.id === item.id);
      if (groupIndex !== -1) {
        groups.value.splice(groupIndex, 1);
      }
      if ((selectedGroupId.value = item.id)) {
        selectedGroupId.value = null;
      }
    } catch (err) {
      console.error('Erreur');
    }
  }
}

function handleGroupClick(group) {
  selectedGroupId.value = group.id;
}

function handleCloseGroup() {
  selectedGroupId.value = null;
}

function handleLeaveGroup(groupData) {
  /* API */
  const groupIndex = groups.value.findIndex(g => g.id === groupData.id);
  if (groupIndex !== -1) {
    groups.value.splice(groupIndex, 1);
  }
  // Close the group view and return to list
  selectedGroupId.value = null;
}
</script>
<template>
  <v-card>
    <v-tabs v-model="tab" direction="horizontal">
      <v-badge
        v-if="friendInvite.length > 0"
        inline
        location="top-right"
        color="error"
        :content="friendInvite.length"
      >
        <v-tab prepend-icon="mdi-account" text="Amis" value="friends"></v-tab>
      </v-badge>
      <v-tab v-else prepend-icon="mdi-account" text="Amis" value="friends"></v-tab>
      <v-badge
        v-if="groupInvite.length > 0"
        inline
        location="top-right"
        color="error"
        :content="groupInvite.length"
      >
        <v-tab prepend-icon="mdi-lock" text="Groupes" value="groups"></v-tab>
      </v-badge>
      <v-tab v-else prepend-icon="mdi-lock" text="Groupes" value="groups"></v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="friends">
        <v-card flat>
          <TheListSocials :items="[...friendInvite, ...friends]" @action="onAction" />
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="groups">
        <v-card flat>
          <TheGroup
            v-if="selectedGroupId"
            :group-id="selectedGroupId"
            @close="handleCloseGroup"
            @leave="handleLeaveGroup"
          />
          <TheListSocials
            v-else
            :items="[...groupInvite, ...groups]"
            @action="onAction"
            @click="handleGroupClick"
          />
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
</template>
<style scoped></style>
