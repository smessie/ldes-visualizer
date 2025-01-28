<template>
    <div style="height: 600px; width: 800px">
        <l-map ref="map" :zoom="zoom" :center="[47.41322, -1.219482]">
            <l-tile-layer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                layer-type="base"
                name="OpenStreetMap"
            ></l-tile-layer>
        </l-map>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";

export default defineComponent({
    name: "MapVisualizer",
    components: {
        LMap,
        LTileLayer,
    },
    data() {
        return {
            zoom: 2,
        };
    },
});
</script>

<style scoped>
#app {
    height: 100vh;
}
</style>
