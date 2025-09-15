import { VoxelData } from "./voxel_data.js";
import { Lighting } from "./lighting.js";
import { Globals } from "./globals.js";

export class ChunkData {
    constructor() {
        if (arguments.length === 1) {
            this.position = new Int32Array(arguments[0]);
        } else if (arguments.length === 2) {
            this.position = new Int32Array(2);
            this.position[0] = arguments[0];
            this.position[1] = arguments[1];
        } else {
            this.position = new Int32Array(2);
        }

        this._chunk = null;

        this.voxelID = new Uint8Array(VoxelData.ChunkWidth * VoxelData.ChunkHeight * VoxelData.ChunkWidth);
        this.voxelLight = new Uint8Array(VoxelData.ChunkWidth * VoxelData.ChunkHeight * VoxelData.ChunkWidth);
    }

    get chunk() { return this._chunk; }

    set chunk(v) { this._chunk = v; }

    populate() {
        const w = VoxelData.ChunkWidth;
        const h = VoxelData.ChunkHeight;
        for (let y = 0, vi = 0; y < h; ++y) {
            for (let z = 0; z < w; ++z) {
                for (let x = 0; x < w; ++x, ++vi) {
                    const gx = x + this.position[0];
                    const gy = y;
                    const gz = z + this.position[1];

                    this.voxelID[vi] = Globals.world.calculateVoxel(gx, gy, gz);
                    this.voxelLight[vi] = 0;
                }
            }
        }

        Lighting.recalculateNaturalLight(this);
        Globals.world.worldData.addToModifiedChunkList(this);
    }

    getVoxelProperties(id) {
        return Globals.world.blockTypes[id];
    }

    getVoxelIndex(x, y, z) {
        return y * VoxelData.ChunkWidthWidth + z * VoxelData.ChunkWidth + x;
    }

    getVoxelID(x, y, z) {
        return this.voxelID[y * VoxelData.ChunkWidthWidth + z * VoxelData.ChunkWidth + x];
    }

    setVoxelID(x, y, z, v) {
        this.voxelID[y * VoxelData.ChunkWidthWidth + z * VoxelData.ChunkWidth + x] = v;
    }

    getVoxelLight(x, y, z) {
        return this.voxelLight[y * VoxelData.ChunkWidthWidth + z * VoxelData.ChunkWidth + x];
    }

    setVoxelLight(x, y, z, v) {
        this.voxelLight[y * VoxelData.ChunkWidthWidth + z * VoxelData.ChunkWidth + x] = v;
    }

    modifyVoxel(x, y, z, id) {
        const voxel = this.getVoxelID(x, y, z);
        if (voxel == id) {
            return;
        }

        const oldProperties = this.getVoxelProperties(voxel);
        const oldOpacity = oldProperties.opacity;

        this.setVoxelID(x, y, z, id);

        const newProperties = this.getVoxelProperties(id);

        // If the opacity values of the voxel have changed and the voxel above is in direct
        // sunlight (or is above the world), recast light from that voxel downward.
        if (newProperties.opacity != oldOpacity &&
            (y == VoxelData.ChunkHeight - 1 || this.getVoxelLight(x, y + 1, z) == 15)) {
            Lighting.castNaturalLight(this, x, z, y + 1);
        }

        // Add this ChunkData to the modified chunks list.
        Globals.world.worldData.addToModifiedChunkList(this);

        // If we have a chunk attached, add that for updating.
        if (this._chunk) {
            Globals.world.addChunkToUpdate(this._chunk);
        }
    }

    isVoxelInChunk(x, y, z) {
        return x >= 0 && x < VoxelData.ChunkWidth &&
               y >= 0 && y < VoxelData.ChunkHeight &&
               z >= 0 && z < VoxelData.ChunkWidth;
    }
}
