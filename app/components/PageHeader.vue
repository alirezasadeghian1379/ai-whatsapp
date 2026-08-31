<script setup lang="ts">defineProps<{title:string;description:string}>()</script>
<template><header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div class="animate-fade-up"><h1 class="page-title">{{title}}</h1><p class="muted mt-2">{{description}}</p></div><div class="flex items-center gap-2"><slot/></div></header></template>
