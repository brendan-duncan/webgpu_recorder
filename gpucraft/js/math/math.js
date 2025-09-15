/** 
 * @module math
 */

/**
 * Returns true if the object is a number.
 * @param {*} obj 
 * @return {bool}
 */
export function isNumber(obj) {
    return obj != null && obj.constructor === Number;
}

/**
 * Apply the sign of b to a.
 * @param {number} a 
 * @param {number} b 
 * @return {number}
 */
export function copysign(a, b) { return Math.sign(b) * a; }

/**
 * Convert degrees to radians.
 * @memberof Math
 * @param {number} a 
 * @return {number}
 */
export function degreesToRadians(a) { return a * DegreeToRadian; }

/**
 * Convert radians to degrees.
 * @param {number} a 
 * @return {number}
 */
export function radiansToDegrees(a) { return a * RadianToDegree; }

/**
 * Compare two floating-point numbers, testing if the two numbers closer than the given epsilon.
 * @param {number} a 
 * @param {number} b 
 * @param {number} epsilon 
 * @return {bool}
 */
export function equals(a, b, epsilon = Epsilon) {
    return Math.abs(b - a) <= epsilon; 
}

/**
 * Is the given number a power of 2?
 * @param {number} v 
 * @return {bool}
 */
export function isPowerOfTwo(v) {
    return ((Math.log(v) / Math.log(2)) % 1) == 0;
}

/**
 * Return the closest power-of-2 of the given number.
 * @param {number} v 
 * @return {number}
 */
export function nearestPowerOfTwo(v) {
    return Math.pow(2, Math.round(Math.log(v) / Math.log(2)));
}

/**
 * Clamp the value x to the range [min, max].
 * @param {number} x 
 * @param {number} min 
 * @param {number} max 
 * @return {number}
 */
export function clamp(x, min, max) {
    return x < min ? min : x > max ? max : x;
}

/**
 * Linear interpolate between [min, max] using x. If x is outside of the range
 * [min, max], the interpolated value will be a linear extrapolation.
 * @param {number} x The interpolation amount, in the range [0, 1]. 
 * @param {number} min The start of the range to interpolate.
 * @param {number} max The end of the range to interpolate.
 * @return {number} The interpolated value.
 */
export function lerp(x, min, max) {
    const u = x < 0 ? 0 : x > 1 ? 1 : x;
    return u * (max - min) + min;
}

/**
 * If x is outside of the range [min, max], the interval will be repeated.
 * @param {number} x 
 * @param {number} min 
 * @param {number} max 
 * @return {number}
 */
export function repeat(x, min, max) {
    const t = x - min;
    const l = max - min;
    return clamp(t - Math.floor(t / l) * l, 0, l);
}

/**
 * If x is outside of the range [min, max], the interval will be ping-ponged.
 * @param {number} x 
 * @param {number} min 
 * @param {number} max 
 * @return {number}
 */
export function pingpong(x, min, max) {
    const t = x - min;
    const l = max - min;
    const u = clamp(t - Math.floor(t / l) * l, 0, l);
    return l - Math.abs(u - l);
}

/**
 * The length of a 3-dimensional vector, given by its components.
 * @param {number} x 
 * @param {number} y 
 * @param {number} z 
 * @return {number}
 */
export function length3(x, y, z) {
    return Math.sqrt(x * x + y * y + z * z);
}

/**
 * Implementation of the C ldexp function, which combines a mantessa and exponent into a
 * floating-point number.
 * http://croquetweak.blogspot.com/2014/08/deconstructing-floats-frexp-and-ldexp.html
 * @param {number} mantissa 
 * @param {number} exponent 
 */
export function ldexp(mantissa, exponent) {
    const steps = Math.min(3, Math.ceil(Math.abs(exponent) / 1023));
    let result = mantissa;
    for (let i = 0; i < steps; i++) {
        result *= Math.pow(2, Math.floor((exponent + i) / steps));
    }
    return result;
}

/**
 * Convert a float32 number to a float16.
 * 
 * ref: http://stackoverflow.com/questions/32633585/how-do-you-convert-to-half-floats-in-javascript
 * This method is faster than the OpenEXR implementation, with the additional benefit of rounding,
 * inspired by James Tursa?s half-precision code
 * 
 * @param {number} value The number to convert
 * @return {number} The float16 value
 */
export function toFloat16(value) {
    _floatView[0] = value;
     const x = _int32View[0];

     let bits = (x >> 16) & 0x8000; // Get the sign
     let m = (x >> 12) & 0x07ff; // Keep one extra bit for rounding
     const e = (x >> 23) & 0xff; // Using int is faster here

     // If zero, or denormal, or exponent underflows too much for a denormal
     // half, return signed zero.
     if (e < 103) {
       return bits;
     }

     // If NaN, return NaN. If Inf or exponent overflow, return Inf.
     if (e > 142) {
       bits |= 0x7c00;
       // If exponent was 0xff and one mantissa bit was set, it means NaN,
       // not Inf, so make sure we set one mantissa bit too.
       bits |= ((e == 255) ? 0 : 1) && (x & 0x007fffff);
       return bits;
     }

     // If exponent underflows but not too much, return a denormal.
     if (e < 113) {
        m |= 0x0800;
        // Extra rounding may overflow and set mantissa to 0 and exponent
        // to 1, which is OK.
        bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
        return bits;
     }

     bits |= ((e - 112) << 10) | (m >> 1);
     // Extra rounding. An overflow will set mantissa to 0 and increment
     // the exponent, which is OK.
     bits += m & 1;
     return bits;
}
const _floatView = new Float32Array(1);
const _int32View = new Int32Array(_floatView.buffer);

/**
 * Solves the quadratic equation: a + b*x + c*x^2 = 0
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {Array<number>} roots The resulting roots
 * @return {number} The number of roots found
 */
export function solveQuadratic(a, b, c, roots) {
    b = -b;

    if (!a) {
        if (!b) {
            return 0;
        }
        roots[0] = c / b;
        return 1;
    }

    let d = b * b - 4.0 * a * c;

    // Treat values of d around 0 as 0.
    if ((d > -Epsilon) && (d < Epsilon)) {
        roots[0] = 0.5 * b / a;
        return 1;
    } else {
        if (d < 0.0) {
        return 0;
        }
    }

    d = Math.sqrt(d);

    const t = 2.0 * a;
    roots[0] = (b + d) / t;
    roots[1] = (b - d) / t;

    return 2;
}

/**
 * Solves the cubic equation: a + b*x + c*x^2 + d*x^3 = 0
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {Array<number>} roots The resulting roots
 * @return {number} The number of roots found
 */
export function solveCubic(a, b, c, d, roots) {
    if (!a) {
        return solveQuadratic(b, c, d, roots);
    }

    let a1 = b / a;
    let a2 = c / a;
    let a3 = d / a;

    const A2 = a1 * a1;
    const Q = (A2 - 3.0 * a2) / 9.0;
    const R = (a1 * (A2 - 4.5 * a2) + 13.5 * a3) / 27.0;
    const Q3 = Q * Q * Q;
    const R2 = R * R;
    let d1 = Q3 - R2;
    const an = a1 / 3.0;

    let sQ = 0.0;
    if (d < 0.0) {
        sQ = Math.pow(Math.sqrt(R2 - Q3) + R.abs(), 1.0 / 3.0);

        if (R < 0.0) {
            roots[0] = (sQ + Q / sQ) - an;
        } else {
            roots[0] = -(sQ + Q / sQ) - an;
        }

        return 1;
    }

    // Three real roots.
    d1 = R / Math.sqrt(Q3);

    const theta = Math.acos(d1) / 3.0;

    sQ = -2.0 * Math.sqrt(Q);

    roots[0] = sQ * Math.cos(theta) - an;
    roots[1] = sQ * Math.cos(theta + _TWO_M_PI_3) - an;
    roots[2] = sQ * Math.cos(theta + _FOUR_M_PI_3) - an;
    return 3;
}

/**
 * Solve the quartic equation: a + b*x + c*x^2 + d*x^3 + e*x^4 = 0
 * @param {number} a
 * @param {number} b
 * @param {number} c
 * @param {number} d
 * @param {number} e
 * @param {Array<number>} roots The resulting roots
 * @return {number} The number of roots found
 */
export function solveQuartic(a, b, c, d, e, roots) {
    // Make sure the quartic has a leading coefficient of 1.0
    if (!a) {
        return solveCubic(b, c, d, e, roots);
    }

    const c1 = b / a;
    const c2 = c / a;
    const c3 = d / a;
    const c4 = e / a;

    // Compute the cubic resolvant
    const c12 = c1 * c1;
    let p = -0.375 * c12 + c2;
    const q = 0.125 * c12 * c1 - 0.5 * c1 * c2 + c3;
    const r = -0.01171875 * c12 * c12 + 0.0625 * c12 * c2 - 0.25 * c1 * c3 + c4;

    const cubic0 = 1.0;
    const cubic1 = -0.5 * p;
    const cubic2 = -r;
    const cubic3 = 0.5 * r * p - 0.125 * q * q;

    const cubicRoots = roots;
    let numRoots = solveCubic(cubic0, cubic1, cubic2, cubic3, roots);

    if (numRoots <= 0) {
        return 0;
    }

    const z = cubicRoots[0];

    let d1 = 2.0 * z - p;
    let d2;
    if (d1 < 0.0) {
        if (d1 <= -Epsilon) {
            return 0;
        }
        d1 = 0.0;
    }

    if (d1 < Epsilon) {
        d2 = z * z - r;

        if (d2 < 0.0) {
            return 0;
        }

        d2 = Math.sqrt(d2);
    } else {
        d1 = Math.sqrt(d1);
        d2 = 0.5 * q / d1;
    }

    // Set up useful values for the quadratic factors
    const q1 = d1 * d1;
    const q2 = -0.25 * c1;

    numRoots = 0;

    // Solve the first quadratic
    p = q1 - 4.0 * (z - d2);
    if (!p) {
        roots[numRoots++] = -0.5 * d1 - q2;
    } else {
        if (p > 0) {
            p = Math.sqrt(p);
            roots[numRoots++] = -0.5 * (d1 + p) + q2;
            roots[numRoots++] = -0.5 * (d1 - p) + q2;
        }
    }

    // Solve the second quadratic
    p = q1 - 4.0 * (z + d2);

    if (p == 0) {
        roots[numRoots++] = 0.5 * d1 - q2;
    } else {
        if (p > 0) {
            p = Math.sqrt(p);
            roots[numRoots++] = 0.5 * (d1 + p) + q2;
            roots[numRoots++] = 0.5 * (d1 - p) + q2;
        }
    }

    return numRoots;
}

/**
 * Returns the sign of x, indicating whether x is positive, negative, or zero.
 * @function sign
 * @param {number} x
 * @return {number}
 */
export const sign = Math.sign;
/**
 * Returns the square root of x.
 * @function sqrt
 * @param {number} x
 * @return {number}
 */
export const sqrt = Math.sqrt;
/**
 * Returns the natural logarithm of x.
 * @function log
 * @param {number} x
 * @return {number}
 */
export const log = Math.log;
/**
 * Returns the sine of x.
 * @function sin
 * @param {number} x
 * @return {number}
 */
export const sin = Math.sin;
/**
 * Returns the cosine of x.
 * @function cos
 * @param {number} x
 * @return {number}
 */
export const cos = Math.cos;
/**
 * Returns the tangent of x.
 * @function tan
 * @param {number} x
 * @return {number}
 */
export const tan = Math.tan;
/**
 * Returns the arcsine of x.
 * @function asin
 * @param {number} x
 * @return {number}
 */
export const asin = Math.asin;
/**
 * Returns the arccosine of x.
 * @function acos
 * @param {number} x
 * @return {number}
 */
export const acos = Math.acos;
/**
 * Returns the arctangent of x.
 * @function sqrt
 * @param {number} x
 * @return {number}
 */
export const atan = Math.atan;
/**
 * Returns the largest integer less than or equal to x.
 * @function floor
 * @param {number} x
 * @return {number}
 */
export const floor = Math.floor;
/**
 * Returns the smallest integer greater than or equal to x.
 * @function ceil
 * @param {number} x
 * @return {number}
 */
export const ceil = Math.ceil;
/** 
 * Returns the absolute value of x.
 * @function abs
 * @param {number} x
 * @retrn {number}
 */
export const abs = Math.abs;

/**
 * @property {number} MaxValue
 * General value to consider as a maximum float value.
 */
export const MaxValue = 1.0e30;
/**
 * @property {number} Epsilon
 * General value to consider as an epsilon for float comparisons.
 */
export const Epsilon = 1.0e-6;
/**
 * @property {number} PI
 * 3.1415...
 */
export const PI = Math.PI;
/**
 * @property {number} PI_2
 * PI divided by 2
 */
export const PI_2 = Math.PI / 2;
/**
 * @property {number} PI2
 * PI multiplied by 2
 */
export const PI2 = Math.PI * 2;
/**
 * @property {number} DegreeToRadian
 * Conversion value for degrees to radians.
 */
export const DegreeToRadian = Math.PI / 180;
/**
 * @property {number} RadianToDegree
 * Conversion value for radians to degrees.
 */
export const RadianToDegree = 180 / Math.PI;

/**
 * Axis direction
 * @enum {number}
 * @readonly
 * @example
 * Axis.X: 0
 * Axis.Y: 1
 * Axis.Z: 2
 */
export const Axis = {
    X: 0,
    Y: 1,
    Z: 2
};

/**
 * Plane or frustum clip test result type.
 * @readonly
 * @enum {number}
 * @example
 * ClipTest.Inside: 0   // The object is completely inside the frustum or in front of the plane.
 * ClipTest.Outside: 1  // The object is completely outside the frustum or behind the plane.
 * ClipTest.Overlap: 2  // The object overlaps the plane or frustum.
 */
export const ClipTest = {
    Inside: 0,
    Outside: 1,
    Overlap: 2
};

/**
 * Order in which to apply euler rotations for a transformation.
 * @readonly
 * @enum {number}
 * @example
 * RotationOrder.Default: RotationOrder.ZYX
 * RotationOrder.ZYX: 0
 * RotationOrder.XYZ: 1,
 * RotationOrder.XZY: 2,
 * RotationOrder.YZX: 3,
 * RotationOrder.YXZ: 4,
 * RotationOrder.ZXY: 5,
 * 
 */
export const RotationOrder = {
    Default: 0, // Default is ZYX
    ZYX: 0,
    XYZ: 1,
    XZY: 2,
    YZX: 3,
    YXZ: 4,
    ZXY: 5
};

const _TWO_M_PI_3 = 2.0943951023931954923084;
const _FOUR_M_PI_3 = 4.1887902047863909846168;
