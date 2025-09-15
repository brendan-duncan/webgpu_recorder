import { VoxelData } from "./voxel_data.js";

export class VoxelMap extends Uint8Array {
    constructor() {
        super(VoxelData.ChunkWidth * VoxelData.ChunkHeight * VoxelData.ChunkWidth);
    }

    get(x, y, z) {
        return this[z * VoxelData.ChunkWidthHeight + y * VoxelData.ChunkWidth + x];
    }

    set(x, y, z, v) {
        this[z * VoxelData.ChunkWidthHeight + y * VoxelData.ChunkWidth + x] = v;
    }
}
