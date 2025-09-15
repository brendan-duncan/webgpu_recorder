export class BiomeAttributes {
    constructor(options) {
        options = options || {};
        this.name = options.name || "";
        this.offset = options.offset || 0;
        this.scale = options.scale || 1;

        this.terrainHeight = options.terrainHeight || 0;
        this.terrainScale = options.terrainScale || 1;

        this.surfaceBlock = options.surfaceBlock || 0;
        this.subSurfaceBlock = options.subSurfaceBlock || 0;

        this.majorFloraIndex = options.majorFloraIndex || 0;
        this.majorFloraZoneScale = options.majorFloraZoneScale || 1.3; // [0.1, 1]
        this.majorFloraPlacementScale = options.majorFloraPlacementScale || 15; // [0.1, 1]
        this.majorFloraPlacementThreshold = options.majorFloraPlacementThreshold || 0.8;
        this.placeMajorFlora = options.placeMajorFlora !== undefined ? options.placeMajorFlora : true;

        this.maxHeight = options.maxHeight || 12;
        this.minHeight = options.minHeight || 5;

        this.lodes = options.lodes || [];
    }
}

export class Lode {
    constructor(options) {
        options = options || {};
        this.name = options.name || "";
        this.blockID = options.blockID || 0;
        this.minHeight = options.minHeight || 0;
        this.maxHeight = options.maxHeight || 0;
        this.scale = options.scale || 1;
        this.threshold = options.threshold || 0;
        this.noiseOffset = options.noiseOffset || 0;
    }
}
