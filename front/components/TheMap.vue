<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  center: {
    type: Array,
    default: () => [46.7785, 6.6410] 
    // Y-city as default 
  },
  zoom: {
    type: Number,
    default: 13
  },
  markers: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['mapClick', 'markerClick']);

// Reactive data
const mapContainer = ref(null);
let map = null;
let markerLayer = null;

// Add markers to map
const addMarkers = (markers) => {
  if (!markerLayer) return;
  
  markerLayer.clearLayers();
  
  markers.forEach((markerData) => {
    const marker = L.marker([markerData.lat, markerData.lng]);
    
    if (markerData.popup) {
      marker.bindPopup(markerData.popup);
    }
    
    markerLayer.addLayer(marker);
  });
};

// Watch for marker changes and update them
watch(() => props.markers, (newMarkers) => {
  addMarkers(newMarkers);
}, { deep: true });

// Initialize map
onMounted(() => {
  // Create map
  map = L.map(mapContainer.value, { zoomControl: false }).setView(props.center, props.zoom);

  // Use OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  // Create marker layer group
  markerLayer = L.layerGroup().addTo(map);

  // Add markers if provided
  if (props.markers.length > 0) {
    addMarkers(props.markers);
  }

  // Fix for marker icons not displaying correctly with bundlers
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
});

// Cleanup on unmount so Leaflet doesn't keep old resources running background
onBeforeUnmount(() => {
  if (map) {
    map.remove();
  }
});

// Expose methods to parent component
defineExpose({
  addMarker: (lat, lng, popup) => {
    const marker = L.marker([lat, lng]);
    if (popup) {
      marker.bindPopup(popup);
    }
    markerLayer.addLayer(marker);
    return marker;
  },
  removeMarker: (marker) => {
    markerLayer.removeLayer(marker);
  },
  clearMarkers: () => {
    markerLayer.clearLayers();
  },
  setView: (lat, lng, zoom) => {
    map.setView([lat, lng], zoom || props.zoom);
  },
  fitBounds: (bounds) => {
    map.fitBounds(bounds);
  },
  getMap: () => map
});
</script>

<template>
  <div ref="mapContainer" class="map-container"></div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  min-height: 100%;
  position: relative;
}
</style>