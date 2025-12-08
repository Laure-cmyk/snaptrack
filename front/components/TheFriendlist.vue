<script setup>
import { ref } from 'vue';
/* import { usefetchJson } from '../composables/useFetchJson'; */

/* const {
data:
loading:
error: 
} = useFetchJson(); */

const STATUS_ADD = 'Add';
const requestState = ref(STATUS_ADD);
// change ref() for api responses
// or give STATUS_ADD to fetchJson
const handleClick = () => {
  // logic
};
</script>
<template>
  <v-list lines="two">
    <v-list-item v-for="n in 3" :key="n" :title="'Username ' + n">
      <template v-slot:append>
        <v-btn size="small" variant="outlined" @click="handleClick">{{ requestState }}</v-btn>
      </template>
      <v-divider></v-divider>
    </v-list-item>
  </v-list>
</template>
