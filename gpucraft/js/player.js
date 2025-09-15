import { Vector3 } from "./math/vector3.js";
import { Globals } from "./globals.js";
import { Input } from "./input.js";
import { Transform } from "./transform.js";

export class Player extends Transform {
    constructor(camera) {
        super();

        Globals.player = this;

        this.addChild(camera);

        this.isGrounded = false;
        this.isSprinting = false;

        this.camera = camera;

        this.turnSpeed = 0.5;
        this.walkSpeed = 5;
        this.sprintSpeed = 10;
        this.jumpForce = 5;
        this.gravity = -9.8;

        this.playerWidth = 0.15;
        this.boundsTolerance = 0.1;

        this.horizontal = 0;
        this.vertical = 0;
        this.mouseHorizontal = 0;
        this.mouseVertical = 0;
        this.velocity = new Vector3();
        this.verticalMomentum = 0;
        this.jumpRequest = false;

        this.checkIncrement = 0.1;
        this.reach = 8;

        this._forward = new Vector3();
        this._up = new Vector3(0, 1, 0);
        this._right = new Vector3();

        this.highlightPosition = new Vector3();
        this.placePosition = new Vector3();

        const stats = document.createElement("div");
        this.stats = stats;
        stats.id = "stats";
        stats.width = "80px";
        stats.style.opacity = "0.9";
        stats.style.color = "#0ff";
        stats.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
        stats.style.padding = "5px";
        stats.style.fontFamily = "Helvetica,Arial,sans-serif";
        stats.style.fontSize = "14px";
        stats.style.fontWeight = "bold";
        stats.style.lineHeight = "15px";
        stats.style.borderRadius = "5px";
        stats.style.boxShadow = "0px 5px 20px rgba(0, 0, 0, 0.2)";
        stats.style.position = "absolute";
        stats.style.top = "40px";
        stats.style.left = "0px";
        stats.style.width = 200;
        stats.style.height = 200;
        stats.style.margin = "0px";
        stats.style.borderRadius = "5px";
        stats.style.pointerEvents = "none";
        stats.display = "block";
        stats.style.zIndex = "100";
        document.body.appendChild(stats);
        this.lastTime = Globals.time;

        Globals.input.onMouseDown.push(this.onMouseDown.bind(this));
        Globals.input.onMouseMove.push(this.onMouseMove.bind(this));
    }

    get world() { return Globals.world; }

    update() {
        this.calculateVelocity();
        if (this.jumpRequest) {
            this.jump();
        }

        this.camera.rotation[0] -= this.mouseVertical;
        this.rotation[1] -= this.mouseHorizontal;
        this.position.add(this.velocity);
        this.camera.localDirty = true;
        this.localDirty = true;

        this.mouseHorizontal = 0;
        this.mouseVertical = 0;

        if (!document.pointerLockElement) {
            return;
        }

        if (!this.world) {
            return;
        }

        this.placeCursorBlock();

        this.isSprinting = Globals.input.getKeyDown(Input.KeyCode.LeftShift);

        if (this.isGrounded && Globals.input.getKeyDown(Input.KeyCode.Space)) {
            this.jumpRequest = true;
        }

        if (Globals.input.getKeyDown(Input.KeyCode.A)) {
            this.horizontal = -1;
        } else if (Globals.input.getKeyDown(Input.KeyCode.D)) {
            this.horizontal = 1;
        } else {
            this.horizontal = 0;
        }

        if (Globals.input.getKeyDown(Input.KeyCode.W)) {
            this.vertical = -1;
        } else if (Globals.input.getKeyDown(Input.KeyCode.S)) {
            this.vertical = 1;
        } else {
            this.vertical = 0;
        }

        const editDelay = 2;

        if (Globals.input.getMouseButtonDown(0)) {
            const t = Globals.time;
            if ((t - this.lastTime) > editDelay) {
                if (this.placeActive) {
                    const chunk = this.world.getChunkFromPosition(this.placePosition);
                    if (chunk) {
                        chunk.editVoxel(this.placePosition[0], this.placePosition[1],
                            this.placePosition[2], 7);
                        this.lastTime = t;
                    }
                }
            }
        } else if (Globals.input.getMouseButtonDown(2)) {
            const t = Globals.time;
            if ((t - this.lastTime) > editDelay) {
                if (this.highlightActive) {
                    const chunk = this.world.getChunkFromPosition(this.highlightPosition);
                    if (chunk) {
                        chunk.editVoxel(this.highlightPosition[0], this.highlightPosition[1],
                            this.highlightPosition[2], 0);
                        this.lastTime = t;
                    }
                }
            }
        }
    }

    placeCursorBlock() {
        if (!this.world) {
            return;
        }

        let step = this.checkIncrement;
        const pos = new Vector3();
        const lastPos = new Vector3();

        const camPos = this.camera.getWorldPosition();
        const camForward = this.camera.getWorldForward();

        while (step < this.reach) {
            pos.setFrom(camPos[0] - (camForward[0] * step),
                camPos[1] - (camForward[1] * step),
                camPos[2] - (camForward[2] * step));

            if (this.world.checkForVoxel(pos[0], pos[1], pos[2])) {
                this.highlightActive = true;
                this.placeActive = true;
                this.highlightPosition.setFrom(Math.floor(pos[0]), Math.floor(pos[1]), Math.floor(pos[2]));
                this.placePosition.set(lastPos);
                return;
            }

            lastPos.setFrom(Math.floor(pos[0]), Math.floor(pos[1]), Math.floor(pos[2]));

            step += this.checkIncrement;
        }

        this.highlightActive = false;
        this.placeActive = false;
    }

    jump() {
        this.verticalMomentum = this.jumpForce;
        this.isGrounded = false;
        this.jumpRequest = false;
    }

    calculateVelocity() {
        // Affect vertical momentum with gravity.
        if (this.verticalMomentum > this.gravity) {
            this.verticalMomentum += Globals.fixedDeltaTime * this.gravity;
        }

        this.getWorldForward(this._forward);
        this.getWorldRight(this._right);

        // if we're sprinting, use the sprint multiplier.
        const speed = this.isSprinting ? this.sprintSpeed : this.walkSpeed;

        this.velocity.set(this._forward.scale(this.vertical)
            .add(this._right.scale(this.horizontal))
            .scale(Globals.fixedDeltaTime * speed));

        // Apply vertical momentum (falling/jumping).
        this.velocity.y += this.verticalMomentum * Globals.fixedDeltaTime;

        if ((this.velocity.z > 0 && this.front) || (this.velocity.z < 0 && this.back)) {
            this.velocity.z = 0;
        }

        if ((this.velocity.x > 0 && this.right) || (this.velocity.x < 0 && this.left)) {
            this.velocity.x = 0;
        }

        if (this.velocity.y < 0) {
            this.velocity.y = this.checkDownSpeed(this.velocity.y);
        } else if (this.velocity.y > 0) {
            this.velocity.y = this.checkUpSpeed(this.velocity.y);
        }

        const pos = this.position;
        const px = Math.floor(pos.x);
        const py = Math.floor(pos.y);
        const pz = Math.floor(pos.z);
        this.stats.innerText = `position: ${px} ${py} ${pz}\n` +
            `isGrounded: ${this.isGrounded} sprint: ${this.isSprinting}\n` +
            `horizontal: ${this.horizontal} vertical: ${this.vertical}\n` +
            `mouseHorizontal: ${this.mouseVertical} mouseVertical: ${this.mouseHorizontal}\n` +
            `mouseButtons: ${Globals.input.mouse.leftButton} ${Globals.input.mouse.rightButton}\n` +
            `deltaTime: ${(Globals.deltaTime * 100).toFixed(2)}, maxDelta: ${(Globals.maxDeltaTime * 100).toFixed(2)}\n` +
            `velocity: ${this.velocity}\n` +
            `Player Chunk: ${this.world.playerChunkCoord}\n` +
            `Chunks active: ${this.world.activeChunks.length} toDraw: ${this.world.chunksToDraw.length} toUpdate: ${this.world.chunksToUpdate.length}`;
    }

    onMouseMove(e) {
        if (document.pointerLockElement) {
            const turnSpeed = this.turnSpeed;
            this.mouseHorizontal = e.deltax * turnSpeed;
            this.mouseVertical = e.deltay * turnSpeed;
        }
    }

    onMouseDown() {
        Globals.input.lockMouse(true);
    }

    checkDownSpeed(downSpeed) {
        const pos = this.position;
        const world = this.world;
        const width = this.playerWidth;
        const speed = downSpeed;

        if (!world) {
            this.isGrounded = true;
            return 0;
        }

        if (world.checkForVoxel(pos.x - width, pos.y + speed, pos.z - width) ||
            world.checkForVoxel(pos.x + width, pos.y + speed, pos.z - width) ||
            world.checkForVoxel(pos.x + width, pos.y + speed, pos.z + width) ||
            world.checkForVoxel(pos.x - width, pos.y + speed, pos.z + width)) {
            this.isGrounded = true;
            return 0;
        }

        this.isGrounded = false;
        return downSpeed;
    }

    checkUpSpeed(upSpeed) {
        const pos = this.position;
        const world = this.world;
        const width = this.playerWidth;
        const speed = 2 + upSpeed;

        if (!world) {
            this.isGrounded = true;
            return 0;
        }

        if (world.checkForVoxel(pos.x - width, pos.y + speed, pos.z - width) ||
            world.checkForVoxel(pos.x + width, pos.y + speed, pos.z - width) ||
            world.checkForVoxel(pos.x + width, pos.y + speed, pos.z + width) ||
            world.checkForVoxel(pos.x - width, pos.y + speed, pos.z + width)) {
            return 0;
        }

        return upSpeed;
    }

    get front() {
        const pos = this.position;
        if (this.world.checkForVoxel(pos.x, pos.y, pos.z + this.playerWidth) ||
            this.world.checkForVoxel(pos.x, pos.y + 1, pos.z + this.playerWidth)) {
            return true;
        }
        return false;
    }

    get back() {
        const pos = this.position;
        if (this.world.checkForVoxel(pos.x, pos.y, pos.z - this.playerWidth) ||
            this.world.checkForVoxel(pos.x, pos.y + 1, pos.z - this.playerWidth)) {
            return true;
        }
        return false;
    }

    get left() {
        const pos = this.position;
        if (this.world.checkForVoxel(pos.x - this.playerWidth, pos.y, pos.z) ||
            this.world.checkForVoxel(pos.x - this.playerWidth, pos.y + 1, pos.z)) {
            return true;
        }
        return false;
    }

    get right() {
        const pos = this.position;
        if (this.world.checkForVoxel(pos.x + this.playerWidth, pos.y, pos.z) ||
            this.world.checkForVoxel(pos.x + this.playerWidth, pos.y + 1, pos.z)) {
            return true;
        }
        return false;
    }
}
