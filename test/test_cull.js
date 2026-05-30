// Test scene for: (1) capturing a specific frame when the page also runs non-rendering rAF loops,
// and (2) culling unused buffer/texture data from the saved recording.
//
// The page runs three requestAnimationFrame loops:
//   - idleLoopA / idleLoopB: never submit any GPU work (they only reschedule themselves), so they
//     must NOT count toward the captured frame index.
//   - render: submits a frame each tick; only these count.
// So recordFrame: 10 captures the 10th rendering frame, not the 10th rAF callback.
//
// It also creates decoy resources (a large buffer with data, a texture with data, and a shader +
// pipeline) that are never used by the rendered frame. Object culling drops their creation
// commands, and data culling drops the buffer/texture bytes from the saved file.
async function main() {
    const canvas = document.getElementById("#webgpu");
    const context = canvas.getContext("webgpu");

    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format });

    // ---- Decoy resources NOT used by the captured frame (should be culled) ----
    const unusedBuffer = device.createBuffer({
        size: 64 * 1024,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });
    device.queue.writeBuffer(unusedBuffer, 0, new Float32Array(16 * 1024).fill(1.0));

    const unusedTexture = device.createTexture({
        size: [256, 256],
        format: "rgba8unorm",
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST
    });
    device.queue.writeTexture(
        { texture: unusedTexture },
        new Uint8Array(256 * 256 * 4).fill(128),
        { bytesPerRow: 256 * 4, rowsPerImage: 256 },
        [256, 256]);

    const unusedShader = device.createShaderModule({
        code: `
@vertex fn v() -> @builtin(position) vec4f { return vec4f(0.0, 0.0, 0.0, 1.0); }
@fragment fn f() -> @location(0) vec4f { return vec4f(1.0, 0.0, 1.0, 1.0); }`
    });
    const unusedPipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: { module: unusedShader, entryPoint: "v" },
        fragment: { module: unusedShader, entryPoint: "f", targets: [{ format }] }
    });

    // ---- The actual render path (used by every rendered frame) ----
    const uniformBuffer = device.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    const shader = device.createShaderModule({
        code: `
@group(0) @binding(0) var<uniform> color : vec4f;
@vertex fn vs(@builtin(vertex_index) i : u32) -> @builtin(position) vec4f {
  var p = array<vec2f, 3>(vec2f(0.0, 0.5), vec2f(-0.5, -0.5), vec2f(0.5, -0.5));
  return vec4f(p[i], 0.0, 1.0);
}
@fragment fn fs() -> @location(0) vec4f { return color; }`
    });
    const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: { module: shader, entryPoint: "vs" },
        fragment: { module: shader, entryPoint: "fs", targets: [{ format }] },
        primitive: { topology: "triangle-list" }
    });
    const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: uniformBuffer } }]
    });

    // ---- Multiple non-rendering rAF loops (idle ticks that never submit GPU work) ----
    function idleLoopA() { requestAnimationFrame(idleLoopA); }
    function idleLoopB() {
        // Some non-GPU busywork, but no rendering / submit.
        let x = 0;
        for (let i = 0; i < 1000; ++i) { x += i; }
        requestAnimationFrame(idleLoopB);
    }
    requestAnimationFrame(idleLoopA);
    requestAnimationFrame(idleLoopB);

    // ---- Render loop (each tick submits a frame; only these count as frames) ----
    let frame = 0;
    function render() {
        const t = frame * 0.15;
        device.queue.writeBuffer(uniformBuffer, 0,
            new Float32Array([0.5 + 0.5 * Math.sin(t), 0.3, 0.6, 1.0]));

        const enc = device.createCommandEncoder();
        const pass = enc.beginRenderPass({
            colorAttachments: [{
                view: context.getCurrentTexture().createView(),
                clearValue: { r: 0, g: 0, b: 0, a: 1 },
                loadOp: "clear",
                storeOp: "store"
            }]
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(3);
        pass.end();
        device.queue.submit([enc.finish()]);

        frame++;
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

window.addEventListener("load", main);
