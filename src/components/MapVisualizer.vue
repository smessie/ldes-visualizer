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
        <div style="height: 80vh; width: 100%" class="mt-3">
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
import { type Config, LeafCondition, replicateLDES } from "ldes-client";
import type { MapMember } from "@/main.ts";
import type { Quad } from "@rdfjs/types";
import { DC, TREE, XSD } from "@treecg/types";
import { pred } from "rdf-lens";
import { DataFactory } from "rdf-data-factory";

const DF = new DataFactory();

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
        };
    },
    methods: {
        async fetchData() {
            if (this.form.ldes?.trim() === "") {
                return;
            }
            this.members = [];
            console.log(`fetching data from ${this.form.ldes}`);

            const timestampTerm = DF.namedNode(DC.modified);
            const path = pred(timestampTerm);

            const config={
                url: this.form.ldes,
                polling: false,
            };
            if (this.form.range) {
                console.log('Setting range condition');
                const condition = new LeafCondition({
                    relationType: DF.namedNode(TREE.GreaterThanOrEqualToRelation),
                    value: DF.literal(new Date(this.form.range[0]).toISOString(), DF.namedNode(XSD.dateTime)),
                    compareType: 'date',
                    path: path,
                    pathQuads: { entry: timestampTerm, quads: [] },
                    defaultTimezone: 'Z',
                });
                condition.range.add(new Date(this.form.range[1]), TREE.LessThanRelation, XSD.dateTime);
                console.log(new Date(this.form.range[0]).toISOString(), new Date(this.form.range[1]).toISOString());

                (<Partial<Config>>config).condition = condition;
            }

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
