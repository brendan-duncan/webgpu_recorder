import { Transform } from "./transform.js";

export class SceneObject extends Transform {
    constructor(name, parent) {
        super(parent);

        this.name = name || "";
        this.active = true;
        this.mesh = null;
        this.meshData = null;
        this.material = null;
    }
}
