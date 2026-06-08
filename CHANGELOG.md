## v1.2.4

* **The recorder fully detaches when a recording finishes.** Previously the recorder stayed attached
  to WebGPU after a recording completed: every wrapped GPU method kept paying for an argument copy and
  the pre/post-call hooks (which only early-returned), and the patched `requestAnimationFrame`,
  `document.createElement`, and per-canvas `getContext` kept firing — so the page still carried
  per-call overhead. Now, once the recording data has been generated, streamed to any connected viewer,
  and downloaded, the recorder restores all of the native WebGPU prototype methods and the globals it
  patched, leaving zero further overhead on the page. In continuous / multi-frame stateful recording
  modes the recorder stays attached between captures as before, detaching only after the final capture.

* **Page overlay updates.** The overlay no longer leaves a red "idle" dot once recording is done — it
  is removed entirely when the recorder detaches. While the recording data is being generated,
  streamed, and downloaded, the overlay shows a spinning busy indicator labelled
  "Generating recording data…".
