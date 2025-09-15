import { Vector3 } from "./vector3.js";
import { Vector4 } from "./vector4.js";
import { isNumber, Epsilon, RotationOrder, DegreeToRadian, RadianToDegree } from "./math.js";

/**
 * A 4x4 matrix, stored as a column-major order array.
 * @extends Float32Array
 * @category Math
 */
export class Matrix4 extends Float32Array {
    /**
     * Creates a new matrix.
     * @param {...*} arguments Variable arguments for constructor overloading.
     * @example
     * // Creates an identity matrix.
     * new Matrix4()
     * 
     * // Creates a clone of the given matrix.
     * new Matrix4(Matrix4)
     * 
     * // Creates a Matrix4 from the given array.
     * new Matrix4(Array[16])
     * 
     * // Creates a zero matrix.
     * new Matarix4(0)
     * 
     * // Create a matrix from 16 individual elements in column major order
     * new Matrix4(m00, m01, m02, m03,
     *             m10, m11, m12, m13,
     *             m20, m21, m22, m23,
     *             m30, m31, m32, m33)
     */
    constructor() {
        if (arguments.length) {
            if (arguments.length == 1 && !arguments[0]) {
                super(16);
            } else if (arguments.length == 1 && isNumber(arguments[0])) {
                super(16);
                const x = arguments[0];
                this[0] = x;
                this[5] = x;
                this[10] = x;
                this[15] = x;
            } else if (arguments.length == 16 && isNumber(arguments[0])) {
                super(16);
                this[0] = arguments[0];
                this[1] = arguments[1];
                this[2] = arguments[2];
                this[3] = arguments[3];
                this[4] = arguments[4];
                this[5] = arguments[5];
                this[6] = arguments[6];
                this[7] = arguments[7];
                this[8] = arguments[8];
                this[9] = arguments[9];
                this[10] = arguments[10];
                this[11] = arguments[11];
                this[12] = arguments[12];
                this[13] = arguments[13];
                this[14] = arguments[14];
                this[15] = arguments[15];
            } else {
                super(...arguments);
            }
        } else {
            super(16);
            this[0] = 1;
            this[5] = 1;
            this[10] = 1;
            this[15] = 1;
        }
    }

    /**
     * Make a copy of this matrix.
     * @return {Matrix4}
     */
    clone() {
        return new Matrix4(this);
    }

    /**
     * Convert the matrix to an array.
     * @return {Array} An array containing the values of the matrix.
     */
    toArray() {
        return [this[0], this[1], this[2], this[3],
                this[4], this[5], this[6], this[7],
                this[8], this[9], this[10], this[11],
                this[12], this[13], this[14], this[15]];
    }

    /**
     * Checks if this is an identity matrix.
     * @return {Boolean} true if this is an identity matrix.
     */
    isIdentity() {
        const m = this;
        return ((m[0] === 1) &&
                (m[1] === 0) &&
                (m[2] === 0) &&
                (m[3] === 0) &&
                (m[4] === 0) &&
                (m[5] === 1) &&
                (m[6] === 0) &&
                (m[7] === 0) &&
                (m[8] === 0) &&
                (m[9] === 0) &&
                (m[10] === 1) &&
                (m[11] === 0) &&
                (m[12] === 0) &&
                (m[13] === 0) &&
                (m[14] === 0) &&
                (m[15] === 1));
    }

    /**
     * @example
     * setColumn(column, Vector3)
     * setColumn(column, Vector4)
     * setColumn(column, x, y, z)
     * setColumn(column, x, y, z, w)
     */
    setColumn() {
        var args = Array.prototype.slice.call(arguments);
        const c = args.shift();
        const numArgs = args.length;
        const x = numArgs == 1 ? args[0] : args;
        const i = c * 4;
        this[i] = x[0];
        this[i + 1] = x[1];
        this[i + 2] = x[2];
        if (numArgs == 4) {
            this[i + 3] = x[3];
        }
        return this;
    }

    /**
     * Get a column from the matrix.
     * @param {number} index 
     * @param {Vector4?} out 
     * @return {Vector4}
     */
    getColumn(index, out) {
        out = out || new Vector4();
        const i = index * 4;
        out[0] = this[i];
        out[1] = this[i + 1];
        out[2] = this[i + 2];
        out[3] = this[i + 3];
        return out;
    }

    /**
     * Get a column from the matrix.
     * @param {number} index
     * @param {Vector3?} out 
     * @return {Vector3}
     */
    getColumn3(index, out) {
        out = out || new Vector3();
        const i = index * 4;
        out[0] = this[i];
        out[1] = this[i + 1];
        out[2] = this[i + 2];
        return out;
    }

    /**
     * @example
     * setRow(row, Vector3)
     * 
     * setRow(row, Vector4)
     * 
     * setRow(row, x, y, z)
     * 
     * setRow(row, x, y, z, w)
     */
    setRow() {
        var args = Array.prototype.slice.call(arguments);
        const r = args.shift();
        const numArgs = args.length;
        const x = numArgs == 1 ? args[0] : args;
        this[r] = x[0];
        this[r + 4] = x[1];
        this[r + 8] = x[2];
        if (numArgs == 4) {
            this[r + 12] = x[3];
        }
        return this;
    }

    /**
     * Get a row from the matrix.
     * @param {number} index 
     * @param {Vector4?} out 
     * @return {Vector4}
     */
    getRow(index, out) {
        out = out || new Vector4();
        out[0] = this[index];
        out[1] = this[index + 4];
        out[2] = this[index + 8];
        out[3] = this[index + 12];
        return out;
    }

    /**
     * Get a row from the matrix.
     * @param {number} index 
     * @param {Vector3?} out 
     * @return {Vector3}
     */
    getRow3(r, out) {
        out = out || new Vector3();
        out[0] = this[r];
        out[1] = this[r + 4];
        out[2] = this[r + 8];
        return out;
    }

    /**
     * @example
     * setFrom(m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33)
     * 
     * setFrom([m00, m01, m02, m03, m10, m11, m12, m13, m20, m21, m22, m23, m30, m31, m32, m33])
     * 
     * setFrom(Matrix4)
     */
    setFrom() {
        const numArgs = arguments.length;
        const m = this;
        const x = numArgs == 1 ? arguments[0] : arguments;
        m[0] = x[0];
        m[1] = x[1];
        m[2] = x[2];
        m[3] = x[3];
        m[4] = x[4];
        m[5] = x[5];
        m[6] = x[6];
        m[7] = x[7];
        m[8] = x[8];
        m[9] = x[9];
        m[10] = x[10];
        m[11] = x[11];
        m[12] = x[12];
        m[13] = x[13];
        m[14] = x[14];
        m[15] = x[15];
        return this;
    }

    /**
     * Set the matrix as an identity matrix.
     */
    setIdentity() {
        const m = this;
        m[0] = 1;
        m[1] = 0;
        m[2] = 0;
        m[3] = 0;
        m[4] = 0;
        m[5] = 1;
        m[6] = 0;
        m[7] = 0;
        m[8] = 0;
        m[9] = 0;
        m[10] = 1;
        m[11] = 0;
        m[12] = 0;
        m[13] = 0;
        m[14] = 0;
        m[15] = 1;
        return this;
    }

    /**
     * @example
     * setTranslate(x, y, z)
     * 
     * setTranslate([x, y, z])
     * 
     * setTranslate(Vector3)
     */
    setTranslate() {
        const numArgs = arguments.length;
        const x = numArgs == 1 ? arguments[0] : arguments;
        const out = this;
        out[0] = 1;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = 1;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = 1;
        out[11] = 0;
        out[12] = x[0];
        out[13] = x[1];
        out[14] = x[2];   
        out[15] = 1;
        return this;
    }

    /**
     * @example
     * setScale(x, y, z)
     * 
     * setScale([x, y, z])
     * 
     * setScale(Vector3)
     */
    setScale() {
        const numArgs = arguments.length;
        const x = numArgs == 1 ? arguments[0] : arguments;
        const out = this;
        out[0] = x[0];
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = x[1];
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = x[2];
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;
        return this;
    }

    /**
     * @example
     * setAxisAngle(angle, x, y, z)
     * 
     * setAxisAngle(angle, [x, y, z])
     * 
     * setAxisAngle(angle, Vector3)
     */
    setAxisAngle() {
        const out = this;
        const numArgs = arguments.length;
        const angle = arguments[0];
        let x = numArgs == 2 ? arguments[1][0] : arguments[1];
        let y = numArgs == 2 ? arguments[1][1] : arguments[2];
        let z = numArgs == 2 ? arguments[1][2] : arguments[3];
        let len = Math.hypot(x, y, z);

        if (len < Epsilon) { return null; }

        len = 1 / len;
        x *= len;
        y *= len;
        z *= len;

        const s = Math.sin(angle);
        const c = Math.cos(angle);
        const t = 1 - c;

        // Perform rotation-specific matrix multiplication
        out[0] = x * x * t + c;
        out[1] = y * x * t + z * s;
        out[2] = z * x * t - y * s;
        out[3] = 0;
        out[4] = x * y * t - z * s;
        out[5] = y * y * t + c;
        out[6] = z * y * t + x * s;
        out[7] = 0;
        out[8] = x * z * t + y * s;
        out[9] = y * z * t - x * s;
        out[10] = z * z * t + c;
        out[11] = 0;
        out[12] = 0;
        out[13] = 0;
        out[14] = 0;
        out[15] = 1;

        return this;
    }

    /**
     * Set the matrix as a rotation around the X axis.
     * @param {number} angle Angle of the rotation, in radians.
     */
    setRotateX(angle) {
        angle *= DegreeToRadian;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        this[0] = 1;
        this[1] = 0;
        this[2] = 0;
        this[3] = 0;
        this[4] = 0;
        this[5] = c;
        this[6] = -s;
        this[7] = 0;
        this[8] = 0;
        this[9] = s;
        this[10] = c;
        this[11] = 0;
        this[12] = 0;
        this[13] = 0;
        this[14] = 0;
        this[15] = 1;
        return this;
    }

    /**
     * Set the matrix as a rotation around the Y axis.
     * @param {number} angle Angle of the rotation, in degrees.
     */
    setRotateY(angle) {
        angle *= DegreeToRadian;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        this[0] = c;
        this[1] = 0;
        this[2] = s;
        this[3] = 0;
        this[4] = 0;
        this[5] = 1;
        this[6] = 0;
        this[7] = 0;
        this[8] = -s;
        this[9] = 0;
        this[10] = c;
        this[11] = 0;
        this[12] = 0;
        this[13] = 0;
        this[14] = 0;
        this[15] = 1;
        return this;
    }

    /**
     * Set the matrix as a rotation around the Z axis.
     * @param angle Angle of the rotation, in degrees.
     */
    setRotateZ(angle) {
        angle *= DegreeToRadian;
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        this[0] = c;
        this[1] = -s;
        this[2] = 0;
        this[3] = 0;
        this[4] = s;
        this[5] = c;
        this[6] = 0;
        this[7] = 0;
        this[8] = 0;
        this[9] = 0;
        this[10] = 1;
        this[11] = 0;
        this[12] = 0;
        this[13] = 0;
        this[14] = 0;
        this[15] = 1;
        return this;
    }

    /**
     * Set the matrix as an euler rotation. Angles are given in degrees.
     * @example
     * setEulerAngles(x, y, z, order = RotationOrder.ZYX)
     * 
     * setEulerAngles(Vector3, order = RotationOrder.ZYX)
     */
    setEulerAngles() {
        const numArgs = arguments.length;
        let x, y, z, order;
        if (numArgs <= 2) {
            x = arguments[0][0];
            y = arguments[0][1];
            z = arguments[0][2];
            order = arguments[1] !== undefined ? arguments[1] : RotationOrder.Default;
        } else if (numArgs == 3 || numArgs == 4) {
            x = arguments[0];
            y = arguments[1];
            z = arguments[2];
            order = arguments[3] !== undefined ? arguments[3] : RotationOrder.Default;
        } else {
            throw "invalid arguments for setEulerAngles";
        }
        switch (order) {
            case RotationOrder.XYZ:
                this.setRotateZ(z);
                this.rotateY(y);
                this.rotateX(x);
                break;
            case RotationOrder.XZY:
                this.setRotateY(z);
                this.rotateZ(y);
                this.rotateX(x);
                break;
            case RotationOrder.YZX:
                this.setRotateX(z);
                this.rotateZ(y);
                this.rotateY(x);
                break;
            case RotationOrder.YXZ:
                this.setRotateZ(z);
                this.rotateX(y);
                this.rotateY(x);
                break;
            case RotationOrder.ZXY:
                this.setRotateY(z);
                this.rotateX(y);
                this.rotateZ(x);
                break;
            case RotationOrder.ZYX:
                this.setRotateX(z);
                this.rotateY(y);
                this.rotateZ(x);
                break;
        }
        return this;
    }

    /**
     * Set as a perspective projection matrix.
     * @param {number} fovx Horizontal field of view, in radians
     * @param {number} aspect Aspect ratio
     * @param {number} near Distance to the near clipping plane
     * @param {number} far Distance to the far clipping plane
     */
    setPerspective(fovx, aspect, near, far) {
        const out = this;
        const f = 1.0 / Math.tan(fovx / 2);
        out[0] = f / aspect;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = f;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[11] = -1;
        out[12] = 0;
        out[13] = 0;
        out[15] = 0;
        if (far !== null && far !== Infinity) {
            const nearFar = 1 / (near - far);
            out[10] = (far + near) * nearFar;
            out[14] = (2 * far * near) * nearFar;
        } else {
            out[10] = -1;
            out[14] = -2 * near;
        }
        return this;
    }

    /**
     * Set as an orthographic projection matrix.
     * @param {*} left 
     * @param {*} right 
     * @param {*} bottom 
     * @param {*} top 
     * @param {*} near 
     * @param {*} far 
     */
    setOrtho(left, right, bottom, top, near, far) {
        const out = this;
        const lr = 1 / (left - right);
        const bt = 1 / (bottom - top);
        const nf = 1 / (near - far);
        out[0] = -2 * lr;
        out[1] = 0;
        out[2] = 0;
        out[3] = 0;
        out[4] = 0;
        out[5] = -2 * bt;
        out[6] = 0;
        out[7] = 0;
        out[8] = 0;
        out[9] = 0;
        out[10] = 2 * nf;
        out[11] = 0;
        out[12] = (left + right) * lr;
        out[13] = (top + bottom) * bt;
        out[14] = (far + near) * nf;
        out[15] = 1;
        return this;
    }

    /**
     * Set the matrix as a look-at transformation
     * @param {*} eye 
     * @param {*} center 
     * @param {*} up 
     */
    setLookAt(eye, center, up) {
        const out = this;
        const eyex = eye[0];
        const eyey = eye[1];
        const eyez = eye[2];
        const upx = up[0];
        const upy = up[1];
        const upz = up[2];
        const centerx = center[0];
        const centery = center[1];
        const centerz = center[2];

        if (Math.abs(eyex - centerx) < Epsilon &&
            Math.abs(eyey - centery) < Epsilon &&
            Math.abs(eyez - centerz) < Epsilon) {
            return out.setIdentity();
        }

        let z0 = eyex - centerx;
        let z1 = eyey - centery;
        let z2 = eyez - centerz;

        let len = 1 / Math.hypot(z0, z1, z2);
        z0 *= len;
        z1 *= len;
        z2 *= len;

        let x0 = upy * z2 - upz * z1;
        let x1 = upz * z0 - upx * z2;
        let x2 = upx * z1 - upy * z0;
        len = Math.hypot(x0, x1, x2);
        if (!len) {
            x0 = 0;
            x1 = 0;
            x2 = 0;
        } else {
            len = 1 / len;
            x0 *= len;
            x1 *= len;
            x2 *= len;
        }

        let y0 = z1 * x2 - z2 * x1;
        let y1 = z2 * x0 - z0 * x2;
        let y2 = z0 * x1 - z1 * x0;
        len = Math.hypot(y0, y1, y2);
        if (!len) {
            y0 = 0;
            y1 = 0;
            y2 = 0;
        } else {
            len = 1 / len;
            y0 *= len;
            y1 *= len;
            y2 *= len;
        }

        out[0] = x0;
        out[1] = y0;
        out[2] = z0;
        out[3] = 0;
        out[4] = x1;
        out[5] = y1;
        out[6] = z1;
        out[7] = 0;
        out[8] = x2;
        out[9] = y2;
        out[10] = z2;
        out[11] = 0;
        out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
        out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
        out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
        out[15] = 1;

        return this;
    }

    setTargetTo(eye, target, up) {
        const out = this;

        const eyex = eye[0];
        const eyey = eye[1];
        const eyez = eye[2];
        const upx = up[0];
        const upy = up[1];
        const upz = up[2];

        let z0 = eyex - target[0];
        let z1 = eyey - target[1];
        let z2 = eyez - target[2];
        let len = z0*z0 + z1*z1 + z2*z2;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
            z0 *= len;
            z1 *= len;
            z2 *= len;
        }

        let x0 = upy * z2 - upz * z1;
        let x1 = upz * z0 - upx * z2;
        let x2 = upx * z1 - upy * z0;
        len = x0*x0 + x1*x1 + x2*x2;
        if (len > 0) {
            len = 1 / Math.sqrt(len);
            x0 *= len;
            x1 *= len;
            x2 *= len;
        }

        out[0] = x0;
        out[1] = x1;
        out[2] = x2;
        out[3] = 0;
        out[4] = z1 * x2 - z2 * x1;
        out[5] = z2 * x0 - z0 * x2;
        out[6] = z0 * x1 - z1 * x0;
        out[7] = 0;
        out[8] = z0;
        out[9] = z1;
        out[10] = z2;
        out[11] = 0;
        out[12] = eyex;
        out[13] = eyey;
        out[14] = eyez;
        out[15] = 1;

        return this;
    }

    /**
     * Set the matrix from a set of vector columns
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     * @param {*} translate 
     */
    setColumns(x, y, z, translate) {
        if (x) {
            this.setColumn(0, x);
        }
        if (y) {
            this.setColumn(1, y);
        }
        if (z) {
            this.setColumn(2, z);
        }
        if (translate) {
            this.setColumn(3, translate);
        }
        return this;
    }

    /**
     * Extracts the x-axis from this matrix.
     * @param {Vector3?} out optional storage for the results.
     * @return {Vector3}
     */
    getX(out) {
        out = out || new Vector3();
        out[0] = this[0];
        out[1] = this[1];
        out[2] = this[2];
        return out;
    }

    /**
     * Extracts the y-axis from this matrix.
     * @param {Vector3?} out optional storage for the results.
     * @return {Vector3}
     */
    getY(out) {
        out = out || new Vector3();
        out[0] = this[4];
        out[1] = this[5];
        out[2] = this[6];
        return out;
    }

    /**
     * Extracts the z-axis from this matrix.
     * @param {Vector3?} out optional storage for the results.
     * @return {Vector3}
     */
    getZ(out) {
        out = out || new Vector3();
        out[0] = -this[8];
        out[1] = -this[9];
        out[2] = -this[10];
        return out;
    }

    /**
     * Extracts the translational component of this matrix.
     * @param {Vector3?} out optional storage for the results.
     * @return {Vector3}
     */
    getTranslation(out) {
        out = out || new Vector3();
        out[0] = this[12];
        out[1] = this[13];
        out[2] = this[14];
        return out;
    }

    /**
     * Extracts the scaling component of this matrix.
     * @param {Vector3?} out optional storage for the results.
     * @return {Vector3}
     */
    getScale(out) {
        out = out || new Vector3();
        const mat = this;
        const m11 = mat[0];
        const m12 = mat[1];
        const m13 = mat[2];
        const m21 = mat[4];
        const m22 = mat[5];
        const m23 = mat[6];
        const m31 = mat[8];
        const m32 = mat[9];
        const m33 = mat[10];

        out[0] = Math.hypot(m11, m12, m13);
        out[1] = Math.hypot(m21, m22, m23);
        out[2] = Math.hypot(m31, m32, m33);

        return out;
    }

    /**
     * Extract the euler rotation angles, in degrees, from the matrix.
     * @param {Vector3} [out] Optional output storage for the results.
     * @return {Vector3} 
     */
    getEulerAngles(out) {
        out = out || new Vector3();

        let sinY = this[8];
        if (sinY < -1.0) {
            sinY = -1.0;
        }

        if (sinY > 1.0) {
            sinY = 1.0;
        }

        let cosY = Math.sqrt(1.0 - sinY * sinY);
        if (this[0] < 0.0 && this[10] < 0.0) {
            cosY = -cosY;
        }

        if (Math.abs(cosY) > Epsilon) {
            out[0] = Math.atan2(this[9] / cosY, this[10] / cosY) * RadianToDegree;
            out[1] = Math.atan2(sinY, cosY) * RadianToDegree;
            out[2] = Math.atan2(this[4] / cosY, this[0] / cosY)* RadianToDegree;
            return out;
        }

        out[0] = Math.atan2(-this[6], this[5]) * RadianToDegree;
        out[1] = Math.asin(sinY) * RadianToDegree;
        out[2] = 0.0;
    }

    /**
     * Transpose the matrix.
     * @return {Matrix4} Returns this matrix.
     */
    transpose() {
        const m = this;
        const a01 = m[1];
        const a02 = m[2]; 
        const a03 = m[3];
        const a12 = m[6]; 
        const a13 = m[7];
        const a23 = m[11];

        m[1] = m[4];
        m[2] = m[8];
        m[3] = m[12];
        m[4] = a01;
        m[6] = m[9];
        m[7] = m[13];
        m[8] = a02;
        m[9] = a12;
        m[11] = m[14];
        m[12] = a03;
        m[13] = a13;
        m[14] = a23;
        return this;
    }

    /**
     * Invert the matrix.
     * @param {Matrix4?} out Optional storage for the inverted matrix. If not provided,
     * invert itself.
     * @return {Matrix4}
     */
    invert(out) {
        out = out || this;
        const a = this;
        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];
        const a10 = a[4];
        const a11 = a[5];
        const a12 = a[6];
        const a13 = a[7];
        const a20 = a[8];
        const a21 = a[9];
        const a22 = a[10];
        const a23 = a[11];
        const a30 = a[12];
        const a31 = a[13];
        const a32 = a[14];
        const a33 = a[15];

        const b00 = a00 * a11 - a01 * a10;
        const b01 = a00 * a12 - a02 * a10;
        const b02 = a00 * a13 - a03 * a10;
        const b03 = a01 * a12 - a02 * a11;
        const b04 = a01 * a13 - a03 * a11;
        const b05 = a02 * a13 - a03 * a12;
        const b06 = a20 * a31 - a21 * a30;
        const b07 = a20 * a32 - a22 * a30;
        const b08 = a20 * a33 - a23 * a30;
        const b09 = a21 * a32 - a22 * a31;
        const b10 = a21 * a33 - a23 * a31;
        const b11 = a22 * a33 - a23 * a32;

        // Calculate the determinant
        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        if (!det) {
            return out;
        }
        det = 1.0 / det;

        out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
        out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
        out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
        out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
        out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
        out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
        out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
        out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
        out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
        out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
        out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
        out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
        out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
        out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
        out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
        out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

        return out;
    }

    /**
     * Calculate the determinant of the matrix.
     * @return {number}
     */
    determinant() {
        const m = this;
        const m00 = m[0];
        const m01 = m[1];
        const m02 = m[2];
        const m03 = m[3];
        const m10 = m[4];
        const m11 = m[5];
        const m12 = m[6];
        const m13 = m[7];
        const m20 = m[8];
        const m21 = m[9];
        const m22 = m[10];
        const m23 = m[11];
        const m30 = m[12];
        const m31 = m[13];
        const m32 = m[14];
        const m33 = m[15];

        const b00 = m00 * m11 - m01 * m10;
        const b01 = m00 * m12 - m02 * m10;
        const b02 = m00 * m13 - m03 * m10;
        const b03 = m01 * m12 - m02 * m11;
        const b04 = m01 * m13 - m03 * m11;
        const b05 = m02 * m13 - m03 * m12;
        const b06 = m20 * m31 - m21 * m30;
        const b07 = m20 * m32 - m22 * m30;
        const b08 = m20 * m33 - m23 * m30;
        const b09 = m21 * m32 - m22 * m31;
        const b10 = m21 * m33 - m23 * m31;
        const b11 = m22 * m33 - m23 * m32;

        // Calculate the determinant
        return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    }

    /**
     * Translate the matrix.
     * @param {*} arguments Can either be a Vector3 or 3 numbers.
     * @return {Matrix4} Returns this matrix.
     * @example
     * translate(Vector3)
     * translate(x, y, z)
     */
    translate() {
        const n = arguments.length;
        const v = n == 1 ? arguments[0] : arguments;
        const x = v[0];
        const y = v[1];
        const z = v[2];
        const o = this;
        const a = this;
        o[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        o[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        o[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        o[15] = a[3] * x + a[7] * y + a[11] * z + a[15];

        return this;
    }

    /**
     * Scale the matrix
     * @param {*} arguments Can either be a Vector3 or 3 numbers.
     * @return {Matrix4} Returns this matrix.
     * @example
     * scale(Vector3)
     * scale(x, y, z)
     */
    scale() {
        if (!arguments.length) {
            return;
        }
        const v = arguments[0].length >= 3 ? arguments[0] : arguments;
        const x = v[0];
        const y = v[1];
        const z = v[2];
        const a = this;
        const out = this;
        out[0] = a[0] * x;
        out[1] = a[1] * x;
        out[2] = a[2] * x;
        out[3] = a[3] * x;
        out[4] = a[4] * y;
        out[5] = a[5] * y;
        out[6] = a[6] * y;
        out[7] = a[7] * y;
        out[8] = a[8] * z;
        out[9] = a[9] * z;
        out[10] = a[10] * z;
        out[11] = a[11] * z;
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
        return this;
    }

    /**
     * Rotate the matrix around the X axis.
     * @param {number} angle The amount to rotate, in degrees.
     * @return {Matrix4} Returns this matrix.
     */
    rotateX(angle) {
        const rad = angle * DegreeToRadian;
        const a = this;
        const out = this;

        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a10 = a[4];
        const a11 = a[5];
        const a12 = a[6];
        const a13 = a[7];
        const a20 = a[8];
        const a21 = a[9];
        const a22 = a[10];
        const a23 = a[11];

        // Perform axis-specific matrix multiplication
        out[4] = a10 * c + a20 * s;
        out[5] = a11 * c + a21 * s;
        out[6] = a12 * c + a22 * s;
        out[7] = a13 * c + a23 * s;
        out[8] = a20 * c - a10 * s;
        out[9] = a21 * c - a11 * s;
        out[10] = a22 * c - a12 * s;
        out[11] = a23 * c - a13 * s;

        return this;
    }

    /**
     * Rotate the matrix around the Y axis.
     * @param {number} angle The amount to rotate, in degrees.
     * @return {Matrix4} Returns this matrix.
     */
    rotateY(angle) {
        const rad = angle * DegreeToRadian;
        const a = this;
        const out = this;

        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];
        const a20 = a[8];
        const a21 = a[9];
        const a22 = a[10];
        const a23 = a[11];

        // Perform axis-specific matrix multiplication
        out[0] = a00 * c - a20 * s;
        out[1] = a01 * c - a21 * s;
        out[2] = a02 * c - a22 * s;
        out[3] = a03 * c - a23 * s;
        out[8] = a00 * s + a20 * c;
        out[9] = a01 * s + a21 * c;
        out[10] = a02 * s + a22 * c;
        out[11] = a03 * s + a23 * c;

        return this;
    }

    /**
     * Rotate the matrix around the Z axis.
     * @param {number} angle The amount to rotate, in degrees.
     * @return {Matrix4} Returns this matrix.
     */
    rotateZ(angle) {
        const rad = angle * DegreeToRadian;
        const a = this;
        const out = this;

        const s = Math.sin(rad);
        const c = Math.cos(rad);
        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];
        const a10 = a[4];
        const a11 = a[5];
        const a12 = a[6];
        const a13 = a[7];
        // Perform axis-specific matrix multiplication
        out[0] = a00 * c + a10 * s;
        out[1] = a01 * c + a11 * s;
        out[2] = a02 * c + a12 * s;
        out[3] = a03 * c + a13 * s;
        out[4] = a10 * c - a00 * s;
        out[5] = a11 * c - a01 * s;
        out[6] = a12 * c - a02 * s;
        out[7] = a13 * c - a03 * s;

        return this;
    }

    /**
     * Rotate the matrix by the given euler angles. Angles are given in degrees.
     * @return {Matrix4} Returns this matrix.
     * @example
     * rotateEuler(x, y, z, order = RotationOrder.Default)
     * rotateEuler(Vector3, order = RotationOrder.Default)
     */
    rotateEuler() {
        const numArgs = arguments.length;
        let x, y, z, order;
        if (numArgs <= 2) {
            x = arguments[0][0];
            y = arguments[0][1];
            z = arguments[0][2];
            order = arguments[1] !== undefined ? arguments[1] : RotationOrder.Default;
        } else if (numArgs == 3 || numArgs == 4) {
            x = arguments[0];
            y = arguments[1];
            z = arguments[2];
            order = arguments[3] !== undefined ? arguments[3] : RotationOrder.Default;
        } else {
            throw "invalid arguments for rotateEuler";
        }
        switch (order) {
            case RotationOrder.ZYX:
                this.rotateZ(z);
                this.rotateY(y);
                this.rotateX(x);
                break;
            case RotationOrder.YZX:
                this.rotateY(z);
                this.rotateZ(y);
                this.rotateX(x);
                break;
            case RotationOrder.XZY:
                this.rotateX(z);
                this.rotateZ(y);
                this.rotateY(x);
                break;
            case RotationOrder.ZXY:
                this.rotateZ(z);
                this.rotateX(y);
                this.rotateY(x);
                break;
            case RotationOrder.YXZ:
                this.rotateY(z);
                this.rotateX(y);
                this.rotateZ(x);
                break;
            case RotationOrder.XYZ:
                this.rotateX(z);
                this.rotateY(y);
                this.rotateZ(x);
                break;
        }
        return this;
    }

    /**
     * Remove any scaling from the matrix.
     * @return {Matrix4} Returns this matrix.
     */
    normalizeScale() {
        const m = this;
        let l = Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]);
        if (l != 0) {
            l = 1 / l;
        }
        m[0] *= l;
        m[1] *= l;
        m[2] *= l;

        l = Math.sqrt(m[4] * m[4] + m[5] * m[5] + m[6] * m[6]);
        if (l != 0) {
            l = 1 / l;
        }
        m[4] *= l;
        m[5] *= l;
        m[6] *= l;

        l = Math.sqrt(m[8] * m[8] + m[9] * m[9] + m[10] * m[10]);
        if (l != 0) {
            l = 1 / l;
        }
        m[8] *= l;
        m[9] *= l;
        m[10] *= l;

        return this;
    }

    /**
     * Transform a Vector3
     * @param {Vector3} v The Vector3 to transform
     * @param {number?} w The w coordinate of the vector. 0 for a vector, 1 for a point. Default 1.
     * @param {Vector3?} out Optional storage for the results.
     * @return {Vector3}
     */
    transformVector3(v, w, out) {
        if (w === undefined) {
            w = 1;
        }
        const x = v[0];
        const y = v[1];
        const z = v[2];
        const m = this;
        out = out || new Vector3();
        out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
        out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
        out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
        return out;
    }

    /**
     * Transform a Vector4
     * @param {Vector4} v The Vector4 to transform
     * @param {Vector4?} out Optional storage for the results.
     * @return {Vector4}
     */
    transformVector4(v, out) {
        const x = v[0];
        const y = v[1];
        const z = v[2];
        const w = v[3];
        const m = this;
        out = out || new Vector4();
        out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
        out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
        out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
        out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
        return out;
    }

    /**
     * Transpose a Matrix4.
     * @param {Matrix4} m 
     * @param {Matrix4?} out 
     * @return {Matrix4}
     */
    static transpose(m, out) {
        out = out || new Matrix4();
        out.set(m[0], m[4], m[8], m[12],
                m[1], m[5], m[9], m[13],
                m[2], m[6], m[10], m[14],
                m[3], m[7], m[11], m[15]);
        return out;
    }

    /**
     * Invert a Matrix4.
     * @param {Matrix4} m 
     * @param {Matrix4?} out 
     * @return {Matrix4}
     */
    static invert(m, out) {
        out = out || new Matrix4();
        out.set(m);
        return out.invert();
    }

    /**
     * Translate a Matrix4.
     * @param {Matrix4} m 
     * @param {Vector3} v 
     * @param {Matrix4?} out 
     * @return {Matrix4}
     */
    static translate(m, v, out) {
        if (out === undefined) {
            out = this.clone();
        } else {
            out.set(this);
        }
        return out.translate(v);
    }

    /**
     * Scale a Matrix4.
     * @param {Matrix4} m 
     * @param {Vector3} v 
     * @param {Matrix4?} out 
     * @return {Matrix4}
     */
    static scale(m, v, out) {
        if (out === undefined) {
            out = m.clone();
        } else {
            out.set(m);
        }
        return out.scale(v);
    }

    /**
     * Multiply two Matrix4s.
     * @param {Matrix4} a 
     * @param {Matrix4} b 
     * @param {Matrix4?} out 
     * @return {Matrix4}
     */
    static multiply(a, b, out) {
        out = out || new Matrix4();

        const o = out;

        const a00 = a[0];
        const a01 = a[1];
        const a02 = a[2];
        const a03 = a[3];
        const a10 = a[4];
        const a11 = a[5];
        const a12 = a[6];
        const a13 = a[7];
        const a20 = a[8];
        const a21 = a[9];
        const a22 = a[10];
        const a23 = a[11];
        const a30 = a[12];
        const a31 = a[13];
        const a32 = a[14];
        const a33 = a[15];

        let b0 = b[0];
        let b1 = b[1];
        let b2 = b[2];
        let b3 = b[3];
        o[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        o[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        o[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        o[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[4];
        b1 = b[5];
        b2 = b[6];
        b3 = b[7];
        o[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        o[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        o[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        o[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[8];
        b1 = b[9];
        b2 = b[10];
        b3 = b[11];
        o[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        o[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        o[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        o[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;

        b0 = b[12];
        b1 = b[13];
        b2 = b[14];
        b3 = b[15];
        o[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
        o[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
        o[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
        o[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
        
        return out;
    }
}

/**
 * @property {Matrix4} Zero A Matrix4 filled with zeros.
 */
Matrix4.Zero = new Matrix4(0);

/**
 * @property {Matrix4} Identity An identity Matrix4.
 */
Matrix4.Identity = new Matrix4();
