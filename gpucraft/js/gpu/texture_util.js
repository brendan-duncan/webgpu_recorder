/* eslint-disable no-undef */
export class TextureUtil {
    static get(device) {
        let t = TextureUtil._devices.get(device);
        if (t) return t;
        t = new TextureUtil(device);
        TextureUtil._devices.set(device, t);
        return t;
    }

    constructor(device) {
        this.device = device;

        this.mipmapSampler = device.createSampler({ minFilter: 'linear' });

        const shaderModule = device.createShaderModule({ code: mipmapShader });

        this.mipmapPipeline = device.createRenderPipeline({
            vertex: {
                module: shaderModule,
                entryPoint: 'vertexMain'
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fragmentMain',
                targets: [ { format: 'rgba8unorm' } ]
            },
            primitive: {
                topology: 'triangle-strip',
                stripIndexFormat: 'uint32'
            },
            layout: "auto"
        });
    }

    static getNumMipmapLevels(w, h) {
        return Math.floor(Math.log2(Math.max(w, h))) + 1;
    }

    generateMipmap(imageBitmap) {
        const mipLevelCount = TextureUtil.getNumMipmapLevels(imageBitmap.width, imageBitmap.height);

        const textureSize = {
            width: imageBitmap.width,
            height: imageBitmap.height,
        };

        const texture = this.device.createTexture({
            size: textureSize,
            format: "rgba8unorm",
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT,
            mipLevelCount: mipLevelCount
        });

        this.device.queue.copyExternalImageToTexture({ source: imageBitmap }, { texture }, textureSize);
    
        const commandEncoder = this.device.createCommandEncoder({});

        const bindGroupLayout = this.mipmapPipeline.getBindGroupLayout(0);

        for (let i = 1; i < mipLevelCount; ++i) {
            const bindGroup = this.device.createBindGroup({
                layout: bindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: this.mipmapSampler,
                    },
                    {
                        binding: 1,
                        resource: texture.createView({
                            baseMipLevel: i - 1,
                            mipLevelCount: 1
                        })
                    }
                ]
            });

            const passEncoder = commandEncoder.beginRenderPass({
                colorAttachments: [{
                    view: texture.createView({
                        baseMipLevel: i,
                        mipLevelCount: 1
                    }),
                    loadOp: "load",
                    storeOp: "store"
                }]
            });

            passEncoder.setPipeline(this.mipmapPipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.draw(3, 1, 0, 0);
            passEncoder.end();

            textureSize.width = Math.ceil(textureSize.width / 2);
            textureSize.height = Math.ceil(textureSize.height / 2);
        }
    
        this.device.queue.submit([ commandEncoder.finish() ]);

        return texture;
    }
}

TextureUtil._devices = new Map();

const mipmapShader = `
var<private> posTex: array<vec4<f32>, 3> = array<vec4<f32>, 3>(
    vec4<f32>(-1.0, 1.0, 0.0, 0.0),
    vec4<f32>(3.0, 1.0, 2.0, 0.0),
    vec4<f32>(-1.0, -3.0, 0.0, 2.0));

struct VertexOutput {
    @builtin(position) v_position: vec4<f32>,
    @location(0) v_uv : vec2<f32>
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var output: VertexOutput;

    output.v_uv = posTex[vertexIndex].zw;
    output.v_position = vec4<f32>(posTex[vertexIndex].xy, 0.0, 1.0);

    return output;
}

@binding(0) @group(0) var imgSampler: sampler;
@binding(1) @group(0) var img: texture_2d<f32>;

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
    return textureSample(img, imgSampler, input.v_uv);
}`;
