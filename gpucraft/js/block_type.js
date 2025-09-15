export class BlockType {
    constructor(options) {
        options = options || {};
        this.name = options.name || "";
        this.isSolid = options.isSolid || false;
        this.renderNeighborFaces = options.renderNeighborFaces || false;
        this.opacity = options.opacity || 0;

        this.textures = options.textures || [0, 0, 0, 0, 0, 0];
    }
}
