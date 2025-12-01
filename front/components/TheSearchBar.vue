<template>
    <v-text-field :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
        placeholder="Chercher un parcours" variant="outlined" density="comfortable" prepend-inner-icon="mdi-magnify"
        rounded="lg" hide-details class="search-bar" />
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.search-bar {
    background-color: white;
}
</style>
