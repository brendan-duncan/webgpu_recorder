// webgpu_player.js
//
// Loads a binary recording produced by webgpu_recorder.js (output: "binary") and replays it by
// interpreting the recorded command stream against a live WebGPU device. The recording is the same
// structured form the recorder uses internally — command objects { object, method, result, args,
// async } plus raw data blobs — so this player is a generic interpreter (the generated HTML is just
// a text-compiled version of the same thing).
//
// Usage:
//   import { WebGPUPlayer } from "./webgpu_player.js";
//   const player = new WebGPUPlayer(arrayBuffer);
//   await player.load(canvas);
//   await player.executeAll();                 // replay the whole recording
//   await player.executeToCommand(42);         // replay up to frame-command 42 (auto-submits)
//   player.getCommandInfo(42);                 // inspect a command
//   player.getCommandData(42);                 // the data a command uploads
//
// The binary container is:
//   "WGPR" | version:u32 | headerLen:u32 | header(JSON utf8) | rawDataSection

const _typedArrayCtors = {
  "Int8Array": Int8Array,
  "Uint8Array": Uint8Array,
  "Uint8ClampedArray": Uint8ClampedArray,
  "Int16Array": Int16Array,
  "Uint16Array": Uint16Array,
  "Int32Array": Int32Array,
  "Uint32Array": Uint32Array,
  "Float32Array": Float32Array,
  "Float64Array": Float64Array
};

// Parse a binary recording into its header and raw data section.
export function parseWebGPURecording(arrayBuffer) {
  const u8 = new Uint8Array(arrayBuffer);
  if (u8.length < 12 || u8[0] !== 0x57 || u8[1] !== 0x47 || u8[2] !== 0x50 || u8[3] !== 0x52) {
    throw new Error("Not a WebGPU recording (bad magic).");
  }
  const view = new DataView(arrayBuffer);
  const version = view.getUint32(4, true);
  const headerLength = view.getUint32(8, true);
  const headerBytes = new Uint8Array(arrayBuffer, 12, headerLength);
  const header = JSON.parse(new TextDecoder().decode(headerBytes));
  const dataBytes = new Uint8Array(arrayBuffer, 12 + headerLength);
  return { version, header, dataBytes };
}

export class WebGPUPlayer {
  constructor(arrayBuffer) {
    const parsed = parseWebGPURecording(arrayBuffer);
    this.version = parsed.version;
    this.header = parsed.header;
    this._dataBytes = parsed.dataBytes;

    this._initCommands = this.header.init || [];

    // Flatten the per-frame command lists into one indexable stream, remembering each command's
    // frame and position within that frame.
    this._frameCommands = [];
    const frames = this.header.frames || [];
    for (let f = 0; f < frames.length; ++f) {
      const list = frames[f];
      for (let i = 0; i < list.length; ++i) {
        this._frameCommands.push({ cmd: list[i], frame: f, indexInFrame: i });
      }
    }

    // var name -> live GPU object.
    this.objects = {};
    // lazily-built TypedArrays for the data blobs (immutable, cached across replays).
    this._dataCache = [];

    // Replay trackers for partial-execution auto-submit.
    this._openEncoder = null;
    this._openPass = null;
    this._pendingCommandBuffer = null;

    this._initDone = false;
    this._postInitObjects = null;

    this._reviver = (key, value) => {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        if (typeof value.__id === "string") {
          return this.objects[value.__id];
        }
        if (typeof value.__data === "number") {
          return this._typedArray(value.__data);
        }
      }
      return value;
    };
  }

  // --- Introspection ---

  getFrameCount() {
    return (this.header.frames || []).length;
  }

  getCommandCount() {
    return this._frameCommands.length;
  }

  getInitCommandCount() {
    return this._initCommands.length;
  }

  getCommandInfo(index) {
    const fc = this._frameCommands[index];
    if (!fc) {
      return null;
    }
    return this._commandInfo(fc.cmd, { frame: fc.frame, indexInFrame: fc.indexInFrame });
  }

  getInitCommandInfo(index) {
    const cmd = this._initCommands[index];
    if (!cmd) {
      return null;
    }
    return this._commandInfo(cmd, { frame: -1, indexInFrame: index });
  }

  _commandInfo(cmd, extra) {
    let args;
    try {
      args = cmd.args && cmd.args !== "[]" ? JSON.parse(cmd.args) : [];
    } catch (e) {
      // requestDevice's recorded args are intentionally not valid JSON (they reference the
      // generated requiredFeatures/requiredLimits identifiers); keep the raw string.
      args = cmd.args;
    }
    return {
      frame: extra.frame,
      indexInFrame: extra.indexInFrame,
      object: cmd.object,
      method: cmd.method,
      result: cmd.result,
      async: !!cmd.async && cmd.async !== "",
      args,
      dataIndices: this._dataIndices(args)
    };
  }

  _dataIndices(parsedArgs) {
    const indices = [];
    const walk = (v) => {
      if (!v || typeof v !== "object") {
        return;
      }
      if (typeof v.__data === "number") {
        indices.push(v.__data);
        return;
      }
      for (const k in v) {
        walk(v[k]);
      }
    };
    walk(parsedArgs);
    return indices;
  }

  // The TypedArray bytes for data blob `index`.
  getData(index) {
    return this._typedArray(index);
  }

  // The data blobs referenced by frame-command `index`, e.g. the bytes a writeBuffer uploads.
  getCommandData(index) {
    const info = this.getCommandInfo(index);
    if (!info) {
      return [];
    }
    return info.dataIndices.map((di) => ({
      index: di,
      type: this.header.data[di] ? this.header.data[di].type : "",
      data: this._typedArray(di)
    }));
  }

  _typedArray(index) {
    if (this._dataCache[index] !== undefined) {
      return this._dataCache[index];
    }
    const d = this.header.data[index];
    let arr;
    if (!d || d.length === 0) {
      arr = new Uint8Array(0);
    } else {
      // Copy the slice into its own ArrayBuffer so the typed array is aligned and standalone.
      const slice = this._dataBytes.slice(d.offset, d.offset + d.length);
      const Ctor = _typedArrayCtors[d.type] || Uint8Array;
      arr = new Ctor(slice.buffer, 0, slice.byteLength / Ctor.BYTES_PER_ELEMENT);
    }
    this._dataCache[index] = arr;
    return arr;
  }

  // --- Setup ---

  async load(canvas) {
    if (!navigator.gpu) {
      throw new Error("WebGPU is not available.");
    }
    this.canvas = canvas;
    this.adapter = await navigator.gpu.requestAdapter();
    if (!this.adapter) {
      throw new Error("Could not get a WebGPU adapter.");
    }

    // Mirror the generated HTML: enable everything the adapter supports so the recording's
    // device-dependent calls succeed.
    const requiredFeatures = [];
    for (const f of this.adapter.features) {
      requiredFeatures.push(f);
    }
    const requiredLimits = {};
    const exclude = new Set(["minSubgroupSize", "maxSubgroupSize"]);
    for (const x in this.adapter.limits) {
      if (!exclude.has(x)) {
        requiredLimits[x] = this.adapter.limits[x];
      }
    }
    this.device = await this.adapter.requestDevice({ requiredFeatures, requiredLimits });

    this.context = canvas.getContext("webgpu");
    if (this.header.canvasWidth) {
      canvas.width = this.header.canvasWidth;
    }
    if (this.header.canvasHeight) {
      canvas.height = this.header.canvasHeight;
    }
    this._loaded = true;
  }

  _ensureLoaded() {
    if (!this._loaded) {
      throw new Error("WebGPUPlayer.load(canvas) must be called and awaited first.");
    }
  }

  // --- Execution ---

  // Replay the entire recording (all init + all frame commands), as recorded.
  async executeAll() {
    this._ensureLoaded();
    await this._ensureInit();
    for (const fc of this._frameCommands) {
      await this._exec(fc.cmd);
    }
  }

  // Replay up to and including frame-command `index`. If that command sits inside a render/compute
  // pass or an unfinished command encoder, the open pass is ended, the encoder finished, and the
  // command buffer submitted, so the partial frame is presented.
  async executeToCommand(index) {
    this._ensureLoaded();
    if (this._frameCommands.length === 0) {
      await this._ensureInit();
      return;
    }
    if (index < 0) {
      index = 0;
    }
    if (index >= this._frameCommands.length) {
      index = this._frameCommands.length - 1;
    }
    await this._ensureInit();
    for (let i = 0; i <= index; ++i) {
      await this._exec(this._frameCommands[i].cmd);
    }
    await this._finalizePartial();
  }

  // Prepare for sequential frame playback: run the recording's setup (once, cached) and reset the
  // live state to the post-init snapshot. Call once before driving renderFrame() in a loop.
  async resetForPlayback() {
    this._ensureLoaded();
    await this._ensureInit();
  }

  // Execute the commands of a single recorded frame on the current state (does not reset between
  // frames), so calling renderFrame(0), renderFrame(1), ... in sequence plays the recording as an
  // animation, mirroring how the generated HTML advances frame functions. Pair with
  // resetForPlayback() at the start.
  async renderFrame(frameIndex) {
    this._ensureLoaded();
    const frames = this.header.frames || [];
    const list = frames[frameIndex];
    if (!list) {
      return;
    }
    for (const cmd of list) {
      await this._exec(cmd);
    }
    // A well-formed frame ends with its own submit (making this a no-op); finalize anyway so a
    // frame that was recorded without a trailing submit still presents.
    await this._finalizePartial();
  }

  // Run the init commands once (creating persistent resources) and snapshot the resulting object
  // map; subsequent calls restore that snapshot so frame replays don't recompile pipelines.
  async _ensureInit() {
    if (this._initDone) {
      this.objects = Object.assign({}, this._postInitObjects);
    } else {
      this.objects = {};
      this.objects[this.header.gpuVar] = navigator.gpu;
      this.objects[this.header.contextVar] = this.context;
      this._openEncoder = null;
      this._openPass = null;
      this._pendingCommandBuffer = null;
      for (const cmd of this._initCommands) {
        await this._exec(cmd);
      }
      this._postInitObjects = Object.assign({}, this.objects);
      this._initDone = true;
    }
    this._openEncoder = null;
    this._openPass = null;
    this._pendingCommandBuffer = null;
  }

  async _finalizePartial() {
    if (this._openPass) {
      try { this._openPass.end(); } catch (e) { /* pass may already be ended */ }
      this._openPass = null;
    }
    if (this._openEncoder) {
      this._pendingCommandBuffer = this._openEncoder.finish();
      this._openEncoder = null;
    }
    if (this._pendingCommandBuffer) {
      this.device.queue.submit([this._pendingCommandBuffer]);
      this._pendingCommandBuffer = null;
    }
  }

  _args(cmd) {
    if (!cmd.args || cmd.args === "[]") {
      return [];
    }
    return JSON.parse(cmd.args, this._reviver);
  }

  async _exec(cmd) {
    const method = cmd.method;
    const obj = cmd.object != null ? this.objects[cmd.object] : null;
    let result;

    switch (method) {
      // Root objects: bind the once-created device/adapter/queue rather than re-creating them.
      case "requestAdapter":
        result = this.adapter;
        break;
      case "requestDevice":
        result = this.device;
        break;
      case "__getQueue":
        result = this.device.queue;
        break;
      // Recorder pseudo-methods.
      case "__setCanvasSize": {
        const a = this._args(cmd);
        if (this.canvas && (this.canvas.width !== a[0] || this.canvas.height !== a[1])) {
          this.canvas.width = a[0];
          this.canvas.height = a[1];
        }
        break;
      }
      case "__writeData": {
        // Write captured bytes into a mapped buffer range (obj is the ArrayBuffer from
        // getMappedRange). The recorder stores the data as a raw cache index here (not a {__data}
        // marker), so resolve it directly.
        const a = cmd.args && cmd.args !== "[]" ? JSON.parse(cmd.args) : [];
        new Uint8Array(obj).set(this._typedArray(a[0]));
        break;
      }
      case "__writeTexture": {
        const a = this._args(cmd);
        obj.writeTexture(...a);
        break;
      }
      default: {
        const a = this._args(cmd);
        if (cmd.async && cmd.async !== "") {
          result = await obj[method](...a);
        } else {
          result = obj[method](...a);
        }
      }
    }

    if (cmd.result) {
      this.objects[cmd.result] = result;
    }

    // Track open pass/encoder so partial execution can be closed and submitted.
    switch (method) {
      case "createCommandEncoder":
        this._openEncoder = result;
        break;
      case "beginRenderPass":
      case "beginComputePass":
        this._openPass = result;
        break;
      case "end":
        this._openPass = null;
        break;
      case "finish":
        // Only a command encoder's finish() yields a command buffer to submit (a render bundle
        // encoder's finish() yields a bundle, which is not submitted directly).
        if (obj instanceof GPUCommandEncoder) {
          this._pendingCommandBuffer = result;
          this._openEncoder = null;
        }
        break;
      case "submit":
        this._pendingCommandBuffer = null;
        break;
    }

    return result;
  }
}
