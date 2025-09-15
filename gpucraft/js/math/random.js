
/// Psuedo Random Number Generator using the Xorshift128 algorithm
/// (https://en.wikipedia.org/wiki/Xorshift).
export class Random extends Uint32Array {
    constructor(seed) {
        super(6);
        this.seed = seed || new Date().getTime();
    }

    get seed() { return this[0]; }

    set seed(seed) {
        this[0] = seed;
        this[1] = this[0] * 1812433253 + 1;
        this[2] = this[1] * 1812433253 + 1;
        this[3] = this[2] * 1812433253 + 1;
    }

    // Generates a random number between [0,0xffffffff]
    randomUint32() {
        // Xorwow scrambling
        let t = this[3];
        const s = this[0];
        this[3] = this[2];
        this[2] = this[1];
        this[1] = s;
        t ^= t >> 2;
        t ^= t << 1;
        t ^= s ^ (s << 4);
        this[0] = t;
        this[4] += 362437;
        this[5] = (t + this[4])|0;
        return this[5];
    }

    /// Generates a random number between [0,1]
    randomFloat() {
        const value = this.randomUint32();
        return (value & 0x007fffff) * (1.0 / 8388607.0);
    }

    /// Generates a random number between [0,1) with 53-bit resolution
    randomDouble() {
        const a = this.randomUint32() >>> 5;
        const b = this.randomUint32() >>> 6;
        return (a * 67108864 + b) * (1.0 / 9007199254740992);
    }
}
