<script setup>
const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    showClearButton: {
        type: Boolean,
        default: false
    }
})

defineEmits(['update:modelValue', 'close', 'blur'])
</script>

<template>
    <v-text-field :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
        placeholder="Rechercher" variant="outlined" density="comfortable" prepend-inner-icon="mdi-magnify"
        :append-inner-icon="showClearButton ? 'mdi-close' : undefined" @click:append-inner="$emit('close')"
        @blur="$emit('blur')" rounded="lg" hide-details class="search-bar" />
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
