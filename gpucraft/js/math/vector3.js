import { isNumber, equals, clamp } from "./math.js";
import { Vector2 } from "./vector2.js";

/**
 * A 3 dimensioanl vector.
 * @extends Float32Array
 * @category Math
 */
export class Vector3 extends Float32Array {
    /**
     * @param {*} arguments... Variable arguments
     * @example
     * Vector3() // [0, 0, 0]
     * Vector3(1) // [1, 1, 1]
     * Vector3(1, 2, 3) // [1, 2, 3]
     * Vector3([1, 2, 3]) // [1, 2, 3]
     * Vector3(Vector3) // Copy the vector
     */
    constructor() {
        if (arguments.length) {
            if (arguments.length == 1 && !arguments[0]) {
                super(3);
            } else if (arguments.length == 1 && isNumber(arguments[0])) {
                super(3);
                const x = arguments[0];
                this[0] = x;
                this[1] = x;
                this[2] = x;
            } else if (arguments.length == 3 && isNumber(arguments[0])) {
                super(3);
                const x = arguments[0];
                const y = arguments[1];
                const z = arguments[2];
                this[0] = x;
                this[1] = y;
                this[2] = z;
            } else {
                super(...arguments);
            }
        } else {
            super(3);
        }
    }

    /**
     * Create a copy of this vector.
     * @returns {Vector3}
     */
    clone() {
        return new Vector3(this);
    }

    /**
     * Set the components of this vector.
     * @param {number|Array} x 
     * @param {number} [y]
     * @param {number} [z]
     * @returns {Vector3} Returns this vector.
     */
    setFrom(x, y, z) {
        if (y === undefined) {
            this[0] = x[0];
            this[1] = x[1];
            this[2] = x[2];
        } else {
            this[0] = x;
            this[1] = y;
            this[2] = z;
        }
        return this;
    }

    /**
     * Set all components to 0.
     * @returns {Vector3} Returns this vector.
     */
    setZero() {
        this[0] = 0;
        this[1] = 0;
        this[2] = 0;
        return this;
    }

    /**
     * Convert the vector to an Array.
     * @returns {Array}
     */
    toArray() { return [this[0], this[1], this[2]]; }

    /**
     * Get the string representation of the vector.
     * @returns {String}
     */
    toString() { return `[${this.x}, ${this.y}, ${this.z}]`; }

    /**
     * @property {number} x The x component.
     */
    get x() { return this[0]; }

    set x(v) { this[0] = v; }

    /**
     * @property {number} y The y component.
     */
    get y() { return this[1]; }

    set y(v) { this[1] = v; }

    /**
     * @property {number} z The z component.
     */
    get z() { return this[2]; }

    set z(v) { this[2] = v; }

    /**
     * Remap the channels of this vector.
     * @param {number} xi The index of the channel to set x to.
     * @param {number} yi The index of the channel to set y to.
     * @param {number} zi The index of the channel to set z to.
     * @return {Vector3}
     * @example
     * remap(1, 2, 0) // returns [y, z, x]
     */
    remap(xi, yi, zi) {
        const x = this[clamp(xi, 0, 2)];
        const y = this[clamp(yi, 0, 2)];
        const z = this[clamp(zi, 0, 2)];
        this[0] = x;
        this[1] = y;
        this[2] = z;
        return this;
    }

    /**
     * Map this vector to a new vector.
     * @param {number} arguments... The variable component indices to map.
     * @returns {number|Vector2|Vector3}
     * @example
     * map(1) // Returns a number with the y value of this vector.
     * map(0, 2) // Returns a Vector2 as [x, z].
     * map(2, 1, 0) // Returns a Vector3 with as [z, y, x].
     */
    map() {
        switch (arguments.length) {
            case 3:
                return new Vector3(this[arguments[0]], this[arguments[1]], this[arguments[2]]);
            case 2:
                return new Vector2(this[arguments[0]], this[arguments[1]]);
            case 1:
                return this[arguments[0]];
        }
        return null;
    }

    /**
     * Returns the sum of the components, x + y + z.
     * @returns {number}
     */
    sum() {
        return this[0] + this[1] + this[2];
    }

    /**
     * Returns the length of the vector.
     * @returns {number}
     */
    getLength() {
        return Math.sqrt(this[0] * this[0] + this[1] * this[1] + this[2] * this[2]);
    }

    /**
     * Returns the squared length of the vector.
     * @returns {number}
     */
    getLengthSquared() {
        return this[0] * this[0] + this[1] * this[1] + this[2] * this[2];
    }

    /**
     * Normalize the vector.
     * @returns {Vector3} Returns self.
     */
    normalize() {
        const out = this;
        const l = this.getLength();
        if (!l) {
            return out;
        }
        out[0] = this[0] / l;
        out[1] = this[1] / l;
        out[2] = this[2] / l;
        return out;
    }

    /**
     * Negate the vector, as [-x, -y, -z].
     * @returns {Vector3} Returns self.
     */
    negate() {
        const out = this;
        out[0] = -this[0];
        out[1] = -this[1];
        out[2] = -this[2];
        return out;
    }

    /**
     * Make each component its absolute value, [abs(x), abs(y), abs(z)]
     * @returns {Vector3} Returns self.
     */
    abs() {
        const out = this;
        out[0] = Math.abs(this[0]);
        out[1] = Math.abs(this[1]);
        out[2] = Math.abs(this[2]);
        return out;
    }

    /**
     * Add a vector to this, this + b.
     * @param {Vector3} b 
     * @returns {Vector3} Returns self.
     */
    add(b) {
        const out = this;
        out[0] = this[0] + b[0];
        out[1] = this[1] + b[1];
        out[2] = this[2] + b[2];
        return out;
    }

    /**
     * Subtract a vector from this, this - b.
     * @param {Vector3} b 
     * @returns {Vector3} Returns self.
     */
    subtract(b) {
        const out = this;
        out[0] = this[0] - b[0];
        out[1] = this[1] - b[1];
        out[2] = this[2] - b[2];
        return out;
    }

    /**
     * Multiply a vector with this, this * b.
     * @param {Vector3} b 
     * @returns {Vector3} Returns self.
     */
    multiply(b) {
        const out = this;
        out[0] = this[0] * b[0];
        out[1] = this[1] * b[1];
        out[2] = this[2] * b[2];
        return out;
    }

    /**
     * Divide a vector to this, this / b.
     * @param {Vector3} b 
     * @returns {Vector3} Returns self.
     */
    divide(b) {
        const out = this;
        out[0] = b[0] ? this[0] / b[0] : 0;
        out[1] = b[1] ? this[1] / b[1] : 0;
        out[2] = b[2] ? this[2] / b[2] : 0;
        return out;
    }

    /**
     * Scale the vector by a number, this * s.
     * @param {number} s 
     * @returns {Vector3}
     */
    scale(s) {
        const out = this;
        out[0] = this[0] * s;
        out[1] = this[1] * s;
        out[2] = this[2] * s;
        return out;
    }

    rotateX(origin, rad) {
        const out = this;
        const a = this;
        const b = origin;
        // Translate point to the origin
        const p = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
        const r = [p[0], 
                   p[1] * Math.cos(rad) - p[2] * Math.sin(rad),
                   p[1] * Math.sin(rad) + p[2] * Math.cos(rad)];
        
        // translate to correct position
        out[0] = r[0] + b[0];
        out[1] = r[1] + b[1];
        out[2] = r[2] + b[2];

        return out;
    }

    rotateY(origin, rad) {
        const out = this;
        const a = this;
        const b = origin;
        // Translate point to the origin
        const p = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
        const r = [p[2] * Math.sin(rad) + p[0] * Math.cos(rad), 
                   p[1],
                   p[2] * Math.cos(rad) - p[0] * Math.sin(rad)];

        // translate to correct position
        out[0] = r[0] + b[0];
        out[1] = r[1] + b[1];
        out[2] = r[2] + b[2];

        return out;
    }

    rotateZ(origin, rad) {
        const out = this;
        const a = this;
        const b = origin;
        // Translate point to the origin
        const p = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

        const r = [p[0] * Math.cos(rad) - p[1] * Math.sin(rad), 
                   p[0] * Math.sin(rad) + p[1] * Math.cos(rad),
                   p[2]];

        // translate to correct position
        out[0] = r[0] + b[0];
        out[1] = r[1] + b[1];
        out[2] = r[2] + b[2];

        return out;
    }

    /**
     * Reflect the direction vector against the normal.
     * @param {Vector3} direction 
     * @param {Vector3} normal 
     * @param {Vector3} [out]
     * @return {Vector3}
     */
    static reflect(direction, normal, out) {
        out = out || new Vector3();
        const s = -2 * Vector3.dot(normal, direction);
        out[0] = normal[0] * s + direction[0];
        out[1] = normal[1] * s + direction[1];
        out[2] = normal[2] * s + direction[2];
        return out;
    }

    /**
     * Calculate the refraction vector against the surface normal, from IOR k1 to IOR k2.
     * @param {Vector3} incident Specifies the incident vector
     * @param {Vector3} normal Specifies the normal vector
     * @param {number} eta Specifies the ratio of indices of refraction
     * @param {Vector3} [out] Optional output storage
     * @return {Vector3}
     */
    static refract(incident, normal, eta, out) {
        out = out || new Vector3();

        // If the two index's of refraction are the same, then
        // the new vector is not distorted from the old vector.
        if (equals(eta, 1.0)) {
            out[0] = incident[0];
            out[1] = incident[1];
            out[2] = incident[2];
            return out;
        }

        const dot = -Vector3.dot(incident, normal);
        let cs2 = 1.0 - eta * eta * (1.0 - dot * dot);

        // if cs2 < 0, then the new vector is a perfect reflection of the old vector
        if (cs2 < 0.0) {
            Vector3.reflect(incident, normal, out);
            return out;
        }

        cs2 = eta * dot - Math.sqrt(cs2);

        out[0] = normal[0] + (incident[0] * eta) + (normal[0] * cs2);
        out[1] = normal[1] + (incident[1] * eta) + (normal[1] * cs2);
        out[2] = normal[2] + (incident[2] * eta) + (normal[2] * cs2);

        return out.normalize();
    }

    /**
     * Return the negated value of a vector.
     * @param {Vector3} a 
     * @param {Vector3} [out] Optional storage for the output.
     * @returns {Vector3}
     */
    static negated(a, out) {
        out = out || new Vector3();
        out.setFrom(-a[0], -a[1], -a[2]);
        return out;
    }

    /**
     * Return the absoluate value of a vector.
     * @param {Vector3} a 
     * @param {Vector3} [out] Optional storage for the output.
     * @returns {Vector3}
     */
    static abs(a, out) {
        out = out || new Vector3();
        out.setFrom(Math.abs(a[0]), Math.abs(a[1]), Math.abs(a[2]));
        return out;
    }

    /**
     * Calculate the length of a vector.
     * @param {Vector3} a 
     * @returns {number}
     */
    static length(a) {
        return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    }

    /**
     * Calculate the squared lenth of a vector.
     * @param {Vector3} a 
     * @returns {number}
     */
    static lengthSquared(a) {
        return a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
    }

    /**
     * Calculate the squared distance between two points.
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @returns {number}
     */
    static distanceSquared(a, b) {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const dz = b[2] - a[2];
        return dx * dx + dy * dy + dz * dz;
    }

    /**
     * Calculate the distance between two points.
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @returns {number}
     */
    static distance(a, b) {
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const dz = b[2] - a[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Calculate the dot product of two vectors.
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @returns {number}
     */
    static dot(a, b) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    }

    /**
     * Calculate the cross product of two vectors.
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @param {Vector3} [out] Optional storage for the output.
     * @returns {Vector3}
     */
    static cross(a, b, out) {
        out = out || new Vector3();
        const ax = a[0];
        const ay = a[1];
        const az = a[2];
        const bx = b[0];
        const by = b[1];
        const bz = b[2];
        out[0] = ay * bz - az * by;
        out[1] = az * bx - ax * bz;
        out[2] = ax * by - ay * bx;
        return out;
    }

    /**
     * Return the normalized version of the vector.
     * @param {Vector3} a 
     * @param {Vector3} [out] Optional storage for the output.
     * @returns {Vector3}
     */
    static normalize(a, out) {
        out = out || new Vector3();
        const l = Vector3.length(a);
        if (!l) {
            out.set(a);
            return out;
        }
        out[0] = a[0] / l;
        out[1] = a[1] / l;
        out[2] = a[2] / l;
        return out;
    }

    /**
     * Add two vectors.
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @param {Vector3} [out] Optional storage for the output.
     * @returns {Vector3}
     */
    static add(a, b, out) {
        out = out || new Vector3();
        out[0] = a[0] + b[0];
        out[1] = a[1] + b[1];
        out[2] = a[2] + b[2];
        return out;
    }

    /**
     * Subtract two vectors
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @param {Vector3} [out]
     * @returns {Vector3}
     */
    static subtract(a, b, out) {
        out = out || new Vector3();
        out[0] = a[0] - b[0];
        out[1] = a[1] - b[1];
        out[2] = a[2] - b[2];
        return out;
    }

    /**
     * Multiply two vectors
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @param {Vector3} [out]
     * @returns {Vector3}
     */
    static multiply(a, b, out) {
        out = out || new Vector3();
        out[0] = a[0] * b[0];
        out[1] = a[1] * b[1];
        out[2] = a[2] * b[2];
        return out;
    }

    /**
     * Divide two vectors.
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @param {Vector3} [out]
     * @returns {Vector3}
     */
    static divide(a, b, out) {
        out = out || new Vector3();
        out[0] = b[0] ? a[0] / b[0] : 0;
        out[1] = b[1] ? a[1] / b[1] : 0;
        out[2] = b[2] ? a[2] / b[2] : 0;
        return out;
    }

    /**
     * Scale a vector by a number.
     * @param {Vector3} a 
     * @param {number} s 
     * @param {Vector3} [out]
     * @returns {Vector3}
     */
    static scale(a, s, out) {
        out = out || new Vector3();
        out[0] = a[0] * s;
        out[1] = a[1] * s;
        out[2] = a[2] * s;
        return out;
    }

    /**
     * Each component will be the minimum of either a or b.
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @param {Vector3} [out] Optional storage for the output.
     * @returns {Vector3}
     */
    static min(a, b, out) {
        out = out || new Vector3();
        out[0] = Math.min(a[0], b[0]);
        out[1] = Math.min(a[1], b[1]);
        out[2] = Math.min(a[2], b[2]);
        return out;
    }

    /**
     * Each component will be the maximum of either a or b.
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @param {Vector3} [out] Optional storage for the output.
     * @returns {Vector3}
     */
    static max(a, b, out) {
        out = out || new Vector3();
        out[0] = Math.max(a[0], b[0]);
        out[1] = Math.max(a[1], b[1]);
        out[2] = Math.max(a[2], b[2]);
        return out;
    }

    /**
     * Scale and add two numbers, as out = a + b * s.
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @param {number} s 
     * @param {Vector3} [out]
     * @returns {Vector3}
     */
    static scaleAndAdd(a, b, s, out) {
        out = out || new Vector3();
        out[0] = a[0] + b[0] * s;
        out[1] = a[1] + b[1] * s;
        out[2] = a[2] + b[2] * s;
        return out;
    }

    /**
     * Linear interpolate between two vectors.
     * @param {Vector3} a 
     * @param {Vector3} b 
     * @param {number} t Interpolator between 0 and 1.
     * @param {Vector3} [out] Optional storage for the output.
     * @returns {Vector3}
     */
    static lerp(a, b, t, out) {
        out = out || new Vector3();
        const ax = a[0];
        const ay = a[1];
        const az = a[2];
        out[0] = ax + t * (b[0] - ax);
        out[1] = ay + t * (b[1] - ay);
        out[2] = az + t * (b[2] - az);
        return out;
    }
}

/**
 * @property {Vector3} Zero Vector3(0, 0, 0)
 */
Vector3.Zero = new Vector3();
/**
 * @property {Vector3} One Vector3(1, 1, 1)
 */
Vector3.One = new Vector3(1, 1, 1);
/**
 * @property {Vector3} X Vector3(1, 0, 0)
 */
Vector3.X = new Vector3(1, 0, 0);
/**
 * @property {Vector3} Y Vector3(0, 1, 0)
 */
Vector3.Y = new Vector3(0, 1, 0);
/**
 * @property {Vector3} Z Vector3(0, 0, 1)
 */
Vector3.Z = new Vector3(0, 0, 1);
/**
 * @property {Vector3} Up Vector3(0, 1, 0)
 */
Vector3.Up = new Vector3(0, 1, 0);
/**
 * @property {Vector3} Down Vector3(0, -1, 0)
 */
Vector3.Down = new Vector3(0, -1, 0);
/**
 * @property {Vector3} Right Vector3(1, 0, 0)
 */
Vector3.Right = new Vector3(1, 0, 0);
/**
 * @property {Vector3} Left Vector3(-1, 0, 0)
 */
Vector3.Left = new Vector3(-1, 0, 0);
/**
 * @property {Vector3} Front Vector3(0, 0, -1)
 */
Vector3.Front = new Vector3(0, 0, -1);
/**
 * @property {Vector3} Back Vector3(0, 0, 1)
 */
Vector3.Back = new Vector3(0, 0, 1);
