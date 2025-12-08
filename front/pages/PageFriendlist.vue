<script setup>
import TheFriendlist from '../components/TheFriendlist.vue';
import { ref } from 'vue';

const tab = ref(null);
</script>
<template>
  <v-card>
    <v-tabs v-model="tab" direction="horizontal">
      <v-tab prepend-icon="mdi-account" text="Amis" value="friends"></v-tab>
      <v-tab prepend-icon="mdi-lock" text="Groupes" value="groups"></v-tab>
    </v-tabs>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="friends">
        <v-card flat>
          <TheFriendlist />
        </v-card>
      </v-tabs-window-item>

      <v-tabs-window-item value="groups">
        <v-card flat>
          <v-card-text>
            <p>
              Morbi nec metus. Suspendisse faucibus, nunc et pellentesque egestas, lacus ante
              convallis tellus, vitae iaculis lacus elit id tortor. Sed mollis, eros et ultrices
              tempus, mauris ipsum aliquam libero, non adipiscing dolor urna a orci. Curabitur
              ligula sapien, tincidunt non, euismod vitae, posuere imperdiet, leo. Nunc sed turpis.
            </p>

            <p>
              Suspendisse feugiat. Suspendisse faucibus, nunc et pellentesque egestas, lacus ante
              convallis tellus, vitae iaculis lacus elit id tortor. Proin viverra, ligula sit amet
              ultrices semper, ligula arcu tristique sapien, a accumsan nisi mauris ac eros. In hac
              habitasse platea dictumst. Fusce ac felis sit amet ligula pharetra condimentum.
            </p>

            <p>
              Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, quis gravida magna
              mi a libero. Nam commodo suscipit quam. In consectetuer turpis ut velit. Sed cursus
              turpis vitae tortor. Aliquam eu nunc.
            </p>

            <p>
              Etiam ut purus mattis mauris sodales aliquam. Ut varius tincidunt libero. Aenean
              viverra rhoncus pede. Duis leo. Fusce fermentum odio nec arcu.
            </p>

            <p class="mb-0">
              Donec venenatis vulputate lorem. Aenean viverra rhoncus pede. In dui magna, posuere
              eget, vestibulum et, tempor auctor, justo. Fusce commodo aliquam arcu. Suspendisse
              enim turpis, dictum sed, iaculis a, condimentum nec, nisi.
            </p>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>
  </v-card>
  <!-- <TheFriendlist/> -->
</template>
<style scoped></style>
