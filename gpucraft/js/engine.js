import { Camera } from "./camera.js";
import { Texture } from "./gpu/texture.js";
import { Skybox } from "./skybox.js";
import { Globals } from "./globals.js";
import { Input } from "./input.js";
import { Player } from "./player.js";
import { World } from "./world.js";
import { VoxelMaterial } from "./voxel_material.js";

export class Engine {
  constructor() {
    this.initialized = false;
  }

  async run(canvas, options) {
    options = options || {};

    Globals.engine = this;
    Globals.canvas = canvas;
    Globals.input = new Input(canvas);

    this.canvas = canvas;
    this.adapter = await navigator.gpu.requestAdapter();
    this.device = await this.adapter.requestDevice({ requiredFeatures: this.adapter.features, requiredLimits: this.adapter.limits });
    this.context = this.canvas.getContext("webgpu");
    this.preferredFormat = navigator.gpu.getPreferredCanvasFormat();

    const device = this.device;

    this.context.configure({
      device,
      format: this.preferredFormat,
      alphaMode: "opaque",
    });

    this.depthTexture = Texture.renderBuffer(
      this.device,
      this.canvas.width,
      this.canvas.height,
      "depth24plus-stencil8"
    );

    this.colorAttachment = {
      view: undefined, // this is set in the render loop
      loadOp: "clear",
      clearValue: { r: 0.1, g: 0.1, b: 0.2, a: 1.0 },
      storeOp: "store",
    };

    this.depthAttachment = {
      view: this.depthTexture.createView(),
      depthLoadOp: "clear",
      depthClearValue: 1.0,
      depthStoreOp: "store",
      stencilLoadOp: "clear",
      stencilClearValue: 0,
      stencilStoreOp: "store",
    };

    this.renderPassDescriptor = {
      colorAttachments: [this.colorAttachment],
      depthStencilAttachment: this.depthAttachment,
    };

    this.autoResizeCanvas = !!options.autoResizeCanvas;
    if (options.autoResizeCanvas) {
      this.updateCanvasResolution();
    }

    this.skybox = new Skybox(this.device, this.preferredFormat);

    this.camera = new Camera();

    this.player = new Player(this.camera);
    this.world = new World();

    this.voxelMaterial = new VoxelMaterial(this.device, this.preferredFormat);

    this.world.start();

    this.initialized = true;

    Globals.time = Globals.now() * 0.01;

    const self = this;
    const frame = function () {
      requestAnimationFrame(frame);
      const lastTime = Globals.time;
      Globals.time = Globals.now() * 0.01;
      Globals.deltaTime = Globals.time - lastTime;
      self.update();
      self.render();
    };
    requestAnimationFrame(frame);
  }

  updateCanvasResolution() {
    const canvas = this.canvas;
    const rect = canvas.getBoundingClientRect();
    if (rect.width != canvas.width || rect.height != canvas.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
      this._onCanvasResize();
    }
  }

  update() {
    if (this.autoResizeCanvas) {
      this.updateCanvasResolution();
    }

    this.camera.aspect = this.canvas.width / this.canvas.height;

    this.world.update(this.device);
    this.player.update();

    this.voxelMaterial.updateCamera(this.camera);
  }

  render() {
    this.colorAttachment.view = this.context.getCurrentTexture().createView();

    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass(
      this.renderPassDescriptor
    );

    if (this.voxelMaterial.textureLoaded) {
      if (Globals.deltaTime > Globals.maxDeltaTime) {
        Globals.maxDeltaTime = Globals.deltaTime;
      }
    }

    const world = this.world;
    const numObjects = world.children.length;
    let drawCount = 0;
    for (let i = 0; i < numObjects; ++i) {
      const chunk = world.children[i];
      if (!chunk.active) continue;

      if (chunk.mesh) {
        if (!drawCount) {
          this.voxelMaterial.startRender(passEncoder);
        }
        this.voxelMaterial.drawChunk(chunk, passEncoder);
        drawCount++;
      }
    }

    this.skybox.draw(this.camera, passEncoder);

    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  _onCanvasResize() {
    if (!this.depthTexture) return;

    this.depthTexture.destroy();
    this.depthTexture = Texture.renderBuffer(
      this.device,
      this.canvas.width,
      this.canvas.height,
      "depth24plus-stencil8"
    );

    this.depthAttachment.view = this.depthTexture.createView();
  }
}
