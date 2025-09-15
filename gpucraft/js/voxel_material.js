/* eslint-disable no-undef */
import { Texture } from "./gpu/texture.js";
import { Sampler } from "./gpu/sampler.js";

export class VoxelMaterial {
  constructor(device, format) {
    this.device = device;
    this.format = format;

    this.sampler = new Sampler(device, {
      minFilter: "nearest",
      magFilter: "nearest",
      mipmapFilter: "linear",
    });

    this.texture = new Texture(device, { mipmap: true });

    const self = this;
    this.textureLoaded = false;
    this.texture.loadUrl("resources/BlockAtlas.png").then(() => {
      self.textureLoaded = true;
    });

    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          // ViewUniforms
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
        {
          // ModelUniforms
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
        {
          // Sampler
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
        {
          // Texture view
          binding: 3,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float" },
        },
      ],
    });

    this.pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });

    this.shaderModule = device.createShaderModule({ code: shaderSource });

    this.pipeline = device.createRenderPipeline({
      layout: this.pipelineLayout,
      vertex: {
        module: this.shaderModule,
        entryPoint: "vertexMain",
        buffers: [
          {
            // Position
            arrayStride: 3 * 4,
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x3",
              },
            ],
          },
          {
            // Normal
            arrayStride: 3 * 4,
            attributes: [
              {
                shaderLocation: 1,
                offset: 0,
                format: "float32x3",
              },
            ],
          },
          {
            // Color
            arrayStride: 4 * 4,
            attributes: [
              {
                shaderLocation: 2,
                offset: 0,
                format: "float32x4",
              },
            ],
          },
          {
            // UV
            arrayStride: 2 * 4,
            attributes: [
              {
                shaderLocation: 3,
                offset: 0,
                format: "float32x2",
              },
            ],
          },
        ],
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: "fragmentMain",
        targets: [{ format: this.format }],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "none",
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: "less",
        format: "depth24plus-stencil8",
      },
    });

    this.viewUniformBuffer = device.createBuffer({
      size: 4 * 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this._bindGroups = [];
    this._modelBuffers = [];
    this._currentGroup = 0;
  }

  updateCamera(camera) {
    const modelViewProjection = camera.modelViewProjection;

    this.device.queue.writeBuffer(
      this.viewUniformBuffer,
      0,
      modelViewProjection.buffer,
      modelViewProjection.byteOffset,
      modelViewProjection.byteLength
    );
  }

  startRender(passEncoder) {
    passEncoder.setPipeline(this.pipeline);
    this._chunkIndex = 0;
  }

  drawChunk(chunk, passEncoder) {
    if (!this.textureLoaded) {
      return;
    }

    const chunkIndex = this._chunkIndex;
    const modelBuffer = this._getModelBuffer(chunkIndex);
    const bindGroup = this._getBindGroup(chunkIndex);

    const mesh = chunk.mesh;
    const transform = chunk.worldTransform;

    this.device.queue.writeBuffer(
      modelBuffer,
      0,
      transform.buffer,
      transform.byteOffset,
      transform.byteLength
    );

    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.setVertexBuffer(0, mesh.buffers.points);
    passEncoder.setVertexBuffer(1, mesh.buffers.normals);
    passEncoder.setVertexBuffer(2, mesh.buffers.colors);
    passEncoder.setVertexBuffer(3, mesh.buffers.uvs);
    passEncoder.setIndexBuffer(mesh.buffers.triangles, "uint16");
    passEncoder.drawIndexed(mesh.indexCount);

    this._chunkIndex++;
  }

  _getModelBuffer(index) {
    if (index < this._modelBuffers.length) {
      return this._modelBuffers[index];
    }

    const buffer = this.device.createBuffer({
      size: 4 * 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this._modelBuffers.push(buffer);

    return buffer;
  }

  _getBindGroup(index) {
    if (index < this._bindGroups.length) {
      return this._bindGroups[index];
    }

    const modelBuffer = this._getModelBuffer(index);

    const bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.viewUniformBuffer },
        },
        {
          binding: 1,
          resource: { buffer: modelBuffer },
        },
        {
          binding: 2,
          resource: this.sampler.gpu,
        },
        {
          binding: 3,
          resource: this.texture.createView(),
        },
      ],
    });

    this._bindGroups.push(bindGroup);

    return bindGroup;
  }
}

const shaderSource = `
struct ViewUniforms {
    viewProjection: mat4x4<f32>
};

struct ModelUniforms {
    model: mat4x4<f32>
};

@binding(0) @group(0) var<uniform> viewUniforms: ViewUniforms;
@binding(1) @group(0) var<uniform> modelUniforms: ModelUniforms;

struct VertexInput {
    @location(0) a_position: vec3<f32>,
    @location(1) a_normal: vec3<f32>,
    @location(2) a_color: vec4<f32>,
    @location(3) a_uv: vec2<f32>
};

struct VertexOutput {
    @builtin(position) Position: vec4<f32>,
    @location(0) v_position: vec4<f32>,
    @location(1) v_normal: vec3<f32>,
    @location(2) v_color: vec4<f32>,
    @location(3) v_uv: vec2<f32>
};

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.Position = viewUniforms.viewProjection * modelUniforms.model * vec4<f32>(input.a_position, 1.0);
    output.v_position = output.Position;
    output.v_normal = input.a_normal;
    output.v_color = input.a_color;
    output.v_uv = input.a_uv;
    return output;
}

@binding(2) @group(0) var u_sampler: sampler;
@binding(3) @group(0) var u_texture: texture_2d<f32>;

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    let GlobalLightLevel: f32 = 0.8;
    let minGlobalLightLevel: f32 = 0.2;
    let maxGlobalLightLevel: f32 = 0.9;

    var shade: f32 = (maxGlobalLightLevel - minGlobalLightLevel) * GlobalLightLevel + minGlobalLightLevel;
    shade = shade * input.v_color.a;

    shade = clamp(shade, minGlobalLightLevel, maxGlobalLightLevel);

    var light: vec4<f32> = vec4<f32>(shade, shade, shade, 1.0);

    var outColor = textureSample(u_texture, u_sampler, input.v_uv) * light;

    return outColor;
}`;
