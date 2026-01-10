<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { WSClientRoom } from 'wsmini/client';
import { fetchJson } from '@/utils/fetchJson';
import TheMap from '../components/TheMap.vue';
import BaseHeader from '../components/BaseHeader.vue';

const router = useRouter();
const route = useRoute();

const challengersLocationRef = ref(null);
const markers = ref([]);
const room = ref(null);
const roomName = ref('Live Challenge');
let locationInterval = null;

const handleBack = () => router.back();

//* Uncomment below if test data is needed

/* // Fake participants for testing
const fakeParticipants = [
  { username: 'Alice', lat: 46.7785, lng: 6.6410 },
  { username: 'Bob', lat: 46.7795, lng: 6.6420 },
  { username: 'Charlie', lat: 46.7775, lng: 6.6400 }
];

// Simulate fake participants moving
const simulateFakeParticipants = () => {
  fakeParticipants.forEach(participant => {
    // Random movement
    participant.lat += (Math.random() - 0.5) * 0.001;
    participant.lng += (Math.random() - 0.5) * 0.001;
    
    // Update or add marker
    const existing = markers.value.findIndex(m => m.popup === participant.username);
    const marker = { 
      lat: participant.lat, 
      lng: participant.lng, 
      popup: participant.username 
    };
    
    if (existing >= 0) {
      markers.value[existing] = marker;
    } else {
      markers.value.push(marker);
    }
  });
}; */

onMounted(async () => {
  try {
    const journeyId = route.params.id;
    if (!journeyId) {
      console.error('No journey ID provided');
      router.push('/');
      return;
    }
    const username = localStorage.getItem('username') || 'TestUser';

    // Get the journeys id
    try {
      const journey = await fetchJson({ url: `/journeys/${journeyId}` }).request;
      roomName.value = journey.name || 'Live';
    } catch (error) {
      console.error('Failed to fetch journey name:', error);
      roomName.value = journeyId; // Fallback to journey ID
    }

    // WebSocket on port 443
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:443';
    const ws = new WSClientRoom(wsUrl);

    console.log('Connecting to WebSocket:', wsUrl);
    await ws.connect();
    console.log('WebSocket connected!');

    room.value = await ws.roomCreateOrJoin(`journey-${journeyId}`, { username });

    console.log('Joined room:', room.value);

    // Listen for location updates from real users
    room.value.onCmd('location', data => {
      console.log('Received location:', data);
      const existing = markers.value.findIndex(m => m.popup === data.username);
      const marker = { lat: data.lat, lng: data.lng, popup: data.username };

      if (existing >= 0) markers.value[existing] = marker;
      else markers.value.push(marker);

      if (markers.value.length > 0 && challengersLocationRef.value) {
        const bounds = markers.value.map(m => [m.lat, m.lng]);
        challengersLocationRef.value.fitBounds(bounds);
      }
    });

    //* Uncomment below if test data is needed
    /* 
    // Start fake participants simulation (moving every 1 seconds)
    setInterval(simulateFakeParticipants, 1000); */
  } catch (error) {
    console.error('WebSocket connection failed:', error);
  }
});

onBeforeUnmount(() => {
  if (locationInterval) {
    clearInterval(locationInterval);
  }
  if (room.value) {
    room.value.leave();
  }
});
</script>

<template>
  <v-container fluid class="pa-0 map-page">
    <BaseHeader :title="roomName" :show-back="true" @back="handleBack" />
    <TheMap
      ref="challengersLocationRef"
      :center="[0, 0]"
      :zoom="2"
      :markers="markers"
      :show-status="true"
    />
  </v-container>
</template>

<style scoped>
.map-page {
  height: 100vh;
  width: 100%;
}
</style>
