import { Matrix4 } from "./math/matrix4.js";
import { Vector3 } from "./math/vector3.js";

export class Transform {
    constructor(parent) {
        this.parent = parent ?? null;
        this.children = [];
        this._position = new Vector3(0, 0, 0);
        this._rotation = new Vector3(0, 0, 0);

        this._localDirty = true;
        this._worldDirty = true;

        this._transform = new Matrix4();
        this._worldTransform = new Matrix4();

        if (parent) {
            parent.children.push(this);
        }
    }

    addChild(c) {
        this.children.push(c);
        c.parent = this;
        c.worldDirty = true;
    }

    get position() { return this._position; }

    set position(v) {
        this._position.set(v);
        this.localDirty = true;
    }

    setPosition(x, y, z) {
        this._position.setFrom(x, y, z);
        this.localDirty = true;
    }

    get rotation() { return this._rotation; }

    set rotation(v) {
        this._rotation.set(v);
        this.localDirty = true;
    }

    setRotation(x, y, z) {
        this._rotation.setFrom(x, y, z);
        this.localDirty = true;
    }

    get localDirty() { return this._localDirty; }

    set localDirty(v) {
        this._localDirty = v;
        if (v) {
            this.worldDirty = true;
        }
    }

    get worldDirty() { return this._worldDirty; }

    set worldDirty(v) {
        this._worldDirty = v;
        if (v) {
            for (const c of this.children) {
                c.worldDirty = true;
            }
        }
    }

    get transform() {
        if (this._localDirty) {
            this._localDirty = false;
            this._transform.setTranslate(this.position);
            this._transform.rotateEuler(this.rotation);
        }
        return this._transform;
    }

    get worldTransform() {
        if (!this.parent) {
            return this.transform;
        }

        if (this._worldDirty) {
            const t = this.transform;
            const p = this.parent.worldTransform;
            Matrix4.multiply(p, t, this._worldTransform);
            this._worldDirty = false;
        }

        return this._worldTransform;
    }

    getWorldRight(out) {
        const t = this.worldTransform;
        return t.getColumn3(0, out);
    }

    getWorldUp(out) {
        const t = this.worldTransform;
        return t.getColumn3(1, out);
    }

    getWorldForward(out) {
        const t = this.worldTransform;
        return t.getColumn3(2, out);
    }

    getWorldPosition(out) {
        const t = this.worldTransform;
        return t.getColumn3(3, out);
    }
}
