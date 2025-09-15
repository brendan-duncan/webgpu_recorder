import { Globals } from "./globals.js";

export class Input {
    constructor(element, options) {
        options = options || {};

        Globals.input = this;

        this.element = element;
        this.ignoreEvents = false;
        this.captureWheel = true;
        this.dragging = false;
        this.lastPos = [0, 0];

        this.mouse = {
            buttons: 0,
            lastButtons: 0,
            leftButton: false,
            middleButton: false,
            rightButton: false,
            position: [0, 0],
            x: 0, // in canvas coordinates
            y: 0,
            deltaX: 0,
            deltaY: 0,
            clientX: 0, // in client coordinates
            clientY: 0
        };

        this.lastClickTime = 0;
        this._onMouseHandler = null;
        this._onKeyHandler = null;

        this.onMouseDown = [];
        this.onMouseMove = [];
        this.onMouseUp = [];

        this.init(options);
    }

    getKeyDown(key) {
        return !!Input.keys[key];
    }

    getKeyUp(key) {
        return !Input.keys[key];
    }

    getMouseButtonDown(button) {
        if (button == 0) {
            return this.mouse.leftButton;
        } else if (button == 1) {
            return this.mouse.middleButton;
        } else if (button == 2) {
            return this.mouse.rightButton;
        }
        return false;
    }

    lockMouse(state) {
        if (state) {
            this.element.requestPointerLock();
        } else {
            document.exitPointerLock();
        }
    }

    close() {
        if (this._onKeyHandler) {
            document.removeEventListener("keydown", this._onKeyHandler);
            document.removeEventListener("keyup", this._onKeyHandler);
            this._onKeyHandler = null;
        }
    }

    init(options) {
        if (this._onMouseHandler) {
            return;
        }

        const element = this.element;
        if (!element) {
            return;
        }

        this.captureWheel = options.captureWheel || this.captureWheel;

        this._onMouseHandler = this._onMouse.bind(this);

        element.addEventListener("mousedown", this._onMouseHandler);
        element.addEventListener("mousemove", this._onMouseHandler);
        element.addEventListener("dragstart", this._onMouseHandler);

        if (this.captureWheel) {
            element.addEventListener("mousewheel", this._onMouseHandler, false);
            element.addEventListener("wheel", this._onMouseHandler, false);
        }

        // Prevent right click context menu
        element.addEventListener("contextmenu", function(e) {
            e.preventDefault();
            return false;
        });

        this.captureKeys();
    }

    _onMouse(e) {
        if (this.ignoreEvents) {
            return;
        }

        Input.active = this;

        const element = this.element;
        const mouse = this.mouse;

        //Log.debug(e.type);
        const oldMouseMask = mouse.buttons;
        this._augmentEvent(e, element);
        // Type cannot be overwritten, so I make a clone to allow me to overwrite
        e.eventType = e.eventType || e.type;
        const now = Globals.now();

        // mouse info
        mouse.dragging = e.dragging;
        mouse.position[0] = e.canvasx;
        mouse.position[1] = e.canvasy;
        mouse.x = e.canvasx;
        mouse.y = e.canvasy;
        mouse.mouseX = e.mousex;
        mouse.mouseY = e.mousey;
        mouse.canvasX = e.canvasx;
        mouse.canvasY = e.canvasy;
        mouse.clientX = e.mousex;
        mouse.clientY = e.mousey;
        mouse.buttons = e.buttons;
        mouse.leftButton = !!(mouse.buttons & Input.LeftButtonMask);
        mouse.middleButton = !!(mouse.buttons & Input.MiddleButtonMask);
        mouse.rightButton = !!(mouse.buttons & Input.RightButtonMask);

        if (e.eventType === "mousedown") {
            if (oldMouseMask == 0) { //no mouse button was pressed till now
                element.removeEventListener("mousemove", this._onMouseHandler);
                const doc = element.ownerDocument;
                doc.addEventListener("mousemove", this._onMouseHandler);
                doc.addEventListener("mouseup", this._onMouseHandler);
            }
            this.lastClickTime = now;
            for (const cb of this.onMouseDown) {
                cb(e);
            }
        } else if (e.eventType === "mousemove") {
            for (const cb of this.onMouseMove) {
                cb(e);
            }
        } else if(e.eventType === "mouseup") {
            if (this.mouse.buttons == 0) { // no more buttons pressed
                element.addEventListener("mousemove", this._onMouseHandler);
                const doc = element.ownerDocument;
                doc.removeEventListener("mousemove", this._onMouseHandler);
                doc.removeEventListener("mouseup", this._onMouseHandler);
            }
            e.clickTime = now - this.lastClickTime;

            for (const cb of this.onMouseUp) {
                cb(e);
            }
        } else if (e.eventType === "mousewheel" || e.eventType == "wheel" ||
                   e.eventType === "DOMMouseScroll") {
            e.eventType = "mousewheel";
            if (e.type === "wheel") {
                e.wheel = -e.deltaY; // in firefox deltaY is 1 while in Chrome is 120
            } else {
                e.wheel = (e.wheelDeltaY != null ? e.wheelDeltaY : e.detail * -60);
            }

            // from stack overflow
            // firefox doesnt have wheelDelta
            e.delta = e.wheelDelta !== undefined ?
                (e.wheelDelta / 40) :
                (e.deltaY ? -e.deltaY / 3 : 0);
        }

        if (!e.skipPreventDefault) {
            if (e.eventType != "mousemove") {
                e.stopPropagation();
            }
            e.preventDefault();
            return;
        }
    }

    /// Tells the system to capture key events on the element. This will trigger onKey
    captureKeys() {
        if (this._onKeyHandler) {
            return;
        }

        this._onKeyHandler = this._onKey.bind(this);

        document.addEventListener("keydown", this._onKeyHandler);
        document.addEventListener("keyup", this._onKeyHandler);
    }

    _onKey(e, preventDefault) {
        Input.active = this;
        e.eventType = e.type;

        const targetElement = e.target.nodeName.toLowerCase();
        if (targetElement === "input" || targetElement === "textarea" || 
            targetElement === "select") {
            return;
        }

        e.character = String.fromCharCode(e.keyCode).toLowerCase();
        const key = e.keyCode;

        Input.keys[key] = (e.type === "keydown");

        if (preventDefault && (e.isChar || Input.blockableKeys[e.keyIdentifier || e.key])) {
            e.preventDefault();
        }
    }

    _augmentEvent(e, rootElement) {
        let b = null;

        rootElement = rootElement || e.target || this.element;
        b = rootElement.getBoundingClientRect();

        e.mousex = e.clientX - b.left;
        e.mousey = e.clientY - b.top;
        e.canvasx = e.mousex;
        e.canvasy = b.height - e.mousey; // The y coordinate is flipped for canvas coordinates
        e.deltax = 0;
        e.deltay = 0;

        if (e.type === "mousedown") {
            this.dragging = true;
        } else if (e.type === "mouseup") {
            if (e.buttons === 0) {
                this.dragging = false;
            }
        }

        if (e.movementX !== undefined) {// && !Platform.isMobile) {
            e.deltax = e.movementX;
            e.deltay = e.movementY;
        } else {
            e.deltax = e.mousex - this.lastPos[0];
            e.deltay = e.mousey - this.lastPos[1];
        }
        this.lastPos[0] = e.mousex;
        this.lastPos[1] = e.mousey;

        // insert info in event
        e.dragging = this.dragging;
        e.leftButton = !!(this.mouse.buttons & Input.LeftButtonMask);
        e.middleButton = !!(this.mouse.buttons & Input.MiddleButtonMask);
        e.rightButton = !!(this.mouse.buttons & Input.RightButtonMask);

        // e.buttons use 1:left,2:right,4:middle but 
        // e.button uses 0:left,1:middle,2:right
        e.buttonsMask = 0;
        if (e.leftButton) e.buttonsMask = 1;
        if (e.middleButton) e.buttonsMask |= 2;
        if (e.rightButton) e.buttonsMask |= 4;
        e.isButtonPressed = function(num) {
            return this.buttonsMask & (1 << num);
        };
    }
}

Input.blockableKeys = {
    "Up": true,
    "Down": true,
    "Left": true,
    "Right": true
};

Input.keys = {};


Input.LeftButtonMask = 1;
Input.RightButtonMask = 2;
Input.MiddleButtonMask = 4;

Input.KeyCode = {
    Space: 32,
    A: 65,
    D: 68,
    S: 83,
    W: 87,
    RightShift: 16,
    LeftShift: 16,
    RightControl: 17,
    LeftControl: 17,
};
