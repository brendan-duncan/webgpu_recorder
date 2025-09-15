import { Vector2 } from "./vector2.js";
import { Vector3 } from "./vector3.js";
import { isNumber } from "./math.js";

/**
 * A 4 dimensional vector.
 * @category Math
 */
export class Vector4 extends Float32Array {
    constructor() {
        if (arguments.length) {
            if (arguments.length == 1 && !arguments[0]) {
                super(4);
            } else if (arguments.length == 1 && isNumber(arguments[0])) {
                super(4);
                const x = arguments[0];
                this[0] = x;
                this[1] = x;
                this[2] = x;
                this[3] = x;
            } else if (arguments.length == 4 && isNumber(arguments[0])) {
                super(4);
                const x = arguments[0];
                const y = arguments[1];
                const z = arguments[2];
                const w = arguments[3];
                this[0] = x;
                this[1] = y;
                this[2] = z;
                this[3] = w;
            } else if (arguments.length == 3 && isNumber(arguments[0])) {
                super(4);
                const x = arguments[0];
                const y = arguments[1];
                const z = arguments[2];
                this[0] = x;
                this[1] = y;
                this[2] = z;
                this[3] = 1;
            } else {
                super(...arguments);
            }
        } else {
            super(4);
        }
    }

    clone() {
        return new Vector4(this);
    }

    setFrom(x, y, z, w) {
        this[0] = x;
        this[1] = y;
        this[2] = z;
        this[3] = w;
        return this;
    }

    setZero() {
        this[0] = 0;
        this[1] = 0;
        this[2] = 0;
        this[3] = 0;
        return this;
    }

    toArray() {
        return [this[0], this[1], this[2], this[3]];
    }

    toString() { return `[${this.x}, ${this.y}, ${this.z}, ${this.w}]`; }

    get x() { return this[0]; }

    set x(v) { this[0] = v; }

    get y() { return this[1]; }

    set y(v) { this[1] = v; }

    get z() { return this[2]; }

    set z(v) { this[2] = v; }

    get w() { return this[3]; }

    set w(v) { this[3] = v; }

    map() {
        switch (arguments.length) {
            case 4:
              return new Vector4(this[arguments[0]], this[arguments[1]],
                this[arguments[2]], this[arguments[3]]);
          case 3:
              return new Vector3(this[arguments[0]], this[arguments[1]], this[arguments[2]]);
          case 2:
              return new Vector2(this[arguments[0]], this[arguments[1]]);
        }
        return null;
    }

    sum() {
        return this[0] + this[1] + this[2] + this[3];
    }

    getLength() {
        return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2] + this[3] * this[3]);
    }

    getLengthSquared() {
        return this[0] * this[0] + this[1] * this[1] + this[2] * this[2] + this[3] * this[3];
    }

    normalize(out) {
        out = out || this;
        const l = this.getLength();
        if (!l) {
            if (out !== this) {
                out.set(this);
            }
            return out;
        }
        out[0] = this[0] / l;
        out[1] = this[1] / l;
        out[2] = this[2] / l;
        out[3] = this[3] / l;
        return out;
    }

    negate(out) {
        out = out || this;
        out[0] = -this[0];
        out[1] = -this[1];
        out[2] = -this[2];
        out[3] = -this[3];
        return out;
    }

    abs(out) {
        out = out || this;
        out[0] = Math.abs(this[0]);
        out[1] = Math.abs(this[1]);
        out[2] = Math.abs(this[2]);
        out[3] = Math.abs(this[3]);
        return out;
    }

    add(b, out) {
        out = out || this;
        out[0] = this[0] + b[0];
        out[1] = this[1] + b[1];
        out[2] = this[2] + b[2];
        out[3] = this[3] + b[3];
        return out;
    }

    subtract(b, out) {
        out = out || this;
        out[0] = this[0] - b[0];
        out[1] = this[1] - b[1];
        out[2] = this[2] - b[2];
        out[3] = this[3] - b[3];
        return out;
    }

    multiply(b, out) {
        out = out || this;
        out[0] = this[0] * b[0];
        out[1] = this[1] * b[1];
        out[2] = this[2] * b[2];
        out[3] = this[3] * b[3];
        return out;
    }

    divide(b, out) {
        out = out || this;
        out[0] = b[0] ? this[0] / b[0] : 0;
        out[1] = b[1] ? this[1] / b[1] : 0;
        out[2] = b[2] ? this[2] / b[2] : 0;
        out[3] = b[3] ? this[3] / b[3] : 0;
        return out;
    }

    scale(s, out) {
        out = out || this;
        out[0] = this[0] * s;
        out[1] = this[1] * s;
        out[2] = this[2] * s;
        out[3] = this[3] * s;
        return out;
    }

    static negated(a, out) {
        out = out || new Vector4();
        out.setFrom(-a[0], -a[1], -a[2], -a[3]);
        return out;
    }

    static abs(a, out) {
        out = out || new Vector4();
        out.setFrom(Math.abs(a[0]), Math.abs(a[1]), Math.abs(a[2]), Math.abs(a[3]));
        return out;
    }

    static length(a) {
        return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3]);
    }

    static lengthSquared(a) {
        return a[0] * a[0] + a[1] * a[1] + a[2] * a[2] + a[3] * a[3];
    }

    static distanceSquared(a, b) {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const dz = b[2] - a[2];
        const dw = b[3] - a[3];
        return dx * dx + dy * dy + dz * dz + dw * dw;
    }

    static distance(a, b) {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const dz = b[2] - a[2];
        const dw = b[3] - a[3];
        return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
    }

    static normalize(a, out) {
        out = out || new Vector4();
        const l = Vector4.getLength(a);
        if (!l) {
            out.set(a);
            return out;
        }
        out[0] = a[0] / l;
        out[1] = a[1] / l;
        out[2] = a[2] / l;
        out[3] = a[3] / l;
        return out;
    }

    static dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    }

    static add(a, b, out) {
        out = out || new Vector4();
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        out[3] = a[3] + b[3];
        return out;
    }

    static subtract(a, b, out) {
        out = out || new Vector4();
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];
        out[3] = a[3] - b[3];
        return out;
    }

    static multiply(a, b, out) {
        out = out || new Vector4();
        out[0] = a[0] * b[0];
        out[1] = a[1] * b[1];
        out[2] = a[2] * b[2];
        out[3] = a[3] * b[3];
        return out;
    }

    static divide(a, b, out) {
        out = out || new Vector4();
        out[0] = b[0] ? a[0] / b[0] : 0;
        out[1] = b[1] ? a[1] / b[1] : 0;
        out[2] = b[2] ? a[2] / b[2] : 0;
        out[3] = b[3] ? a[3] / b[3] : 0;
        return out;
    }

    static scale(a, s, out) {
        out = out || new Vector4();
        out[0] = a[0] * s;
        out[1] = a[1] * s;
        out[2] = a[2] * s;
        out[3] = a[3] * s;
        return out;
    }

    static scaleAndAdd(a, b, s, out) {
        out = out || new Vector4();
        out[0] = a[0] + b[0] * s;
        out[1] = a[1] + b[1] * s;
        out[2] = a[2] + b[2] * s;
        out[3] = a[3] + b[3] * s;
        return out;
    }

    static lerp(a, b, t, out) {
        out = out || new Vector4();
        const ax = a[0];
        const ay = a[1];
        const az = a[2];
        const aw = a[3];
        out[0] = ax + t * (b[0] - ax);
        out[1] = ay + t * (b[1] - ay);
        out[2] = az + t * (b[2] - az);
        out[3] = aw + t * (b[3] - aw);
        return out;
    }
}

Vector4.Zero = new Vector4();
Vector4.One = new Vector4(1, 1, 1, 1);
