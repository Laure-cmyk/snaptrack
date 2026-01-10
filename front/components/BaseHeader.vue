<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  showBack: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['back', 'action']);

function handleBack() {
  emit('back');
}

function handleAction() {
  emit('action');
}
</script>

<template>
    <div class="header-section">
        <div class="pa-5 d-flex align-center justify-center position-relative" style="min-height: 64px;">
            <!-- Back Button -->
            <v-btn v-if="showBack" icon variant="text" @click="handleBack" class="position-absolute"
                style="left: 16px; top: 50%; transform: translateY(-50%);">
                <v-icon color="white">mdi-close</v-icon>
            </v-btn>

            <!-- Title -->
            <div class="text-center">
                <div class="text-h6 font-weight-bold text-white">{{ title }}</div>
            </div>

            <!-- Action Slot -->
            <div v-if="showActions" class="position-absolute"
                style="right: 16px; top: 50%; transform: translateY(-50%);">
                <slot name="actions"></slot>
            </div>
        </div>
    </div>
</template>

<style scoped>
.header-section {
  background: linear-gradient(135deg, #3948ab 0%, #3948ab 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  position: sticky;
  top: 0;
  z-index: 10;
}
</style>
