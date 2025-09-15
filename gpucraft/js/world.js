import { BiomeAttributes, Lode } from "./biome_attributes.js";
import { Vector3 } from "./math/vector3.js";
import { Vector4 } from "./math/vector4.js";
import { Globals } from "./globals.js";
import { WorldData } from "./world_data.js";
import { Random } from "./math/random.js";
import { BlockType } from "./block_type.js";
import { ChunkCoord } from "./chunk_coord.js";
import { VoxelData } from "./voxel_data.js";
import { Chunk } from "./chunk.js";
import { Noise } from "./math/noise.js";
import { Transform } from "./transform.js";

export class World extends Transform {
    constructor() {
        super();
        Globals.world = this;

        this.biomes = [
            new BiomeAttributes({
                name: "Grasslands",
                offset: 1234,
                scale: 0.042,
                terrainHeight: 22,
                terrainScale: 0.15,
                surfaceBlock: 3,
                subSurfaceBlock: 5,
                majorFloraIndex: 0,
                majorFloraZoneScale: 1.3,
                majorFloraZoneThreshold: 0.6,
                majorFloraPlacementScale: 15,
                majorFloraPlacementThreshold: 0.8,
                placeMajorFlora: 1,
                maxHeight: 12,
                minHeight: 5,
                lodes: [
                    new Lode({
                        name: "Dirt",
                        blockID: 5,
                        minHeight: 1,
                        maxHeight: 255,
                        scale: 0.1,
                        threshold: 0.5,
                        noiseOffset: 0
                    }),
                    new Lode({
                        name: "Sand",
                        blockID: 4,
                        minHeight: 30,
                        maxHeight: 60,
                        scale: 0.2,
                        threshold: 0.6,
                        noiseOffset: 500
                    }),
                    new Lode({
                        name: "Caves",
                        blockID: 0,
                        minHeight: 5,
                        maxHeight: 60,
                        scale: 0.1,
                        threshold: 0.55,
                        noiseOffset: 43534
                    })
                ]
            }),
            new BiomeAttributes({
                name: "Desert",
                offset: 6545,
                scale: 0.058,
                terrainHeight: 10,
                terrainScale: 0.05,
                surfaceBlock: 4,
                subSurfaceBlock: 4,
                majorFloraIndex: 1,
                majorFloraZoneScale: 1.06,
                majorFloraZoneThreshold: 0.75,
                majorFloraPlacementScale: 7.5,
                majorFloraPlacementThreshold: 0.8,
                placeMajorFlora: 1,
                maxHeight: 12,
                minHeight: 5,
                lodes: [
                    new Lode({
                        name: "Dirt",
                        blockID: 5,
                        minHeight: 1,
                        maxHeight: 255,
                        scale: 0.1,
                        threshold: 0.5,
                        noiseOffset: 0
                    }),
                    new Lode({
                        name: "Sand",
                        blockID: 4,
                        minHeight: 30,
                        maxHeight: 60,
                        scale: 0.2,
                        threshold: 0.6,
                        noiseOffset: 500
                    }),
                    new Lode({
                        name: "Caves",
                        blockID: 0,
                        minHeight: 5,
                        maxHeight: 60,
                        scale: 0.1,
                        threshold: 0.55,
                        noiseOffset: 43534
                    })
                ]
            }),
            new BiomeAttributes({
                name: "Forest",
                offset: 87544,
                scale: 0.17,
                terrainHeight: 80,
                terrainScale: 0.3,
                surfaceBlock: 5,
                subSurfaceBlock: 5,
                majorFloraIndex: 0,
                majorFloraZoneScale: 1.3,
                majorFloraZoneThreshold: 0.384,
                majorFloraPlacementScale: 5,
                majorFloraPlacementThreshold: 0.755,
                placeMajorFlora: 1,
                maxHeight: 12,
                minHeight: 5,
                lodes: [
                    new Lode({
                        name: "Dirt",
                        blockID: 5,
                        minHeight: 1,
                        maxHeight: 255,
                        scale: 0.1,
                        threshold: 0.5,
                        noiseOffset: 0
                    }),
                    new Lode({
                        name: "Sand",
                        blockID: 4,
                        minHeight: 30,
                        maxHeight: 60,
                        scale: 0.2,
                        threshold: 0.6,
                        noiseOffset: 500
                    }),
                    new Lode({
                        name: "Caves",
                        blockID: 0,
                        minHeight: 5,
                        maxHeight: 60,
                        scale: 0.1,
                        threshold: 0.55,
                        noiseOffset: 43534
                    })
                ]
            })
        ];

        this.worldData = new WorldData({ name: "World", seed: 2147483647 });

        this.settings = {
            "loadDistance": 4,
            "viewDistance": 2,
            "clouds": 2,
            "enableAnimatedChunks": false,
            "mouseSensitivity": 1.49643
        };

        this.random = new Random(this.worldData.seed);

        this.spawnPosition = new Vector3();

        this.blockTypes = [
            new BlockType({ name: "Air", isSolid: false, textures: [0, 0, 0, 0, 0, 0], renderNeighborFaces: true, opacity: 0 }),
            new BlockType({ name: "Bedrock", isSolid: true, textures: [9, 9, 9, 9, 9, 9], renderNeighborFaces: false, opacity: 15 }),
            new BlockType({ name: "Stone", isSolid: true, textures: [0, 0, 0, 0, 0, 0], renderNeighborFaces: false, opacity: 15 }),
            new BlockType({ name: "Grass", isSolid: true, textures: [2, 2, 7, 1, 2, 2], renderNeighborFaces: false, opacity: 15 }),
            new BlockType({ name: "Sand", isSolid: true, textures: [10, 10, 10, 10, 10, 10], renderNeighborFaces: false, opacity: 15 }),
            new BlockType({ name: "Dirt", isSolid: true, textures: [1, 1, 1, 1, 1, 1], renderNeighborFaces: false, opacity: 15 }),
            new BlockType({ name: "Wood", isSolid: true, textures: [5, 5, 6, 6, 5, 5], renderNeighborFaces: false, opacity: 15 }),
            new BlockType({ name: "Planks", isSolid: true, textures: [4, 4, 4, 4, 4, 4], renderNeighborFaces: false, opacity: 15 }),
            new BlockType({ name: "Bricks", isSolid: true, textures: [11, 11, 11, 11, 11, 11], renderNeighborFaces: false, opacity: 15 }),
            new BlockType({ name: "Cobblestone", isSolid: true, textures: [8, 8, 8, 8, 8, 8], renderNeighborFaces: false, opacity: 15 }),
            new BlockType({ name: "Glass", isSolid: true, textures: [3, 3, 3, 3, 3, 3], renderNeighborFaces: true, opacity: 0 }),
            new BlockType({ name: "Leaves", isSolid: true, textures: [16, 16, 16, 16, 16, 16], renderNeighborFaces: true, opacity: 5 }),
            new BlockType({ name: "Cactus", isSolid: true, textures: [18, 18, 19, 19, 18, 18], renderNeighborFaces: true, opacity: 15 }),
            new BlockType({ name: "Cactus Top", isSolid: true, textures: [18, 18, 17, 19, 18, 18], renderNeighborFaces: true, opacity: 15 })
        ];

        this._chunks = new Map();
        this.activeChunks = [];
        this.chunksToDraw = [];
        this.chunksToUpdate = [];
        this.modifications = [];
        this.applyingModifications = false;

        this.playerChunkCoord = new ChunkCoord();
        this.playerLastChunkCoord = new ChunkCoord();

        this.night = new Vector4(0, 0, 77/255, 1);
        this.day = new Vector4(0, 1, 250/255, 1);
        this.globalLightLevel = 1;
    }

    get camera() { return Globals.camera; }

    get player() { return Globals.player; }

    start() {
        this.random = new Random(this.seed);

        this.loadWorld();
        this.setGlobalLightLevel();

        this.spawnPosition.setFrom(VoxelData.WorldCenter, VoxelData.ChunkHeight - 75,
            VoxelData.WorldCenter);

        this.player.position = this.spawnPosition;

        this.checkViewDistance();

        this.getChunkCoordFromPosition(this.player.position, this.playerLastChunkCoord);
    }

    update(device) {
        this.getChunkCoordFromPosition(this.player.position, this.playerChunkCoord);

        // Only update the chunks if the player has moved to a new chunk
        if (!this.playerChunkCoord.equals(this.playerLastChunkCoord)) {
            this.checkViewDistance();
        }

        //while (this.chunksToDraw.length) {
        if (this.chunksToDraw.length) {
            this.chunksToDraw.pop().createMesh(device);
        }

        if (!this.applyingModifications) {
            this.applyModifications();
        }

        if (this.chunksToUpdate.length) {
            this.updateChunks();
        }
    }

    getChunk(x, z) {
        if (!this._chunks.get(x)) {
            return null;
        }
        return this._chunks.get(x).get(z);
    }

    setChunk(x, z, chunk) {
        let m = this._chunks.get(x);
        if (!m) {
            m = new Map();
            this._chunks.set(x, m);
        }
        m.set(z, chunk);
    }

    getChunkCoordFromPosition(pos, out) {
        out[0] = Math.floor(pos[0] / VoxelData.ChunkWidth);
        out[1] = Math.floor(pos[2] / VoxelData.ChunkWidth);
        return out;
    }

    getChunkFromPosition(pos) {
        const x = Math.floor(pos[0] / VoxelData.ChunkWidth);
        const z = Math.floor(pos[2] / VoxelData.ChunkWidth);
        return this.getChunk(x, z);
    }

    loadWorld() {
        //const hw = 10;
        const hw = VoxelData.WorldSizeInChunks / 2;
        const distance = this.settings.loadDistance;
        for (let x = hw - distance; x < hw + distance; ++x) {
            for (let z = hw - distance; z < hw + distance; ++z) {
                this.worldData.loadChunk(x, z);
            }
        }
    }

    addChunkToUpdate(chunk, insert) {
        insert = insert || false;
        if (!this.chunksToUpdate.includes(chunk)) {
            if (insert) {
                this.chunksToUpdate.unshift(chunk);
            } else {
                this.chunksToUpdate.push(chunk);
            }
        }
    }

    updateChunks() {
        const chunk = this.chunksToUpdate.shift();
        if (!chunk) {
            return;
        }
        chunk.updateChunk();
        if (!this.activeChunks.includes(chunk.coord)) {
            this.activeChunks.push(chunk.coord);
        }
    }

    applyModifications() {
        this.applyingModifications = true;

        while (this.modifications.length) {
            const queue = this.modifications.pop();
            for (let i = queue.length - 1; i >= 0; --i) {
                const v = queue[i];
                const p = v.position;
                this.worldData.setVoxelID(p[0], p[1], p[2], v.id);
            }
        }

        this.applyingModifications = false;
    }

    setGlobalLightLevel() {
        //this.material.setProperty("minGlobalLightLevel", VoxelData.minLightLevel);
        //this.material.setProperty("maxGlobalLightLevel", VoxelData.maxLightLevel);
        //this.material.setProperty("globalLightLevel", this.globalLightLevel);

        this.camera.backroundColor =
            Vector4.lerp(this.night, this.day, this.globalLightLevel);
    }

    checkViewDistance() {
        //this.clouds.updateClouds();

        this.playerLastChunkCoord.set(this.playerChunkCoord);

        const playerPos = this.player.position;
        const chunkX = Math.floor(playerPos.x / VoxelData.ChunkWidth);
        const chunkZ = Math.floor(playerPos.z / VoxelData.ChunkWidth);

        // clone the activeChunks array
        let previouslyActiveChunks = this.activeChunks.slice(0);

        this.activeChunks.length = 0;

        const viewDistance = this.settings.viewDistance;

        for (let x = chunkX - viewDistance; x <= chunkX + viewDistance; ++x) {
            for (let z = chunkZ - viewDistance; z <= chunkZ + viewDistance; ++z) {
                // If the chunk is within the world bounds and it has not been created.
                if (this.isChunkInWorld(x, z)) {
                    let chunk = this.getChunk(x, z);
                    if (!chunk) {
                        chunk = new Chunk(new ChunkCoord(x, z), this);
                        this.setChunk(x, z, chunk);
                    }

                    chunk.isActive = true;
                    this.activeChunks.push(chunk.coord);
                }

                // Check if this chunk was already in the active chunks list.
                for (let i = previouslyActiveChunks.length - 1; i >= 0; --i) {
                    if (previouslyActiveChunks[i].x == x && previouslyActiveChunks[i].z == z) {
                        previouslyActiveChunks.splice(i);
                    }
                }
            }
        }

        for (let i = 0, l = previouslyActiveChunks.length; i < l; ++i) {
            const coord = previouslyActiveChunks[i];
            this.getChunk(coord.x, coord.z).isActive = false;
        }
    }

    isChunkInWorld(/*x, z*/) {
        // An "infinite" world.
        return true;
    }

    isVoxelInWorld(x, y/*, z*/) {
        // An "infinite" world, at least in X and Z
        return y >= 0 && y < VoxelData.ChunkHeight;
    }

    checkForVoxel(x, y, z) {
        const voxel = this.worldData.getVoxelID(x, y, z);
        return this.blockTypes[voxel].isSolid;
    }

    getVoxelID(x, y, z) {
        return this.worldData.getVoxelID(x, y, z);
    }

    calculateVoxel(x, y, z) {
        const yPos = Math.floor(y);

        // If outside the world, return air
        if (!this.isVoxelInWorld(x, y, z)) {
            return 0;
        }

        // If bottom block of chunk, return bedrock.
        if (yPos == 0) {
            return 1;
        }

        let solidGroundHeight = 42;
        let sumOfHeights = 0;
        let count = 0;
        let strongestWeight = 0;
        let strongestBiomeIndex = 0;

        for (let i = 0, l = this.biomes.length; i < l; ++i) {
            const biome = this.biomes[i];
            const weight = World.get2DPerlin(x, z, biome.offset, biome.scale);

            // Keep track of which weight is strongest
            if (weight > strongestWeight) {
                strongestWeight = weight;
                strongestBiomeIndex = i;
            }

            const height = biome.terrainHeight *
                World.get2DPerlin(x, z, 0, biome.terrainScale) * weight;
            
            if (height > 0) {
                sumOfHeights += height;
                count++;
            }
        }

        // Set biome to the one with the strongest weight
        const biome = this.biomes[strongestBiomeIndex];

        // Get the average of the heights
        sumOfHeights /= count;

        const terrainHeight = Math.floor(sumOfHeights + solidGroundHeight);

        // Basic terrain pass
        let voxelValue = 0;

        if (yPos == terrainHeight) {
            voxelValue = biome.surfaceBlock;
        } else if (yPos < terrainHeight && yPos > terrainHeight - 4) {
            voxelValue = biome.subSurfaceBlock;
        } else if (yPos > terrainHeight) {
            return 0;
        } else {
            voxelValue = 2;
        }

        // Second pass
        if (voxelValue == 2) {
            for (let i = 0, l = biome.lodes.length; i < l; ++i) {
                const lode = biome.lodes[i];
                if (yPos > lode.minHeight && yPos < lode.maxHeight) {
                    if (World.get3DPerlin(x, y, z, lode.noiseOffset, lode.scale, lode.threshold)) {
                        voxelValue = lode.blockID;
                    }
                }
            }
        }

        return voxelValue;
    }

    static get2DPerlin(x, y, offset, scale) {
        return Noise.perlinNoise2((x + 0.1) / VoxelData.ChunkWidth * scale + offset, 
            (y + 0.1) / VoxelData.ChunkWidth * scale + offset);
    }

    static get3DPerlin(x, y, z, offset, scale, threshold) {
        x = (x + offset + 0.1) * scale;
        y = (y + offset + 0.1) * scale;
        z = (z + offset + 0.1) * scale;
        const AB = Noise.perlinNoise2(x, y);
        const BC = Noise.perlinNoise2(y, z);
        const AC = Noise.perlinNoise2(x, z);
        const BA = Noise.perlinNoise2(y, x);
        const CB = Noise.perlinNoise2(z, y);
        const CA = Noise.perlinNoise2(z, x);
        return ((AB + BC + AC + BA + CB + CA) / 6) > threshold;
    }
}
