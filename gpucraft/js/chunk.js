import { VoxelData } from "./voxel_data.js";
import { SceneObject } from "./scene_object.js";
import { Mesh } from "./gpu/mesh.js";

export class Chunk extends SceneObject {
    constructor(coord, world) {
        super(`${coord.x},${coord.z}`, world);

        this.coord = coord;
        this.world = world;

        this.vertexIndex = 0;
        this.vertices = [];
        this.triangles = [];
        this.transparentTriangles = [];
        this.uvs = [];
        this.normals = [];
        this.colors = [];

        this.meshData = {
            points: this.vertices,
            normals: this.normals,
            colors: this.colors,
            uvs: this.uvs,
            triangles: this.triangles
        };

        const x = coord.x * VoxelData.ChunkWidth;
        const z = coord.z * VoxelData.ChunkWidth;
        this.setPosition(x, 0, z);

        this.chunkData = world.worldData.requestChunk(x, z, true);
        this.chunkData.chunk = this;

        world.addChunkToUpdate(this);
    }

    updateChunk() {
        this.clearMeshData();

        for (let y = 0; y < VoxelData.ChunkHeight; ++y) {
            for (let x = 0; x < VoxelData.ChunkWidth; ++x) {
                for (let z = 0; z < VoxelData.ChunkWidth; ++z) {
                    const voxel = this.chunkData.getVoxelID(x, y, z);
                    if (this.world.blockTypes[voxel].isSolid) {
                        this.updateMeshData(x, y, z);
                    }
                }
            }
        }

        this.world.chunksToDraw.push(this);
        if (this.mesh) {
            this.mesh.dirty = true;
        }
    }

    clearMeshData() {
        this.vertexIndex = 0;
        this.vertices.length = 0;
        this.triangles.length = 0;
        this.transparentTriangles.length = 0;
        this.uvs.length = 0;
        this.colors.length = 0;
        this.normals.length = 0;
    }

    editVoxel(x, y, z, newID) {
        const xCheck = Math.floor(x) - Math.floor(this.position[0]);
        const yCheck = Math.floor(y);
        const zCheck = Math.floor(z) - Math.floor(this.position[2]);

        this.chunkData.modifyVoxel(xCheck, yCheck, zCheck, newID);

        this.updateSurroundingVoxels(xCheck, yCheck, zCheck);
    }

    updateSurroundingVoxels(x, y, z) {
        const pos = this.position;
        for (let p = 0; p < 6; ++p) {
            const cx = x + VoxelData.FaceChecks[p][0];
            const cy = y + VoxelData.FaceChecks[p][1];
            const cz = z + VoxelData.FaceChecks[p][2];

            if (!this.chunkData.isVoxelInChunk(cx, cy, cz)) {
                this.world.addChunkToUpdate(this.world.getChunkFromPosition(cx + pos[0],
                    cy + pos[1], cz + pos[2]), true);
            }
        }
    }

    getVoxelIDFromGlobalPosition(x, y, z) {
        const pos = this.position;
        const xCheck = Math.floor(x) - Math.floor(pos[0]);
        const yCheck = Math.floor(y);
        const zCheck = Math.floor(z) - Math.floor(pos[2]);
        return this.chunkData.getVoxelID(xCheck, yCheck, zCheck);
    }

    getVoxelLightFromGlobalPosition(x, y, z) {
        const pos = this.position;
        const xCheck = Math.floor(x) - Math.floor(pos[0]);
        const yCheck = Math.floor(y);
        const zCheck = Math.floor(z) - Math.floor(pos[2]);
        return this.chunkData.getVoxelLight(xCheck, yCheck, zCheck);
    }

    updateMeshData(x, y, z) {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const zi = Math.floor(z);

        const voxelID = this.chunkData.getVoxelID(xi, yi, zi);
        const properties = this.world.blockTypes[voxelID];

        const pos = this.position;
        const px = Math.floor(pos[0]);
        const py = Math.floor(pos[1]);
        const pz = Math.floor(pos[2]);

        const world = this.world;
        const worldData = world.worldData;

        for (let p = 0; p < 6; ++p) {
            const nx = px + xi + VoxelData.FaceChecks[p][0];
            const ny = py + yi + VoxelData.FaceChecks[p][1];
            const nz = pz + zi + VoxelData.FaceChecks[p][2];

            const neighborID = worldData.getVoxelID(nx, ny, nz);
            const neighborProperties = world.blockTypes[neighborID];

            //const neighbor = voxel.neighbors.get(p);
            const tri = VoxelData.VoxelTris[p];

            if (world.blockTypes[neighborID].renderNeighborFaces) {
                this.vertices.push(x + VoxelData.VoxelVerts[tri[0]][0],
                    y + VoxelData.VoxelVerts[tri[0]][1],
                    z + VoxelData.VoxelVerts[tri[0]][2],
                    x + VoxelData.VoxelVerts[tri[1]][0],
                    y + VoxelData.VoxelVerts[tri[1]][1],
                    z + VoxelData.VoxelVerts[tri[1]][2],
                    x + VoxelData.VoxelVerts[tri[2]][0],
                    y + VoxelData.VoxelVerts[tri[2]][1],
                    z + VoxelData.VoxelVerts[tri[2]][2],
                    x + VoxelData.VoxelVerts[tri[3]][0],
                    y + VoxelData.VoxelVerts[tri[3]][1],
                    z + VoxelData.VoxelVerts[tri[3]][2]);

                this.normals.push(VoxelData.VoxelNormals[p][0],
                    VoxelData.VoxelNormals[p][1],
                    VoxelData.VoxelNormals[p][2],
                    VoxelData.VoxelNormals[p][0],
                    VoxelData.VoxelNormals[p][1],
                    VoxelData.VoxelNormals[p][2],
                    VoxelData.VoxelNormals[p][0],
                    VoxelData.VoxelNormals[p][1],
                    VoxelData.VoxelNormals[p][2],
                    VoxelData.VoxelNormals[p][0],
                    VoxelData.VoxelNormals[p][1],
                    VoxelData.VoxelNormals[p][2]);

                this.addTexture(properties.textures[p]);

                const lightLevel = worldData.getVoxelLight(nx, ny, nz) * VoxelData.unitOfLight;

                this.colors.push(
                    0, 0, 0, lightLevel,
                    0, 0, 0, lightLevel,
                    0, 0, 0, lightLevel,
                    0, 0, 0, lightLevel);

                if (!neighborProperties.renderNeighborFaces) {
                    this.triangles.push(this.vertexIndex,
                        this.vertexIndex + 1,
                        this.vertexIndex + 2,
                        this.vertexIndex + 2,
                        this.vertexIndex + 1,
                        this.vertexIndex + 3);
                } else {
                    this.triangles.push(this.vertexIndex,
                        this.vertexIndex + 1,
                        this.vertexIndex + 2,
                        this.vertexIndex + 2,
                        this.vertexIndex + 1,
                        this.vertexIndex + 3);
                }

                this.vertexIndex += 4;
            }
        }
    }

    addTexture(textureId) {
        let y = (textureId / VoxelData.TextureAtlasSizeInBlocks)|0;
        let x = textureId - (y * VoxelData.TextureAtlasSizeInBlocks);

        x *= VoxelData.NormalizedBlockTextureSize;
        y *= VoxelData.NormalizedBlockTextureSize;

        y = 1 - y - VoxelData.NormalizedBlockTextureSize;

        const ps = VoxelData.NormalizedTexturePixelSize * 2;

        x += ps;
        y += ps;
        const w = VoxelData.NormalizedBlockTextureSize - (ps * 2);

        this.uvs.push(x, 1 - y,
            x, 1 - (y + w),
            x + w, 1 - y,
            x + w, 1 - (y + w));
    }
    
    createMesh(device) {
        if (this.mesh) {
            if (!this.mesh.dirty) {
                return;
            }
            this.mesh.destroy();
        }
        this.mesh = new Mesh(device, this.meshData);
    }
}
