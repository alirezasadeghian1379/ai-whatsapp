<script setup lang="ts">const{locale,isRtl,isDark}=useAppPreferences();useHead(()=>({htmlAttrs:{lang:locale.value,dir:isRtl.value?"rtl":"ltr",class:isDark.value?"dark":""}}))</script>
<template><NuxtLoadingIndicator color="#128965" :height="3"/><NuxtLayout><NuxtPage/></NuxtLayout></template>
