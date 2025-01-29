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
            <small v-if="loading.start && loading.end">Loaded {{ members.length }} members in {{ loading.end - loading.start }}ms.</small>
            <small v-else-if="loading.start">Loading {{ members.length }} members in {{ loading.now - loading.start }}ms...</small>
        </div>
        <div style="height: 75vh; width: 100%" class="mt-1">
            <l-map ref="map" :zoom="zoom" :center="[47.41322, -1.219482]">
                <l-tile-layer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    layer-type="base"
                    name="OpenStreetMap"
                ></l-tile-layer>

                <l-marker v-for="member of members" :lat-lng="member.coords" :key="member.id.value">
                    <l-popup>{{ member.label }}</l-popup>
                </l-marker>
            </l-map>
        </div>
    </MDBContainer>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import "leaflet/dist/leaflet.css";
import { LMap, LMarker, LPopup, LTileLayer } from "@vue-leaflet/vue-leaflet";
import { MDBBtn, MDBCol, MDBContainer, MDBInput, MDBRow } from "mdb-vue-ui-kit";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import { type Config, replicateLDES } from "ldes-client";
import type { MapMember } from "@/main.ts";
import type { Quad } from "@rdfjs/types";


export default defineComponent({
    name: "MapVisualizer",
    components: {
        LMap,
        LTileLayer,
        LMarker,
        LPopup,
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
                range: null,
            },
            members: [] as MapMember[],
            loading: {
                start: undefined as number | undefined,
                end: undefined as number | undefined,
                now: Date.now(),
            },
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
            console.log(`fetching data from ${this.form.ldes}`);

            const config = {
                url: this.form.ldes,
                polling: false,
            };
            if (this.form.range) {
                (<Partial<Config>>config).after = new Date(this.form.range[0]);
                (<Partial<Config>>config).before = new Date(this.form.range[1]);
            }

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

            const ldesClient = replicateLDES(config);

            for await (const element of this.makeAsyncIterable(ldesClient.stream())) {
                if (element) {
                    const labelQuad = element.quads.find((quad: Quad) => quad.predicate.value === "http://www.w3.org/2004/02/skos/core#prefLabel");
                    const centroidQuad = element.quads.find((quad: Quad) => quad.predicate.value === "http://www.w3.org/ns/dcat#centroid");

                    if (centroidQuad) {
                        if (centroidQuad.object.datatype.value === "http://www.opengis.net/ont/geosparql#wktLiteral") {
                            const wkt = centroidQuad.object.value;
                            const coordinates = wkt.match(/POINT \(([^)]+)\)/)[1].split(" ");
                            this.members.push({
                                id: element.id,
                                label: labelQuad?.object.value,
                                modified: element.timestamp,
                                coords: [parseFloat(coordinates[1]), parseFloat(coordinates[0])],
                            });
                        }
                    }
                }
            }

            this.loading.end = Date.now();
        },
        makeAsyncIterable(stream: ReadableStream) {
            const reader = stream.getReader();
            return {
                [Symbol.asyncIterator]() {
                    return {
                        async next() {
                            const { done, value } = await reader.read();
                            if (done) {
                                reader.releaseLock();
                                return { done: true };
                            }
                            return { done: false, value };
                        },
                    };
                },
            };
        },
    },
});
</script>

<style scoped>
#app {
    height: 100vh;
}
</style>
