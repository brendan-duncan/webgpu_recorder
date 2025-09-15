export class Sampler {
    constructor(device, options) {
        this.device = device;
        this.gpu = device.createSampler(options);
    }
}
