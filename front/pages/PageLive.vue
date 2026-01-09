<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { WSClientRoom } from 'wsmini/client';
import TheMap from '../components/TheMap.vue';
import BaseHeader from '../components/BaseHeader.vue';

const router = useRouter();
const route = useRoute();

const markers = ref([]);
const room = ref(null);
const roomName = ref('Live Challenge');
const isConnected = ref(false);
let locationInterval = null;

const handleBack = () => router.back();

// Fake participants for testing
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
};

onMounted(async () => {
  try {
    // WebSocket on port 443
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:443';
    const ws = new WSClientRoom(wsUrl);
    
    console.log('Connecting to WebSocket:', wsUrl);
    await ws.connect();
    console.log('WebSocket connected!');
    
    isConnected.value = true;
    
    const journeyId = route.query.journeyId || 'default';
    const username = localStorage.getItem('username') || 'TestUser';
    
    room.value = await ws.roomCreateOrJoin(`journey-${journeyId}`, { username });
    roomName.value = `Challenge ${journeyId}`;
    
    console.log('Joined room:', room.value);
    
    // Listen for location updates from real users
    room.value.onCmd('location', (data) => {
      console.log('Received location:', data);
      const existing = markers.value.findIndex(m => m.popup === data.username);
      const marker = { lat: data.lat, lng: data.lng, popup: data.username };
      
      if (existing >= 0) markers.value[existing] = marker;
      else markers.value.push(marker);
    });

    // Start fake participants simulation (moving every 2 seconds)
    setInterval(simulateFakeParticipants, 100);
    
    // Send your real location if geolocation available
    if (navigator.geolocation && room.value) {
      // Send immediately
      navigator.geolocation.getCurrentPosition((pos) => {
        console.log('Sending location:', pos.coords.latitude, pos.coords.longitude);
        room.value.sendCmd('location', { 
          lat: pos.coords.latitude, 
          lng: pos.coords.longitude 
        });
      });
      
      // Then send every 5 seconds
      locationInterval = setInterval(() => {
        if (room.value) {
          navigator.geolocation.getCurrentPosition((pos) => {
            console.log('Sending location:', pos.coords.latitude, pos.coords.longitude);
            room.value.sendCmd('location', { 
              lat: pos.coords.latitude, 
              lng: pos.coords.longitude 
            });
          }, (error) => {
            console.warn('Geolocation error:', error);
          });
        }
      }, 5000);
    }
  } catch (error) {
    console.error('WebSocket connection failed:', error);
    isConnected.value = false;
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
    
    <!-- Connection Status -->
    <v-chip 
      :color="isConnected ? 'success' : 'error'" 
      class="connection-status"
      size="small"
    >
      {{ isConnected ? '🟢 Connected' : '🔴 Disconnected' }}
    </v-chip>
    
    <!-- Participant Count -->
    <v-chip 
      color="primary" 
      class="participant-count"
      size="small"
    >
      {{ markers.length }} participants
    </v-chip>
    
    <TheMap :center="[46.7785, 6.6410]" :zoom="13" :markers="markers" />
  </v-container>
</template>

<style scoped>
.map-page {
  height: 100vh;
  width: 100%;
}

.connection-status {
  position: absolute;
  top: 70px;
  left: 10px;
  z-index: 1000;
}

.participant-count {
  position: absolute;
  top: 70px;
  right: 10px;
  z-index: 1000;
}
</style>