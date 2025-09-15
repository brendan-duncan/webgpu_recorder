export class ChunkCoord extends Uint32Array {
    constructor(x = 0, z = 0) {
        super(2);
        this[0] = x;
        this[1] = z;
    }

    get x() { return this[0]; }

    set x(v) { this[0] = v; }

    get z() { return this[1]; }

    set z(v) { this[1] = v; }

    equals(other) {
        return !other ? false : this.x == other.x && this.z == other.z;
    }
}
