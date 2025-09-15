import { TextureUtil } from "./texture_util.js";

/* eslint-disable no-undef */
export class Texture {
    constructor(device, options) {
        this.device = device;
        this.state = 0;

        if (options) {
            this.configure(options);
        }
    }

    static renderBuffer(device, width, height, format) {
        return new Texture(device, {
            width: width,
            height: height,
            format: format ?? "rgba8unorm",
            usage: GPUTextureUsage.RENDER_ATTACHMENT });
    }

    configure(options) {
        this._generateMipmap = !!options.mipmap;

        if (options.url) {
            this.url = options.url ?? "";
            this.loadUrl(url, options.callback);
            return;
        }

        if (options.width && options.height) {
            this.create(options);
            return;
        }
    }

    destroy() {
        if (!this.gpu) {
            return;
        }
        this.gpu.destroy();
        this.gpu = null;
    }

    create(options) {
        if (!options.width) return;
        if (!options.height) return;
        const width = options.width;
        const height = options.height;
        const format = options.format ?? "rgba8unorm";
        const usage = options.usage ?? GPUTextureUsage.TEXTURE_BINDING;

        this.gpu = this.device.createTexture({
            size: [width, height],
            format: format,
            usage: usage
        });

        this.state = 1;
        if (options.callback) {
            options.callback(this);
        }
    }

    async loadUrl(url, callback) {
        const device = this.device;

        const img = document.createElement('img');
        img.src = url;

        await img.decode();
        const imageBitmap = await createImageBitmap(img);

        if (this._generateMipmap) {
            this.gpu = TextureUtil.get(this.device).generateMipmap(imageBitmap);
        } else {
            this.gpu = device.createTexture({
                size: [ imageBitmap.width, imageBitmap.height ],
                format: "rgba8unorm",
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
            });

            device.queue.copyExternalImageToTexture(
                { source: imageBitmap },
                { texture: this.gpu },
                { width: imageBitmap.width, height: imageBitmap.height }
            );
        }

        this.state = 1;
        if (callback) {
            callback(this);
        }
    }

    createView() {
        return this.gpu.createView();
    }
}
