import { type Config, enhanced_fetch, replicateLDES } from "ldes-client";
import type { Quad } from "@rdfjs/types";
import { DC } from "@treecg/types";
import type { WorkerMessage } from "@/main.ts";

self.onmessage = async (event) => {
    const { url, range } = event.data;
    console.log(event.data);
    await fetchData(url, range, postMessage);
};

async function fetchData(url: string, range: [Date, Date] | undefined, postMessage: (message: WorkerMessage) => void) {

    const config = {
        url: url,
        polling: false,
        fetch: enhanced_fetch({
            safe: true,
        }),
    };
    if (range) {
        (<Partial<Config>>config).after = new Date(range[0]);
        (<Partial<Config>>config).before = new Date(range[1]);
    }

    const ldesClient = replicateLDES(config);

    for await (const element of makeAsyncIterable(ldesClient.stream())) {
        if (element) {
            const labelQuad = element.quads.find((quad: Quad) => quad.predicate.value === "http://www.w3.org/2004/02/skos/core#prefLabel")
                || element.quads.find((quad: Quad) => quad.predicate.value === DC.title);
            const centroidQuad = element.quads.find((quad: Quad) => quad.predicate.value === "http://www.w3.org/ns/dcat#centroid")
                || element.quads.find((quad: Quad) => quad.predicate.value === "http://www.opengis.net/ont/geosparql#asWKT");

            if (centroidQuad) {
                if (centroidQuad.object.datatype.value === "http://www.opengis.net/ont/geosparql#wktLiteral") {
                    const wkt = centroidQuad.object.value;
                    const coordinates = wkt.match(/POINT\s*\(([^)]+)\)/)[1].split(" ");
                    postMessage({
                        member: {
                            id: element.id,
                            label: labelQuad?.object.value,
                            modified: element.timestamp,
                            coords: [parseFloat(coordinates[1]), parseFloat(coordinates[0])],
                        },
                    });
                }
            }
        }
    }

    postMessage({
        end: Date.now(),
    });
}

function makeAsyncIterable(stream: ReadableStream) {
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
}
