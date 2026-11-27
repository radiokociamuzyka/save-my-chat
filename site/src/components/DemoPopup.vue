<!-- The extension's popup, on the site with made-up answers (demo.js). -->
<script setup>
import "./demo.js";
import "bulma/css/bulma.css";
import ToolbarPopup from "../../../src/popup/ToolbarPopup.vue";
</script>

<template>
	<div class="box p-0 demo-popup"><ToolbarPopup /></div>
</template>

<style scoped>
.demo-popup {
	width: fit-content;
}
</style>
