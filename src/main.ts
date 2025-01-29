import "./assets/main.css";
import 'mdb-vue-ui-kit/css/mdb.min.css';

import { createApp } from "vue";
import App from "./App.vue";

import process from "process";
import { setImmediate } from "timers";
import type { Term } from "@rdfjs/types";

if (typeof globalThis !== "undefined" && !globalThis.process) {
    globalThis.process = process;
    globalThis.setImmediate = setImmediate;
}

createApp(App).mount("#app");

export type MapMember = {
    id: Term;
    label: string;
    modified: Date;
    coords: [number, number];
}
