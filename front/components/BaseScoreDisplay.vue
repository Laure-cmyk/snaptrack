<script setup>
defineProps({
    score: {
        type: Number,
        required: true
    },
    label: {
        type: String,
        default: 'Total de points'
    },
    description: {
        type: String,
        default: ''
    },
    size: {
        type: String,
        default: 'medium', // 'small', 'medium', 'large'
        validator: (value) => ['small', 'medium', 'large'].includes(value)
    }
})

const sizeClasses = {
    small: {
        container: 'pa-3',
        label: 'text-caption',
        number: 'text-h5'
    },
    medium: {
        container: 'pa-4',
        label: 'text-subtitle-2',
        number: 'text-h3'
    },
    large: {
        container: 'pa-5',
        label: 'text-subtitle-1',
        number: 'text-h2'
    }
}
</script>

<template>
    <div :class="[sizeClasses[size].container, 'bg-indigo-lighten-5 rounded-lg text-center']">
        <p :class="[sizeClasses[size].label, 'mb-1']">{{ label }}</p>
        <div :class="[sizeClasses[size].number, 'font-weight-bold text-indigo-darken-1']">
            {{ score }} pts
        </div>
        <p v-if="description" class="text-caption text-grey-darken-1 mt-1 mb-0">{{ description }}</p>
    </div>
</template>

<style scoped></style>
