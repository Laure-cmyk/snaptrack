<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: 'Confirmer'
  },
  cancelText: {
    type: String,
    default: ''
  },
  confirmColor: {
    type: String,
    default: 'indigo-darken-1'
  },
  persistent: {
    type: Boolean,
    default: true
  },
  maxWidth: {
    type: [String, Number],
    default: 400
  }
});

defineEmits(['update:modelValue', 'confirm', 'cancel']);
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :persistent="persistent"
    :max-width="maxWidth"
  >
    <v-card rounded="xl" class="pa-4">
      <!-- Title -->
      <v-card-title
        v-if="title"
        class="text-h6 font-weight-bold text-center pa-4"
        style="white-space: normal; word-break: break-word"
      >
        {{ title }}
      </v-card-title>

      <!-- Content -->
      <v-card-text class="text-center text-body-1 px-6 py-4">
        <slot></slot>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="pa-4 pt-2 flex-column ga-3">
        <v-btn
          v-if="confirmText"
          block
          :color="confirmColor"
          size="large"
          rounded="lg"
          variant="flat"
          elevation="0"
          @click="$emit('confirm')"
        >
          {{ confirmText }}
        </v-btn>
        <v-btn
          v-if="cancelText"
          block
          color="grey-darken-1"
          size="large"
          rounded="lg"
          variant="text"
          @click="$emit('cancel')"
        >
          {{ cancelText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
