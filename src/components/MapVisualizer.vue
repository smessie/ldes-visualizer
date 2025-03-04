<template>
    <MDBContainer class="mt-5">
        <h1 class="mb-3">LDES Visualizer</h1>
        <MDBRow>
            <MDBCol>
                <MDBInput label="LDES ID" v-model="form.ldes"></MDBInput>
            </MDBCol>
            <MDBCol>
                <VueDatePicker v-model="form.range" label="Date range" range></VueDatePicker>
            </MDBCol>
            <MDBCol>
                <MDBBtn @click="fetchData" color="primary">Visualize</MDBBtn>
            </MDBCol>
        </MDBRow>
        <div class="mt-3">
            <small v-if="loading.start && loading.end">Loaded {{ members.length }} members in
                {{ loading.end - loading.start }}ms.</small>
            <small v-else-if="loading.start">Loading {{ members.length }} members in {{ loading.now - loading.start
                }}ms...</small>
        </div>
        <div style="height: 75vh; width: 100%" class="mt-1">
            <l-map ref="map" :zoom="zoom" :center="[47.41322, -1.219482]"
                   :options="{ preferCanvas: true, chunkLoading: true }">
                <l-tile-layer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    layer-type="base"
                    name="OpenStreetMap"
                ></l-tile-layer>

                <l-marker-cluster-group>
                    <l-circle-marker v-for="member of members" :lat-lng="member.coords" :key="member.id.value">
                        <l-popup>{{ member.label }}</l-popup>
                    </l-circle-marker>
                </l-marker-cluster-group>
            </l-map>
        </div>
    </MDBContainer>
</template>

<script lang="ts">
import L from "leaflet";
import { defineComponent } from "vue";
import "leaflet/dist/leaflet.css";
import "vue-leaflet-markercluster/dist/style.css";
import { LCircleMarker, LMap, LPopup, LTileLayer } from "@vue-leaflet/vue-leaflet";
import { LMarkerClusterGroup } from "vue-leaflet-markercluster";
import { MDBBtn, MDBCol, MDBContainer, MDBInput, MDBRow } from "mdb-vue-ui-kit";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import type { MapMember, WorkerMessage } from "@/main.ts";

globalThis.L = L;


export default defineComponent({
    name: "MapVisualizer",
    components: {
        LMap,
        LTileLayer,
        LCircleMarker,
        LPopup,
        LMarkerClusterGroup,
        MDBContainer,
        MDBRow,
        MDBCol,
        MDBInput,
        VueDatePicker,
        MDBBtn,
    },
    data() {
        return {
            zoom: 2,
            form: {
                ldes: "",
                range: null as [Date, Date] | null,
            },
            members: [] as MapMember[],
            loading: {
                start: undefined as number | undefined,
                end: undefined as number | undefined,
                now: Date.now(),
            },
            worker: undefined as Worker | undefined,
        };
    },
    methods: {
        async fetchData() {
            if (this.form.ldes?.trim() === "") {
                return;
            }
            this.members = [];
            this.loading.start = undefined;
            this.loading.end = undefined;
            this.worker?.terminate();
            console.log(`fetching data from ${this.form.ldes}`);

            this.loading.start = Date.now();
            this.loading.now = Date.now();

            // Update loading.now every 100ms until loading.end is set
            const interval = setInterval(() => {
                if (this.loading.end) {
                    clearInterval(interval);
                } else {
                    this.loading.now = Date.now();
                }
            }, 100);

            this.worker = new Worker(new URL("../assets/fetchDataWorker.ts", import.meta.url), {
                type: "module",
            });

            let bufferNewMembers = [] as MapMember[];
            let lastBufferAdded = 0;
            this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
                if (event.data.member) {
                    bufferNewMembers.push(event.data.member);

                    // Only add the new members to the DOM every second
                    if (lastBufferAdded + 1000 < Date.now()) {
                        this.members.push(...bufferNewMembers);
                        bufferNewMembers = [];
                        lastBufferAdded = Date.now();
                    }
                }
                if (event.data.end) {
                    this.members.push(...bufferNewMembers);
                    bufferNewMembers = [];
                    this.loading.end = event.data.end;
                }
            };

            this.worker.postMessage({
                url: this.form.ldes,
                range: this.form.range ? [this.form.range[0].toISOString(), this.form.range[1].toISOString()] : undefined,
            });
        },
    },
});
</script>

<style scoped>
#app {
    height: 100vh;
}
</style>
