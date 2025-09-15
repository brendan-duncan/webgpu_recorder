export const VoxelData = { };

VoxelData.ChunkWidth = 16;
VoxelData.ChunkHeight = 128;

VoxelData.WorldSizeInChunks = 40;

// Lighting values
VoxelData.minLightLevel = 0.1;
VoxelData.maxLightLevel = 0.9;

VoxelData.unitOfLight = 1 / 16;

VoxelData.seed = 0;

VoxelData.WorldCenter = (VoxelData.WorldSizeInChunks * VoxelData.ChunkWidth) / 2;

VoxelData.WorldSizeInVoxels = VoxelData.WorldSizeInChunks * VoxelData.ChunkWidth;

VoxelData.TextureWidth = 256;
VoxelData.NormalizedTexturePixelSize = 1 / VoxelData.TextureWidth;
VoxelData.TextureAtlasSizeInBlocks = 16;
VoxelData.NormalizedBlockTextureSize = 1 / VoxelData.TextureAtlasSizeInBlocks;

VoxelData.HalfWorldSizeInChunks = (VoxelData.WorldSizeInChunks / 2)|0;
VoxelData.ViewDistanceInChunks = 10;
VoxelData.HalfViewDistanceInChunks = (VoxelData.ViewDistanceInChunks / 2)|0;
VoxelData.WorldSizeInBlocks = VoxelData.WorldSizeInChunks * VoxelData.ChunkWidth;
VoxelData.ChunkWidthHeight = VoxelData.ChunkWidth * VoxelData.ChunkHeight;
VoxelData.ChunkWidthWidth = VoxelData.ChunkWidth * VoxelData.ChunkWidth;

VoxelData.VoxelVerts = [
    [0, 0, 0],
    [1, 0, 0],
    [1, 1, 0],
    [0, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [1, 1, 1],
    [0, 1, 1],
];

VoxelData.VoxelNormals = [
    [0, 0, -1], // Back
    [0, 0, 1], // Front
    [0, 1, 0], // Top
    [0, -1, 0], // Bottom
    [-1, 0, 0], // Left
    [1, 0, 0] // Right
];

VoxelData.VoxelTris = [
    [0, 3, 1, 2], // Back Face
    [5, 6, 4, 7], // Front Face
    [3, 7, 2, 6], // Top Face
    [1, 5, 0, 4], // Bottom Face
    [4, 7, 0, 3], // Left Face
    [1, 2, 5, 6] // Right Face
];

VoxelData.FaceChecks = [
    [0, 0, -1],
    [0, 0, 1],
    [0, 1, 0],
    [0, -1, 0],
    [-1, 0, 0],
    [1, 0, 0]
];

VoxelData.RevFaceCheckIndex = [ 1, 0, 3, 2, 5, 4 ];
