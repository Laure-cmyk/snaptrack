<script setup>
import { ref, computed, onMounted } from 'vue';
import TheListSocials from '../components/socials/TheListSocials.vue';
import TheGroup from '../components/socials/TheGroup.vue';
import CreateGroup from '../components/socials/CreateGroup.vue';

const tab = ref('friends');
const selectedGroupId = ref(null);
const isCreatingGroup = ref(false);

// Get current user from localStorage - use ref for reliability
const storedUser = ref(null);

function loadStoredUser() {
  const userData = localStorage.getItem('user');
  storedUser.value = userData ? JSON.parse(userData) : null;
}

const userId = computed(() => storedUser.value?.id || storedUser.value?._id);

// API calls
const friends = ref([]);
const friendInvite = ref([]);
const groupInvite = ref([]);
const groups = ref([]);
const loading = ref(true);
const error = ref(null);

async function loadData() {
  // First load user from localStorage
  loadStoredUser();
  
  console.log('PageSocials: Loading data for user:', userId.value);
  
  if (!userId.value) {
    console.warn('PageSocials: No userId found');
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;
  
  try {
    // Fetch friends
    console.log('Fetching friends...');
    const friendsRes = await fetch(`/friends/list/${userId.value}`);
    if (!friendsRes.ok) {
      console.warn('Friends API error:', friendsRes.status);
    }
    const friendsData = await friendsRes.json();
    console.log('Friends data:', friendsData);
    
    if (Array.isArray(friendsData)) {
      friends.value = friendsData.map(f => ({
        id: f.friendshipId,
        name: f.friendName,
        friendId: f.friendId,
        type: 'friend'
      }));
    }

    // Fetch pending friend requests
    console.log('Fetching pending friend requests...');
    const pendingFriendsRes = await fetch(`/friends/requests/pending/${userId.value}`);
    if (!pendingFriendsRes.ok) {
      console.warn('Pending friends API error:', pendingFriendsRes.status);
    }
    const pendingFriendsData = await pendingFriendsRes.json();
    console.log('Pending friend requests:', pendingFriendsData);
    
    if (Array.isArray(pendingFriendsData)) {
      friendInvite.value = pendingFriendsData;
    }

    // Fetch user groups
    console.log('Fetching groups...');
    const groupsRes = await fetch(`/groups/user/${userId.value}`);
    if (!groupsRes.ok) {
      console.warn('Groups API error:', groupsRes.status);
    }
    const groupsData = await groupsRes.json();
    console.log('Groups data:', groupsData);
    
    if (Array.isArray(groupsData)) {
      groups.value = groupsData.map(g => ({
        id: g._id,
        name: g.name,
        type: 'group'
      }));
    }

    // Fetch pending group invites
    console.log('Fetching pending group invites...');
    const pendingGroupsRes = await fetch(`/user-groups/pending/${userId.value}`);
    if (!pendingGroupsRes.ok) {
      console.warn('Pending groups API error:', pendingGroupsRes.status);
    }
    const pendingGroupsData = await pendingGroupsRes.json();
    console.log('Pending group invites:', pendingGroupsData);
    
    if (Array.isArray(pendingGroupsData)) {
      groupInvite.value = pendingGroupsData;
    }
  } catch (err) {
    console.error('Error loading data:', err);
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);

async function onAction(payload) {
  console.log('Received action:', payload);
  const { item, result } = payload;
  
  if (result === 'success' && item.type === 'invite') {
    try {
      const isGroupInvite = item.category === 'group';
      
      if (isGroupInvite) {
        // Accept group invite
        await fetch(`/user-groups/${item.id}/accept`, { method: 'POST' });
      } else {
        // Accept friend request
        await fetch(`/friends/requests/${item.id}/accept`, { method: 'POST' });
      }
      
      // Reload data
      await loadData();
    } catch (err) {
      console.error('Error accepting invite:', err);
    }
  } else if (result === 'declined' && item.type === 'invite') {
    try {
      const isGroupInvite = item.category === 'group';
      
      if (isGroupInvite) {
        // Decline group invite
        await fetch(`/user-groups/${item.id}/decline`, { method: 'POST' });
      } else {
        // Refuse friend request
        await fetch(`/friends/requests/${item.id}/refuse`, { method: 'POST' });
      }
      
      // Reload data
      await loadData();
    } catch (err) {
      console.error('Error declining invite:', err);
    }
  } else if (result === 'removed' && item.type === 'friend') {
    try {
      // Delete friend
      await fetch(`/friends/${item.id}`, { method: 'DELETE' });
      await loadData();
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  } else if (result === 'left' && item.type === 'group') {
    try {
      // Leave group - remove user from group
      await fetch(`/groups/${item.id}/members/${userId.value}`, { method: 'DELETE' });
      await loadData();
      selectedGroupId.value = null;
    } catch (err) {
      console.error('Error leaving group:', err);
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
    await fetch(`/groups/${groupData.id}/members/${userId.value}`, { method: 'DELETE' });
    await loadData();
    selectedGroupId.value = null;
  } catch (err) {
    console.error('Error leaving group:', err);
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
    // Create the group
    const createRes = await fetch('/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: groupData.name,
        ownerId: userId.value
      })
    });
    const newGroupData = await createRes.json();
    
    // Add current user to the group
    await fetch('/user-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId.value,
        groupId: newGroupData.group._id,
        status: 'admin'
      })
    });
    
    // Invite selected friends to the group
    for (const friendId of groupData.memberIds) {
      await fetch('/user-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: friendId,
          groupId: newGroupData.group._id,
          status: 'pending'
        })
      });
    }
    
    await loadData();
    isCreatingGroup.value = false;
    tab.value = 'groups';
  } catch (err) {
    console.error('Error creating group:', err);
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
