<script setup>
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

defineEmits(['update:modelValue']);
</script>

<template>
  <v-text-field
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    placeholder="Chercher un parcours"
    variant="outlined"
    density="comfortable"
    prepend-inner-icon="mdi-magnify"
    rounded="lg"
    hide-details
    class="search-bar"
  />
</template>

<style scoped>
.search-bar {
  background-color: white;
}

.search-bar :deep(.v-field) {
  background-color: white;
}

.search-bar :deep(.v-field__outline) {
  color: #4f4f4fe6;
}
</style>
