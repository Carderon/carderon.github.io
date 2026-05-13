<template>
  <RouterView />
</template>

<script setup lang="ts">
// Le démarrage du `ClockEngine` est volontairement déclenché dans `Game.vue`
// (et arrêté à la sortie), pour que le temps ne s'écoule pas pendant le menu.
</script>
