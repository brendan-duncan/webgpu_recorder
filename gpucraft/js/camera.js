import { Globals } from "./globals.js";
import { DegreeToRadian } from "./math/math.js";
import { Matrix4 } from "./math/matrix4.js";
import { Transform } from "./transform.js";

export class Camera extends Transform {
    constructor(parent) {
        super(parent);
        Globals.camera = this;
        this._aspect = 1.0;
        this._fov = 60.0;

        this.setPosition(0, 1.8, 0);

        this._projectionDirty = true;
        this._projection = new Matrix4(0);

        this._worldToViewDirty = true;
        this._modelViewProjectionDirty = true;
        this._worldToView = new Matrix4();
        this._modelViewProjection = new Matrix4(0);
    }

    get fov() { return this._fov; }

    set fov(v) {
        if (this._fov === v) return;
        this._fov = v;
        this.projectionDirty = true;
    }

    get aspect() { return this._aspect; }

    set aspect(v) {
        if (this._aspect == v) return;
        this._aspect = v;
        this.projectionDirty = true;
    }

    get projectionDiry() { return this._projectionDirty; }

    set projectionDirty(v) {
        this._projectionDirty = v;
        if (v) {
            this._modelViewProjectionDirty = true;
        }
    }

    get projection() {
        if (this._projectionDirty) {
            this._projection.setPerspective(this.fov * DegreeToRadian, this.aspect, 0.3, 1000);
            this._projectionDirty = false;
        }
        return this._projection;
    }

    get localDirty() { return this._localDirty; }

    set localDirty(v) {
        this._localDirty = v;
        if (v) {
            this._worldToViewDirty = true;
            this._modelViewProjectionDirty = true;
            this.worldDirty = true;
        }
    }

    get worldDirty() { return this._worldDirty; }

    set worldDirty(v) {
        this._worldDirty = v;
        if (v) {
            this._worldToViewDirty = true;
            this._modelViewProjectionDirty = true;
            for (const c of this.children) {
                c.worldDirty = true;
            }
        }
    }

    get worldToView() {
        if (this._worldToViewDirty) {
            const t = this.worldTransform;
            Matrix4.invert(t, this._worldToView);
            this._worldToViewDirty = false;
        }
        return this._worldToView;
    }

    get modelViewProjection() {
        if (this._modelViewProjectionDirty) {
            const modelView = this.worldToView;
            const projection = this.projection;
            Matrix4.multiply(projection, modelView, this._modelViewProjection);
            this._modelViewProjectionDirty = false;
        }
        return this._modelViewProjection;
    }
}
