# WebGPU Recorder

**Note** The WebGPU Recorder tool is incorperated into my general WebGPU debugging tool, [WebGPU Inspector](https://github.com/brendan-duncan/webgpu_inspector).

---

WebGPU Recorder is a debugging tool for WebGPU.

It is a playback recorder, designed to capture all WebGPU commands and data, with the ability to play back the commands to recreate the render.

It captures all WebGPU commands, buffers, and textures, over a given number of frames. It will then generate an HTML file containing javascript with all of the WebGPU commands recorded. This generated HTML file can be opened in the browser to play back the recording.

This can be used to diagnose issues with WebGPU rendering by eliminating everything but the raw WebGPU commands. This is also very helpful for submitting self-contained reproduction examples for bug reports.

## Usage

### Loading and Starting the WebGPU Recorder

The WebGPU Recorder script is an ES6 module and can be loaded via

```html
<script id="webgpu_recorder" type="module">
    import {WebGPURecorder} from "webgpu_recorder.js";
    new WebGPURecorder(); // Create and start the WebGPU Recorder
</script>
````

### From NPM

webgpu_recorder can be loaded via NPM

```
npm install webgpu_recorder
```

Then you can import the module from
```javascript
import {WebGPURecorder} from "webgpu_recorder/webgpu_recorder.js";
new WebGPURecorder(); // Create and start the WebGPU Recorder
```

### From CDN

The webgpu_recorder.js script can be loaded from a CDN so you don't have to store it locally and make sure you're always using the latest version of the recorder.

```html
<script id="webgpu_recorder" type="module">
    import {WebGPURecorder} from "https://cdn.jsdelivr.net/gh/brendan-duncan/webgpu_recorder/webgpu_recorder.js";
    new WebGPURecorder(); // Create and start the WebGPU Recorder
</script>
````

### Starting The Recorder

The **WebGPURecorder** class will start the recorder with the options provided to the constructor.

Because the recorder needs to record all commands and data, it starts recording as soon as it is constructed, and will continue recording for the maximum number of frames. **The recorder should be created before any rendering code starts so it has a chance to wrap WebGPU.**

The recording will download automatically as an HTML file with embedded Javascript after the maximum number of frames have been recorded or when `generateOutput` is called (see [example](test/test3.html)).

You can optionally configure the recorder

```javascript
new WebGPURecorder({
    "frames": 100,
    "export": "WebGPURecord",
    "removeUnusedResources": false,
    "download": true
});
```

Where

* **frames**: the maximum number of frames to record.
* **export**: the name of the generated HTML file, as ${export}.html
* **removeUnusedResources**: if true, resource commands not needed for rendering are removed, otherwise all commands are recorded.
* **download**: if true, the html will be downloaded.

## Recording From a Web Worker

Recording from a web worker rendering to an offscreen canvas requires a little more work, due to restrictions of web workers.

When WebGPURecorder is run from a worker thread, instead of downloading the generated html, it will post a message back to the main thread with the data. The main thread can listen to the worker messages, and when it recieves the "webgpu_record_data" message, it can call the "webgpu_recorder_download_data" function to trigger the browser to download the generated html file.

#### Worker.html

```html
<script type="module">
    import { webgpu_recorder_download_data } from "webgpu_recorder.js";
    const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    worker.addEventListener('message', (ev) => {
        switch (ev.data.type) {
            case "webgpu_record_data":
                webgpu_recorder_download_data(ev.data.data, ev.data.filename);
                break;
        }
    });
    // ...
</script>
```

#### Worker.js

```html
import {WebGPURecorder} from "webgpu_recorder.js";
async function run(canvas) {
    new WebGPURecorder({
        "frames": 10,
        "export": "WebGPURecord"});
    // ...
}
```

## Play The Recording

The recording is a self-contained HTML file so you don't need a local server to view it.

Open the downloaded HTML file in a WebGPU capable browser to play back the recording.

***
*A recording from a WebGPU game:*

![Recording Screenshot](test/test2.png)
![Recording Code](test/test2_code.png)

***

### Notes

It is necessary to start the recorder prior to rendering so that all WebGPU objects are correctly recorded.

It is best suited for small tests, as the recorded data can get quite large.

All buffer and texture data is stored in the recording. The recording stores the data in base64 format to reduce file size, but it can still make the recording files large.

External textures in WebGPU can't be captured. _copyExternalImageToTexture_ will get converted to _writeTexture_ in the recording, with the external image data getting converted to raw data.

External video textures can't currently be recorded.
