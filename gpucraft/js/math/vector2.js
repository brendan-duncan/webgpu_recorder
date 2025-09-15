import { isNumber } from "./math.js";

/**
 * A 2 dimensional vector.
 * @category Math
 */
export class Vector2 extends Float32Array {
    constructor() {
        if (arguments.length) {
            if (arguments.length == 1 && !arguments[0]) {
                super(2);
            } else if (arguments.length == 1 && isNumber(arguments[0])) {
                super(2);
                const x = arguments[0];
                this[0] = x;
                this[1] = x;
            } else if (arguments.length == 2 && isNumber(arguments[0])) {
                super(2);
                const x = arguments[0];
                const y = arguments[1];
                this[0] = x;
                this[1] = y;
            } else {
                super(...arguments);
            }
        } else {
            super(2);
        }
    }

    clone() {
        return new Vector2(this);
    }

    setFrom(x, y) {
        this[0] = x;
        this[1] = y;
        return this;
    }

    setZero() {
        this[0] = 0;
        this[1] = 0;
        return this;
    }

    toArray() { return [this[0], this[1]]; }

    toString() { return `[${this.x}, ${this.y}]`; }

    get x() { return this[0]; }

    set x(v) { this[0] = v; }

    get y() { return this[1]; }

    set y(v) { this[1] = v; }

    map() {
        switch (arguments.length) {
            case 2:
                return new Vector2(this[arguments[0]], this[arguments[1]]);
            }
        return null;
    }

    sum() {
        return this[0] + this[1];
    }

    getLength() {
        return Math.sqrt(this[0] * this[0] + this[1] * this[1]);
    }

    getLengthSquared() {
        return this[0] * this[0] + this[1] * this[1];
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
        return out;
    }

    negate(out) {
        out = out || this;
        out[0] = -this[0];
        out[1] = -this[1];
        return out;
    }

    abs(out) {
        out = out || this;
        out[0] = Math.abs(this[0]);
        out[1] = Math.abs(this[1]);
        return out;
    }

    add(b, out) {
        out = out || this;
        out[0] = this[0] + b[0];
        out[1] = this[1] + b[1];
        return out;
    }

    subtract(b, out) {
        out = out || this;
        out[0] = this[0] - b[0];
        out[1] = this[1] - b[1];
        return out;
    }

    multiply(b, out) {
        out = out || this;
        out[0] = this[0] * b[0];
        out[1] = this[1] * b[1];
        return out;
    }

    divide(b, out) {
        out = out || this;
        out[0] = b[0] ? this[0] / b[0] : 0;
        out[1] = b[1] ? this[1] / b[1] : 0;
        return out;
    }

    scale(s, out) {
        out = out || this;
        out[0] = this[0] * s;
        out[1] = this[1] * s;
        return out;
    }

    static negated(a, out) {
        out = out || new Vector2();
        out.setFrom(-a[0], -a[1]);
        return out;
    }

    static abs(a, out) {
        out = out || new Vector2();
        out.setFrom(Math.abs(a[0]), Math.abs(a[1]));
        return out;
    }

    static length(v) { return v.getLength(); }

    static lengthSquared(v) { return v.getLengthSquared(); }

    static distanceSquared(a, b) {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        return dx * dx + dy * dy;
    }

    static distance(a, b) {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        return Math.sqrt(dx * dx + dy * dy);
    }

    static normalize(a, out) {
        out = out || new Vector2();
        const l = Vector2.getLength(a);
        if (!l) {
            out.set(a);
            return;
        }
        out[0] = a[0] / l;
        out[1] = a[1] / l;
        return out;
    }

    static dot(a, b) {
        return a[0] * b[0] + a[1] * b[1];
    }

    static cross(a, b, out) {
        out = out || new Vector2();
        const z = a[0] * b[1] - a[1] * b[0];
        out[0] = out[1] = 0;
        out[2] = z;
        return out;
    }

    static add(a, b, out) {
        out = out || new Vector2();
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        return out;
    }

    static subtract(a, b, out) {
        out = out || new Vector2();
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        return out;
    }

    static multiply(a, b, out) {
        out = out || new Vector2();
        out[0] = a[0] * b[0];
        out[1] = a[1] * b[1];
        return out;
    }

    static divide(a, b, out) {
        out = out || new Vector2();
        out[0] = b[0] ? a[0] / b[0] : 0;
        out[1] = b[1] ? a[1] / b[1] : 0;
        return out;
    }

    static scale(a, s, out) {
        out = out || new Vector2();
        out[0] = a[0] * s;
        out[1] = a[1] * s;
        return out;
    }

    static scaleAndAdd(a, b, s, out) {
        out = out || new Vector2();
        out[0] = a[0] + b[0] * s;
        out[1] = a[1] + b[1] * s;
        return out;
    }

    static lerp(a, b, t, out) {
        out = out || new Vector2();
        const ax = a[0];
        const ay = a[1];
        out[0] = ax + t * (b[0] - ax);
        out[1] = ay + t * (b[1] - ay);
        return out;
    }
}

Vector2.Zero = new Vector2();
Vector2.One = new Vector2(1, 1);
