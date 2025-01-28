import "./assets/main.css";
import 'mdb-vue-ui-kit/css/mdb.min.css';

import { createApp } from "vue";
import App from "./App.vue";
// https://github.com/vue-leaflet/vue-leaflet/issues/278#issuecomment-1445996448
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import L from "leaflet";

createApp(App).mount("#app");
