import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import vueDevTools from "vite-plugin-vue-devtools";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vite.dev/config/
export default defineConfig({
    css: {
        devSourcemap: true,
    },
    plugins: [
        vue(),
        vueJsx(),
        vueDevTools(),
        nodePolyfills({
            globals: {
                process: true,
            },
            protocolImports: true,
        }),
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            "process/": 'process/browser',  // Needed to resolve "TypeError: process.nextTick is not a function" in underlying rdf-dereference dependency of ldes-client.
            "fs/promises": "fs",
        },
    },
});
