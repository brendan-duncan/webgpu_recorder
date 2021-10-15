# WebGPURecorder

Debugging tool for WebGPU. It records all WebGPU commands, buffers, and textures
and generates a recording HTML file with those commands that will play back the
recording. This can be used to diagnose issues with WebGPU rendering by
eliminating everything but the raw WebGPU commands.

## Usage

* Copy the file **webgpu_recorder.js** to your HTML project.
* Add `<script src="webgpu_recorder.js"></script>` to your HTML (with the *src* path being where you copied *webgpu_recorder.js*).
* Open the HTML in a browser that supports WebGPU, as you would normally.
* The recording starts right away and record all subsequent frames.
* The recording will automatically download as an HTML file after the maximum number of recorded frames have been recorded.

## Play The Recording

* Open the downloaded HTML file in a WebGPU capable browser to play back the recording.

## Recording Settings

You can change the default configuration of the WebGPURecorder by adding the following to your HTML file.

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

## TODO

* Figure out a way to start recording from an arbitrary frame and continue recording until you
pause, similar to Spector.js. Because objects like buffers and textures may be created or
deleted at arbitrary frames previously, we would need to track those even when recording isn't enabled.
