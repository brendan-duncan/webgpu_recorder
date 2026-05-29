// Shared scene for the recorder test pages.
//
// It exercises the two things the stateful recorder must reconstruct for an arbitrary frame:
//   1. Host-written, per-frame state: a uniform buffer is rewritten every frame via writeBuffer
//      (an animated brightness), so each frame's output differs.
//   2. GPU-produced state: a storage buffer is filled once by a compute pass at startup and read
//      by the fragment shader. The recorder captures its contents via readback (not by replaying
//      the compute pass).
// The background clear color also animates by frame so different captured frames are visually
// distinguishable.
//
// A test page may define `window.__recorderTest = { onFrame(frameIndex) {...} }` to drive captures
// at runtime (e.g. via __webgpuRecorder.recordFrame(...)).
async function main() {
    const canvas = document.getElementById("#webgpu");
    const context = canvas.getContext("webgpu");

    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format: presentationFormat });

    // --- Compute pass (runs once): write a tint color into a storage buffer. ---
    const tintBuffer = device.createBuffer({
        size: 16, // vec4<f32>
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    });

    const computeModule = device.createShaderModule({
        code: `
@group(0) @binding(0) var<storage, read_write> tint : vec4<f32>;
@compute @workgroup_size(1)
fn main() {
  tint = vec4<f32>(0.0, 0.6, 0.9, 1.0);
}`
    });

    const computePipeline = device.createComputePipeline({
        layout: "auto",
        compute: { module: computeModule, entryPoint: "main" }
    });

    const computeBindGroup = device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: tintBuffer } }]
    });

    {
        const enc = device.createCommandEncoder();
        const pass = enc.beginComputePass();
        pass.setPipeline(computePipeline);
        pass.setBindGroup(0, computeBindGroup);
        pass.dispatchWorkgroups(1);
        pass.end();
        device.queue.submit([enc.finish()]);
    }

    // --- Per-frame uniform: an animated brightness value, written every frame. ---
    const uniformBuffer = device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    const renderModule = device.createShaderModule({
        code: `
@group(0) @binding(0) var<uniform> brightness : vec4<f32>;
@group(0) @binding(1) var<storage, read> tint : vec4<f32>;

@vertex
fn vs(@builtin(vertex_index) i : u32) -> @builtin(position) vec4<f32> {
  var pos = array<vec2<f32>, 3>(
      vec2<f32>(0.0, 0.5), vec2<f32>(-0.5, -0.5), vec2<f32>(0.5, -0.5));
  return vec4<f32>(pos[i], 0.0, 1.0);
}

@fragment
fn fs() -> @location(0) vec4<f32> {
  return vec4<f32>(tint.rgb * brightness.r, 1.0);
}`
    });

    const renderPipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: { module: renderModule, entryPoint: "vs" },
        fragment: { module: renderModule, entryPoint: "fs", targets: [{ format: presentationFormat }] },
        primitive: { topology: "triangle-list" }
    });

    const renderBindGroup = device.createBindGroup({
        layout: renderPipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: { buffer: uniformBuffer } },
            { binding: 1, resource: { buffer: tintBuffer } }
        ]
    });

    let frameIndex = 0;
    function frame() {
        // Let the test page arm captures based on the current frame index.
        if (window.__recorderTest && window.__recorderTest.onFrame) {
            window.__recorderTest.onFrame(frameIndex);
        }

        // Animate brightness; each frame overwrites the same region of the uniform buffer.
        const brightness = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(frameIndex * 0.1));
        device.queue.writeBuffer(uniformBuffer, 0, new Float32Array([brightness, 0, 0, 0]));

        // Animate the background so each frame number is visually distinguishable.
        const bg = (frameIndex % 60) / 60;

        const enc = device.createCommandEncoder();
        const view = context.getCurrentTexture().createView();
        const pass = enc.beginRenderPass({
            colorAttachments: [{
                view,
                clearValue: { r: bg, g: 0.1, b: 0.2, a: 1 },
                loadOp: "clear",
                storeOp: "store"
            }]
        });
        pass.setPipeline(renderPipeline);
        pass.setBindGroup(0, renderBindGroup);
        pass.draw(3);
        pass.end();
        device.queue.submit([enc.finish()]);

        frameIndex++;
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}

window.addEventListener("load", main);
