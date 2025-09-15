import { ChunkData } from "./chunk_data.js";
import { VoxelData } from "./voxel_data.js";

export class WorldData {
    constructor(options) {
        options = options || {};

        this.name = options.name || "World";
        this.seed = options.seed || 12345;

        this._chunks = new Map();
        this._modifiedChunks = [];
    }

    get chunks() { return this._chunks; }

    get modifiedChunks() { return this._modifiedChunks; }

    addToModifiedChunkList(chunk) {
        if (!this._modifiedChunks.includes(chunk)) {
            this._modifiedChunks.push(chunk);
        }
    }

    getChunk(x, z) {
        const m = this._chunks.get(z);
        if (!m) {
            return null;
        }
        if (!m.has(x)) {
            return null;
        }
        return m.get(x);
    }

    setChunk(x, z, chunk) {
        if (!this._chunks.has(z)) {
            this._chunks.set(z, new Map());
        }
        this._chunks.get(z).set(x, chunk);
    }

    requestChunk(x, z, create) {
        let c = this.getChunk(x, z);
        if (!c && create) {
            c = this.loadChunk(x, z);
        }
        return c;
    }

    loadChunk(x, z) {
        let c = this.getChunk(x ,z);
        if (c) {
            return c;
        }

        c = new ChunkData(x, z);
        this.setChunk(x, z, c);
        c.populate();

        return c;
    }

    isVoxelInWorld(x, y) {
        return y >= 0 && y < VoxelData.ChunkHeight;
    }

    setVoxelID(x, y, z, value) {
        if (!this.isVoxelInWorld(x, y, z)) {
            return;
        }

        const cx = (Math.floor(x / VoxelData.ChunkWidth) | 0) * VoxelData.ChunkWidth;
        const cz = (Math.floor(z / VoxelData.ChunkWidth) | 0) * VoxelData.ChunkWidth;
        
        const chunk = this.requestChunk(cx, cz, true);

        chunk.modifyVoxel((x - cx) | 0, y | 0, (z - cz) | 0, value);
    }

    getVoxelID(x, y, z) {
        if (x && x.constructor === Array) {
            y = x[1];
            z = x[2];
            x = x[0];
        }

        if (!this.isVoxelInWorld(x, y, z)) {
            return 0;
        }

        const cx = Math.floor(x / VoxelData.ChunkWidth) * VoxelData.ChunkWidth;
        const cz = Math.floor(z / VoxelData.ChunkWidth) * VoxelData.ChunkWidth;

        const chunk = this.requestChunk(cx, cz, false);
        if (!chunk) {
            return 0;
        }

        return chunk.getVoxelID((x - cx) | 0, y | 0, (z - cz) | 0);
    }

    getVoxelLight(x, y, z) {
        if (x && x.constructor === Array) {
            y = x[1];
            z = x[2];
            x = x[0];
        }

        if (!this.isVoxelInWorld(x, y, z)) {
            return 0;
        }

        const cx = Math.floor(x / VoxelData.ChunkWidth) * VoxelData.ChunkWidth;
        const cz = Math.floor(z / VoxelData.ChunkWidth) * VoxelData.ChunkWidth;

        const chunk = this.requestChunk(cx, cz, false);
        if (!chunk) {
            return 0;
        }

        return chunk.getVoxelLight((x - cx) | 0, y | 0, (z - cz) | 0);
    }
}
