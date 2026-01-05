<script setup>
import { ref, computed, onMounted } from 'vue';
import TheListSocials from '../components/socials/TheListSocials.vue';
import TheGroup from '../components/socials/TheGroup.vue';
import CreateGroup from '../components/socials/CreateGroup.vue';
import { fetchJson } from '@/utils/fetchJson';

/* TO IMPLEMENT ONCE FRONT BRANCHES ARE MERGED :
Modal to confirm negative action
Search Bar
--> Also needs to be implemented in CreateGroup.vue and TheGroup.vue
Bottom Nav
 */

const tab = ref('friends');
const selectedGroupId = ref(null);
const isCreatingGroup = ref(false);

// Get current user from localStorage
const currentUser = computed(() => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
});

const userId = computed(() => currentUser.value?.id || currentUser.value?._id);

// Reactive data
const friends = ref([]);
const friendInvite = ref([]);
const groupInvite = ref([]);
const groups = ref([]);
const loading = ref(false);

// Load all data on mount
onMounted(async () => {
  if (!userId.value) {
    console.log('No user ID found');
    return;
  }
  
  console.log('Fetching data for user:', userId.value);
  loading.value = true;
  try {
    // Fetch all data in parallel
    const [friendsResult, pendingFriendsResult, groupsResult, pendingGroupsResult] = await Promise.all([
      fetchJson({ url: `/friends/${userId.value}` }).request,
      fetchJson({ url: `/friends/${userId.value}/pending` }).request,
      fetchJson({ url: `/groups/user/${userId.value}` }).request,
      fetchJson({ url: `/user-groups/pending/${userId.value}` }).request
    ]);
    
    console.log('Friends from DB:', friendsResult);
    console.log('Pending friend requests from DB:', pendingFriendsResult);
    console.log('Groups from DB:', groupsResult);
    console.log('Pending group invites from DB:', pendingGroupsResult);
    
    // Map friends data
    if (friendsResult) {
      friends.value = friendsResult.map(f => ({
        id: f.friendshipId,
        odId: f.friendId,
        name: f.friendName,
        type: 'friend'
      }));
    }
    
    // Map pending friend requests
    if (pendingFriendsResult) {
      friendInvite.value = pendingFriendsResult.map(f => ({
        id: f.friendshipId,
        odId: f.senderId,
        name: f.senderName,
        type: 'invite',
        category: 'friend'
      }));
    }
    
    // Map groups data
    if (groupsResult) {
      groups.value = groupsResult.map(g => ({
        id: g._id,
        name: g.name,
        type: 'group'
      }));
    }
    
    // Map pending group invites
    if (pendingGroupsResult) {
      groupInvite.value = pendingGroupsResult.map(g => ({
        id: g.inviteId,
        odId: g.groupId,
        name: g.groupName,
        type: 'invite',
        category: 'group'
      }));
    }
  } catch (err) {
    console.error('Erreur lors du chargement des données:', err);
  } finally {
    loading.value = false;
  }
});

// API helper
async function apiCall(url, method = 'POST', body = null) {
  const { request } = fetchJson({ url, method, data: body });
  return request;
}

async function onAction(payload) {
  console.log('Received action:', payload);
  const { item, result } = payload;
  if (result === 'success' && item.type === 'invite') {
    try {
      const isGroupInvite = item.category === 'group';
      const inviteList = isGroupInvite ? groupInvite : friendInvite;
      const targetList = isGroupInvite ? groups : friends;
      const targetType = isGroupInvite ? 'group' : 'friend';
      
      // API: Accept invite
      if (isGroupInvite) {
        await apiCall(`/user-groups/${item.id}/accept`);
      } else {
        await apiCall(`/friends/requests/${item.id}/accept`);
      }
      
      const inviteIndex = inviteList.value.findIndex(i => i.id === item.id);
      if (inviteIndex !== -1) {
        const movedItem = inviteList.value.splice(inviteIndex, 1)[0];
        movedItem.type = targetType;
        movedItem.id = movedItem.odId || movedItem.id; // Use the original ID for the list
        targetList.value.push(movedItem);
      }
    } catch (err) {
      console.error('Erreur lors de l\'acceptation:', err);
    }
  } else if (result === 'declined' && item.type === 'invite') {
    try {
      const isGroupInvite = item.category === 'group';
      const inviteList = isGroupInvite ? groupInvite : friendInvite;
      
      // API: Refuse invite
      if (isGroupInvite) {
        await apiCall(`/user-groups/${item.id}/refuse`);
      } else {
        await apiCall(`/friends/requests/${item.id}/refuse`);
      }
      
      const inviteIndex = inviteList.value.findIndex(i => i.id === item.id);
      if (inviteIndex !== -1) {
        inviteList.value.splice(inviteIndex, 1);
      }
    } catch (err) {
      console.error('Erreur lors du refus:', err);
    }
  } else if (result === 'removed' && item.type === 'friend') {
    try {
      // API: Remove friend
      await apiCall(`/friends/${item.id}`, 'DELETE');
      
      const friendIndex = friends.value.findIndex(i => i.id === item.id);
      if (friendIndex !== -1) {
        friends.value.splice(friendIndex, 1);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    }
  } else if (result === 'left' && item.type === 'group') {
    try {
      // API: Leave group
      await apiCall(`/groups/${item.id}/members/${userId.value}`, 'DELETE');
      
      const groupIndex = groups.value.findIndex(i => i.id === item.id);
      if (groupIndex !== -1) {
        groups.value.splice(groupIndex, 1);
      }
      if (selectedGroupId.value === item.id) {
        selectedGroupId.value = null;
      }
    } catch (err) {
      console.error('Erreur lors du départ du groupe:', err);
    }
  }
}

function handleGroupClick(group) {
  selectedGroupId.value = group.id;
}

function handleCloseGroup() {
  selectedGroupId.value = null;
}

async function handleLeaveGroup(groupData) {
  try {
    // API: Leave group
    await apiCall(`/groups/${groupData.id}/members/${userId.value}`, 'DELETE');
    
    const groupIndex = groups.value.findIndex(g => g.id === groupData.id);
    if (groupIndex !== -1) {
      groups.value.splice(groupIndex, 1);
    }
    // Close the group view and return to list
    selectedGroupId.value = null;
  } catch (err) {
    console.error('Erreur lors du départ du groupe:', err);
  }
}

function openCreateGroup() {
  isCreatingGroup.value = true;
}

function closeCreateGroup() {
  isCreatingGroup.value = false;
}

async function handleCreateGroup(groupData) {
  try {
    // API: Create group
    const result = await apiCall('/groups', 'POST', {
      name: groupData.name,
      ownerId: userId.value
    });
    
    const newGroupId = result.group._id;
    
    // Add current user to the group
    await apiCall('/user-groups', 'POST', {
      userId: userId.value,
      groupId: newGroupId,
      status: 'admin'
    });
    
    // Add selected members to the group (as pending invites)
    if (groupData.memberIds && groupData.memberIds.length > 0) {
      await Promise.all(groupData.memberIds.map(memberId =>
        apiCall('/user-groups', 'POST', {
          userId: memberId,
          groupId: newGroupId,
          status: 'pending'
        })
      ));
    }
    
    const newGroup = {
      id: newGroupId,
      name: groupData.name,
      type: 'group'
    };
    groups.value.push(newGroup);
    isCreatingGroup.value = false;
    tab.value = 'groups';
  } catch (err) {
    console.error('Erreur lors de la création du groupe:', err);
  }
}
</script>
<template>
  <CreateGroup
    v-if="isCreatingGroup"
    :friends="friends"
    @close="closeCreateGroup"
    @create="handleCreateGroup"
  />
  <v-card v-else-if="loading" class="d-flex justify-center align-center pa-8">
    <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
  </v-card>
  <v-card v-else>
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
          <div v-else>
            <v-card-actions class="justify-end pa-4">
              <v-btn color="primary" variant="elevated" rounded="xl" @click="openCreateGroup">
                +
              </v-btn>
            </v-card-actions>
            <TheListSocials
              :items="[...groupInvite, ...groups]"
              @action="onAction"
              @click="handleGroupClick"
            />
          </div>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
</template>
<style scoped></style>
