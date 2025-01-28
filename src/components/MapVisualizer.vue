<template>
    <MDBContainer class="mt-5">

        <MDBRow>
            <MDBCol>
                <MDBInput label="LDES ID" v-model="form.ldes"></MDBInput>
            </MDBCol>
            <MDBCol>
                <VueDatePicker v-model="form.range" label="Date range" range></VueDatePicker>
            </MDBCol>
        </MDBRow>
        <div style="height: 80vh; width: 100%" class="mt-3">
            <l-map ref="map" :zoom="zoom" :center="[47.41322, -1.219482]">
                <l-tile-layer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    layer-type="base"
                    name="OpenStreetMap"
                ></l-tile-layer>
            </l-map>
        </div>
    </MDBContainer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import "leaflet/dist/leaflet.css";
import { LMap, LTileLayer } from "@vue-leaflet/vue-leaflet";
import { MDBCol, MDBContainer, MDBInput, MDBRow } from "mdb-vue-ui-kit";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

export default defineComponent({
    name: "MapVisualizer",
    components: {
        LMap,
        LTileLayer,
        MDBContainer,
        MDBRow,
        MDBCol,
        MDBInput,
        VueDatePicker,
    },
    data() {
        return {
            zoom: 2,
            form: {
                ldes: "",
                range: null,
            },
        };
    },
});
</script>

<style scoped>
#app {
    height: 100vh;
}
</style>
