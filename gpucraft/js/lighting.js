import { VoxelData } from "./voxel_data.js";
import { Globals } from "./globals.js";

export class Lighting {
    static recalculateNaturalLight(chunkData) {
        for (let z = 0; z < VoxelData.ChunkWidth; ++z) {
            for (let x = 0; x < VoxelData.ChunkWidth; ++x) {
                Lighting.castNaturalLight(chunkData, x, z, VoxelData.ChunkHeight - 1);
            }
        }
    }

    // Propogates natural light straight down from at the given x,z coords starting from the
    // startY value.
    static castNaturalLight(chunkData, x, z, startY) {
        // Little check to make sure we don't try and start from above the world.
        if (startY > VoxelData.ChunkHeight - 1) {
            startY = VoxelData.ChunkHeight - 1;
        }

        // Keep check of whether the light has hit a block with opacity
        let obstructed = false;

        for (let y = startY; y > -1; --y) {
            const index = chunkData.getVoxelIndex(x, y, z);
            const voxelID = chunkData.voxelID[index];
            const properties = Globals.world.blockTypes[voxelID];

            if (obstructed) {
                chunkData.voxelLight[index] = 0;
            } else if (properties.opacity > 0) {
                chunkData.voxelLight[index] = 0;
                obstructed = true;
            } else {
                chunkData.voxelLight[index] = 15;
            }
        }
    }
}
