/* eslint-disable no-undef */
import { CubeMesh } from "./gpu/cube_mesh.js";
import { Texture } from "./gpu/texture.js";
import { Sampler } from "./gpu/sampler.js";
import { Matrix4 } from "./math/matrix4.js";
import { Vector3 } from "./math/vector3.js";

export class Skybox {
  constructor(device, format) {
    this.device = device;
    this.format = format;
    this.initialized = false;
    this.transform = new Matrix4();
    this.cameraPosition = new Vector3();

    this.initialize();
  }

  async initialize() {
    const device = this.device;
    this.sampler = new Sampler(device, {
      minFilter: "linear",
      magFilter: "linear",
    });
    this.texture = new Texture(device, { mipmap: true });
    await this.texture.loadUrl("resources/sky2.jpg");

    this.cube = new CubeMesh(device);

    this.bindGroupLayout = device.createBindGroupLayout({
      entries: [
        {
          // Transform
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "uniform" },
        },
        {
          // Sampler
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: { type: "filtering" },
        },
        {
          // Texture view
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: { sampleType: "float" },
        },
      ],
    });

    this.pipelineLayout = device.createPipelineLayout({
      bindGroupLayouts: [this.bindGroupLayout],
    });

    this.shaderModule = device.createShaderModule({ code: skyShader });

    this.pipeline = device.createRenderPipeline({
      layout: this.pipelineLayout,
      vertex: {
        module: this.shaderModule,
        entryPoint: "vertexMain",
        buffers: [
          {
            arrayStride: CubeMesh.vertexSize,
            attributes: [
              {
                // position
                shaderLocation: 0,
                offset: CubeMesh.positionOffset,
                format: "float32x4",
              },
            ],
          },
        ],
      },
      fragment: {
        module: this.shaderModule,
        entryPoint: "fragmentMain",
        targets: [
          {
            format: this.format,
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "none",
      },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: "less",
        format: "depth24plus-stencil8",
      },
    });

    const uniformBufferSize = 4 * 16; // 4x4 matrix
    this.uniformBuffer = device.createBuffer({
      size: uniformBufferSize,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.uniformBindGroup = device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: { buffer: this.uniformBuffer },
        },
        {
          binding: 1,
          resource: this.sampler.gpu,
        },
        {
          binding: 2,
          resource: this.texture.createView(),
        },
      ],
    });

    this.initialized = true;
  }

  draw(camera, passEncoder) {
    if (!this.initialized) {
      return;
    }

    const modelViewProjection = camera.modelViewProjection;
    this.transform.setTranslate(camera.getWorldPosition(this.cameraPosition));
    this.transform.scale(100, 100, 100);
    Matrix4.multiply(modelViewProjection, this.transform, this.transform);

    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      this.transform.buffer,
      this.transform.byteOffset,
      this.transform.byteLength
    );

    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.uniformBindGroup);
    passEncoder.setVertexBuffer(0, this.cube.vertexBuffer);
    passEncoder.draw(36, 1, 0, 0);

    return;
  }
}

const skyShader = `
struct Uniforms {
    u_modelViewProjection: mat4x4<f32>
};

@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct VertexInput {
    @location(0) position: vec4<f32>
};

struct VertexOutput {
    @builtin(position) Position: vec4<f32>,
    @location(0) v_position: vec4<f32>
};

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
    var output: VertexOutput;
    output.Position = uniforms.u_modelViewProjection * input.position;
    output.v_position = input.position;
    return output;
}

@binding(1) @group(0) var skySampler: sampler;
@binding(2) @group(0) var skyTexture: texture_2d<f32>;

fn polarToCartesian(V: vec3<f32>) -> vec2<f32> {
    return vec2<f32>(0.5 - (atan2(V.z, V.x) / -6.28318531),
                     1.0 - (asin(V.y) / 1.57079633 * 0.5 + 0.5));
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    var outColor = textureSample(skyTexture, skySampler, polarToCartesian(normalize(input.v_position.xyz)));
    return outColor;
}`;
