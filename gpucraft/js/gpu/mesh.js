/* eslint-disable no-undef */
export class Mesh {
    constructor(device, attributes) {
        this.device = device;
        this.buffers = {};

        for (const a in attributes) {
            const attr = attributes[a];
            const data = a === "triangles" ? new Uint16Array(attr) : new Float32Array(attr);
            const buffer = device.createBuffer({
                size: data.byteLength,
                usage: a === "triangles" ? GPUBufferUsage.INDEX : GPUBufferUsage.VERTEX,
                mappedAtCreation: true
            });

            if (a === "triangles") {
                new Int16Array(buffer.getMappedRange()).set(data);
                this.indexCount = data.length;
            } else {
                new Float32Array(buffer.getMappedRange()).set(data);
            }
            buffer.unmap();

            this.buffers[a] = buffer;
        }
    }

    destroy() {
        for (const i in this.buffers) {
            this.buffers[i].destroy();
            this.buffers[i] = null;
        }
    }
}
