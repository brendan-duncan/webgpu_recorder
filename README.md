# WebGPU Recorder

WebGPU Recorder is a debugging tool for WebGPU.

It captures all WebGPU commands, buffers, and textures, over a given number of frames.
It will then generate an HTML file containing javascript with all of the WebGPU commands recorded.
This generated HTML file can be opened in the browser to play back the recording.

This can be used to diagnose issues with WebGPU rendering by eliminating everything but the raw WebGPU commands.

## Usage

* Copy the file **webgpu_recorder.js** to your HTML project and add `<script src="webgpu_recorder.js"></script>` to your HTML (with the *src* path being where you copied *webgpu_recorder.js*).
* **Alternatively**, you can load the script through a CDN so you don't have to download it. 
`<script src="https://cdn.jsdelivr.net/gh/brendan-duncan/webgpu_recorder/webgpu_recorder.js"></script>`. This will make sure you're using the latest version of the recorder.

* **This script should be added before any rendering code starts so it has a chance to wrap WebGPU.**
* Open the HTML in a browser that supports WebGPU, as you would normally.
* The recording starts right away and it will record all subsequent frames.
* The recording will download automatically as an HTML file with embedded Javascript after the maximum number of frames have been recorded.

## Play The Recording

* Open the downloaded HTML file in a WebGPU capable browser to play back the recording.
* It's a self-contained HTML file so you don't need a local server to view it.

## Recorder Settings

You can change the default configuration of the WebGPU Recorder by adding the following to your HTML file.

```html
<script id="webgpu_recorder" type="application/json">{
        "frames": 100,
        "export": "WebGPURecord",
        "width": 800,
        "height": 600
}</script>
```

* **frames** is the number of frames to record.
* **export** is the basename of the generated HTML file.
* **width** is the width of the canvas in the recording. This should match the width of the original canvas.
* **height** is the height of the canvas in the recording. This should match the height of the original canvas.

***
*A recording from a WebGPU game:*

![Recording Screenshot](test/test2.png)
![Recording Code](test/test2_code.png)

***

### Notes

* All buffer and texture data is stored in the recording. The recording stores the data in base64
format to reduce file size, but it can still make the recording files quite large.
* External textures in WebGPU can't be captured. _copyExternalImageToTexture_ will get converted
to _writeTexture_ in the recording, with the external image data getting converted to raw data.


### ToDo

* Figure out a way to start recording from an arbitrary frame and continue recording until you
pause, similar to Spector.js. Because objects like buffers and textures may be created or
deleted at arbitrary frames previously, we would need to track those even when recording isn't enabled.

* Record analytics of what commands are used. This could include a start/stop analytics recording
feature similar to Spector.js. This could include: the list of commands for a given frame, in order;
what objects are used; the amount of data used; resulting render pass images.
