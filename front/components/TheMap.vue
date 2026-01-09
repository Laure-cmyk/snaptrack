<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({
  center: {
    type: Array,
    default: () => [46.7785, 6.6410] 
  },
  zoom: {
    type: Number,
    default: 13
  },
  markers: {
    type: Array,
    default: () => []
  },
  showStatus: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['mapClick', 'markerClick']);

const mapContainer = ref(null);
let map = null;
let markerLayer = null;

/* Creates markers */
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

/* Updates marker when changes occur */
watch(() => props.markers, (newMarkers) => {
  addMarkers(newMarkers);
}, { deep: true });

/* Initilize Map */
onMounted(() => {
  map = L.map(mapContainer.value, { zoomControl: false }).setView(props.center, props.zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);

  if (props.markers.length > 0) {
    addMarkers(props.markers);
  }

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
});

/* Map needs to be removed otherwise Leaflet keeps resources in memory */
onBeforeUnmount(() => {
  if (map) {
    map.remove();
  }
});

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
  <div class="map-wrapper">
    <div ref="mapContainer" class="map-container"></div>
    
    <!-- Status chip overlay -->
    <div v-if="showStatus" class="map-overlay">
      <v-chip 
      variant="flat"
        color="default" 
        class="count-chip"
        size="small"
      >
        {{ markers.length }} participants
      </v-chip>
    </div>
  </div>
</template>

<style scoped>
.map-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 100%;
  position: relative;
}

.map-overlay {
  position: absolute;
  top: 10px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
  pointer-events: none;
  z-index: 1000;
}

.map-overlay .v-chip {
  pointer-events: auto;
}

.status-chip {
  margin-right: auto;
}

.count-chip {
  margin-left: auto;
}
</style>