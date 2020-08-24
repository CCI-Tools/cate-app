/*
 * This modules allows for streaming GeoJSON through a new process.
 * It is designed as a WebWorker (see https://developer.mozilla.org/en-US/docs/Web/API/Worker)
 * and uses OboeJS for JSON streaming.
 *
 * @author Norman Fomferra
 */

importScripts('../../oboe-browser.js');
const ctx: Worker = self as any;

const oboe = (self as any).oboe;

ctx.onmessage = function (event: MessageEvent) {
    // console.log('Message received from main script:', event);
    streamFeatures(event.data);
};

function sendData(data) {
    ctx.postMessage(data);
}

function streamFeatures(url) {
    const featurePackCount = 25;
    let features = [];

    oboe(url)
        .node('features.*', function (feature) {
            if (features.length === featurePackCount) {
                sendData(features);
                features = [];
            }
            features.push(feature);
            // returning oboe.drop means to oboe, it should forget the feature and thus save memory.
            return oboe.drop;
        })
        .done(function (featureCollection) {
            if (features.length) {
                sendData(features);
            }
            // Send sentinel
            sendData(null);
        });
}

// https://stackoverflow.com/questions/56577201/why-is-isolatedmodules-error-fixed-by-any-import/56577324
export {};