import { Vector3 } from "./math/vector3.js";

export class VoxelMod {
    constructor(p, id) {
        this.position = p || new Vector3();
        this.id = id || 0;
    }
}
