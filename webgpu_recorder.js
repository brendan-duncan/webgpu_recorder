class WebGPURecorder {
// public:
    constructor(options) {
        options = options || {};
        this.config = {
            maxFrameCount: options.frames || 100,
            exportName: options.export || "WebGPURecord",
            canvasWidth: options.width || 800,
            canvasHeight: options.height || 600
        };

        this._objectIndex = 1;
        this._initalized = false;
        this._initializeCommands = [];
        this._frameCommands = [];
        this._currentFrameCommands = null;
        this._frameIndex = -1;
        this._isRecording = false;
        this._frameVariables = {};
        this._arrayCache = [];
        this._totalData = 0;

        if (!navigator.gpu)
            return;

        this._isRecording = true;
        this._initalized = true;
        this._frameIndex = -1;
        this._frameCommands = [];
        this._initializeCommands = [];
        this._frameVariables = {};
        this._frameVariables[-1] = new Set();

        this._registerObject(navigator.gpu);
        this._wrapObject(navigator.gpu);
        this._recordLine(`${this._getObjectVariable(navigator.gpu)} = navigator.gpu;`);

        this._wrapCanvases();

        let self = this;

        // Capture any dynamically created canvases
        let __createElement = document.createElement;
        document.createElement = function(type) {
            let element = __createElement.call(document, type);
            if (type == "canvas") {
                self._wrapCanvas(element);
            }
            return element;
        };

        // Wrap requestAnimationFrame so it can keep track of per-frame recording and know when
        // the maximum number of frames has been reached.
        //
        // It would be nice to be able to arbitrarily start/stop recording. To do this,
        // we would need to keep track of things like shader creation/deletion that can happen
        // at arbitrary frames prior to the start, for any objects used within that recorded
        // duration.
        let __requestAnimationFrame = window.requestAnimationFrame;
        window.requestAnimationFrame = function(cb) {
            function callback() {
                self._frameStart();
                cb(performance.now());
                self._frameEnd();
            }
            __requestAnimationFrame(callback);
        };
    }

// private:
    _frameStart() {
        this._frameIndex++;
        this._frameVariables[this._frameIndex] = new Set();
        this._currentFrameCommands = [];
        this._frameCommands.push(this._currentFrameCommands);
    }

    _frameEnd() {
        if (this._frameIndex == this.config.maxFrameCount) {
            this._isRecording = false;
            this._generateOutput();
        }
    }

    _generateOutput() {
        let s = 
`<html>
    <body style="text-align: center;">
        <canvas id="#webgpu" width=${this.config.canvasWidth} height=${this.config.canvasHeight}></canvas>
        <script>
let D = new Array(${this._arrayCache.length});
async function main() {
  let canvas = document.getElementById("#webgpu");
  let frameLabel = document.createElement("div");
  frameLabel.style = "position: absolute; top: 10px; left: 10px; font-size: 24pt; color: #f00;";
  document.body.append(frameLabel);
  ${this._getVariableDeclarations(-1)}
  ${this._initializeCommands.join("\n  ")}\n`;
for (let fi = 0, fl = this._frameCommands.length; fi < fl; ++fi) {
        s += `async function f${fi}() {
  ${this._getVariableDeclarations(fi)}
  ${this._frameCommands[fi].join("\n  ")}
}\n`;
}
s += "    let frames=[";
for (let fi = 0, fl = this._frameCommands.length; fi < fl; ++fi) {
    s += `f${fi},`;
}
s += "];";
s += `
    let frame = 0;
    let lastFrame = -1;
    let t0 = performance.now();
    async function renderFrame() {
        if (frame > ${this._frameCommands.length - 1}) return;
        requestAnimationFrame(renderFrame);
        if (frame == lastFrame) return;
        lastFrame = frame;
        let t1 = performance.now();
        frameLabel.innerText = "F: " + frame + "  T:" + (t1 - t0).toFixed(2);
        t0 = t1;
        try {
            await frames[frame]();
        } catch (err) {
            console.log("Error Frame:", frame);
            console.error(err);
        }
        frame++;
    }
    requestAnimationFrame(renderFrame);
}

function decodeBase64(str) {
    const base64codes = [
        255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
        255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
        255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 62, 255, 255, 255, 63,
        52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255,
        255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255,
        255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
    ];

    function getBase64Code(charCode) {
        if (charCode >= base64codes.length) {
            throw new Error("Unable to parse base64 string.");
        }
        const code = base64codes[charCode];
        if (code === 255) {
            throw new Error("Unable to parse base64 string.");
        }
        return code;
    }

    if (str.length % 4 !== 0) {
        throw new Error("Unable to parse base64 string.");
    }

    const index = str.indexOf("=");
    if (index !== -1 && index < str.length - 2) {
        throw new Error("Unable to parse base64 string.");
    }

    let missingOctets = str.endsWith("==") ? 2 : str.endsWith("=") ? 1 : 0;
    let n = str.length;
    let result = new Uint8Array(3 * (n / 4));
    for (let i = 0, j = 0; i < n; i += 4, j += 3) {
        let buffer =
            getBase64Code(str.charCodeAt(i)) << 18 |
            getBase64Code(str.charCodeAt(i + 1)) << 12 |
            getBase64Code(str.charCodeAt(i + 2)) << 6 |
            getBase64Code(str.charCodeAt(i + 3));
        result[j] = buffer >> 16;
        result[j + 1] = (buffer >> 8) & 0xFF;
        result[j + 2] = buffer & 0xFF;
    }
    return result.subarray(0, result.length - missingOctets);
}

function B64ToA(s, type, length) {
    let x = decodeBase64(s);
    if (type == "Uint32Array")
        return new Uint32Array(x.buffer, 0, x.length/4);
    return new Uint8Array(x.buffer, 0, x.length);
}\n`;
    for (let ai = 0; ai < this._arrayCache.length; ++ai) {
        let a = this._arrayCache[ai];
        let b64 = this._arrayToBase64(a.array);
        s += `D[${ai}] = B64ToA("${b64}", "${a.type}", ${a.length});\n`;
    }

s += `
window.addEventListener('load', main);
        </script>
    </body>
</html>\n`;
        this._downloadFile(s, (this.config.exportName || 'WebGpuRecord') + ".html");
    }

    _encodeBase64(bytes) {
        const _b2a = [
            "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
            "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
            "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
            "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
            "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/"
        ];

        let result = '', i, l = bytes.length;
        for (i = 2; i < l; i += 3) {
            result += _b2a[bytes[i - 2] >> 2];
            result += _b2a[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
            result += _b2a[((bytes[i - 1] & 0x0F) << 2) | (bytes[i] >> 6)];
            result += _b2a[bytes[i] & 0x3F];
        }
        if (i === l + 1) {
            result += _b2a[bytes[i - 2] >> 2];
            result += _b2a[(bytes[i - 2] & 0x03) << 4];
            result += "==";
        }
        if (i === l) {
            result += _b2a[bytes[i - 2] >> 2];
            result += _b2a[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
            result += _b2a[(bytes[i - 1] & 0x0F) << 2];
            result += "=";
        }
        return result;
    }

    _arrayToBase64(a) {
        return this._encodeBase64(new Uint8Array(a.buffer, a.byteOffset, a.byteLength));
    }

    _downloadFile(data, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([data], {type: 'application/javascript'}));
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    _wrapCanvas(c) {
        if (c.__id)
            return;
        this._registerObject(c);
        let self = this;
        let __getContext = c.getContext;
        c.getContext = function(a1, a2) {
            let ret = __getContext.call(c, a1, a2);
            if (a1 == 'webgpu') {
                if (ret) {
                    self._wrapContext(ret);
                }
            }
            return ret;
        };
    }

    _wrapCanvases() {
        let canvases = document.getElementsByTagName('canvas');
        for (let i = 0; i < canvases.length; ++i) {
            let c = canvases[i];
            this._wrapCanvas(c);
        }
    }

    _registerObject(object) {
        let id = this._objectIndex++;
        object.__id = id;
        object.__frame = this._frameIndex;
    }

    _isFrameVariable(frame, name) {
        return this._frameVariables[frame] && this._frameVariables[frame].has(name);
    }

    _removeVariable(name) {
        for (let f in this._frameVariables) {
            let fs = this._frameVariables[f];
            fs.delete(name);
        }
    }

    _addVariable(frame, name) {
        this._frameVariables[frame].add(name);
    }

    _getVariableDeclarations(frame) {
        let s = this._frameVariables[frame];
        if (!s.size) return "";
        return `let ${[...s].join(",")};`;
    }

    _getObjectVariable(object) {
        if (object.__id === undefined)
            this._registerObject(object);

        let name = `x${(object.__id||0).toString(16)}`;

        if (this._frameIndex != object.__frame) {
            if (!this._isFrameVariable(-1, name)) {
                this._removeVariable(name);
                this._addVariable(-1, name);
            }
        } else {
            this._addVariable(this._frameIndex, name);
        }

        return name;
    }

    _wrapContext(ctx) {
        this._recordLine(`${this._getObjectVariable(ctx)} = canvas.getContext('webgpu');`);
        this._wrapObject(ctx);
    }

    _objectHasMethods(object) {
        for (let m in object) {
            if (typeof(object[m]) == "function" && WebGPURecorder._skipMethods.indexOf(m) == -1) {
                return true;
            }
        }
        return false;
    }

    _wrapObject(object) {
        for (let m in object) {
            if (typeof(object[m]) == "function") {
                if (WebGPURecorder._skipMethods.indexOf(m) == -1) {
                    if (WebGPURecorder._asyncMethods.indexOf(m) != -1)
                        this._wrapAsync(object, m);
                    else
                        this._wrapMethod(object, m);
                }
            } else if (typeof(object[m]) == "object") {
                let o = object[m];
                if (!o || o.__id)
                    continue;
                let hasMethod = this._objectHasMethods(o);
                if (!o.__id && hasMethod) {
                    this._recordLine(`${this._getObjectVariable(o)} = ${this._getObjectVariable(object)}['${m}'];`);
                    this._wrapObject(o);
                }
            }
        }
    }

    _getBytesFromImageSource(src) {
        let canvas = document.createElement("canvas");
        canvas.width = src.width;
        canvas.height = src.height;
        let c2d = canvas.getContext("2d");
        c2d.drawImage(src, 0, 0);
        let data = c2d.getImageData(0, 0, src.width, src.height);
        return data.data;
    }

    _wrapMethod(object, method) {
        if (WebGPURecorder._skipMethods.indexOf(method) != -1)
            return;
        let origMethod = object[method];
        let self = this;
        object[method] = function() {
            // We can't track every change made to a mappedRange buffer since that all happens 
            // outside the scope of what WebGPU is in control of. So we keep track of all the
            // mapped buffer ranges, and when unmap is called, we record the content of their data
            // so that they have their correct data for the unmap.
            if (method == "unmap") {
                if (object.__mappedRanges) {
                    for (let buffer of object.__mappedRanges) {
                        // Make a copy of the mappedRange buffer data as it is when unmap
                        // is called.
                        let cacheIndex = self._getDataCache(buffer, 0, buffer.byteLength);
                        // Set the mappedRange buffer data in the recording to what is in the buffer
                        // at the time unmap is called.
                        self._recordLine(`new Uint8Array(${self._getObjectVariable(buffer)}).set(D[${cacheIndex}]);`);
                    }
                    delete object.__mappedRanges;
                }
            } else if (method == "copyExternalImageToTexture") {
                origMethod.call(object, ...arguments);

                // copyExternalImageToTexture uses ImageBitmap (or canvas or offscreenCanvas) as
                // its source, which we can't record. ConvertcopyExternalImageToTexture to
                // writeTexture, and record the bytes from the ImageBitmap. To do that, we need
                // to draw the ImageBitmap into a canvas, and record the bytes from that.
                // A very heavy process, but not sure what else to do.
                let bytes = self._getBytesFromImageSource(arguments[0].source);
                let bytesPerPixel = 4;
                let bytesPerRow = arguments[0].source.width * bytesPerPixel;

                let cacheIndex = self._getDataCache(bytes, bytes.byteOffset, bytes.byteLength);
                self._recordLine(`${self._getObjectVariable(object)}.writeTexture(${self._stringifyObject(arguments[1])}, D[${cacheIndex}], {bytesPerRow:${bytesPerRow}}, ${self._stringifyObject(arguments[2])});`);

                return;
            }

            let result = origMethod.call(object, ...arguments);
            self._recordCommand(false, object, method, result, arguments);

            // Keep track of the mapped ranges for the buffer object. The recording will set their
            // data when unmap is called.
            if (method == "getMappedRange") {
                if (!object.__mappedRanges)
                    object.__mappedRanges = [];
                object.__mappedRanges.push(result);
            }
            return result;
        };
    }

    _wrapAsync(object, method) {
        let origMethod = object[method];
        let self = this;
        object[method] = function() {
            let promise = origMethod.call(object, ...arguments);
            let wrappedPromise = new Promise((resolve) => {
                promise.then((result) => {
                    if (result.__id) {
                        resolve(result);
                        return;
                    }
                    self._recordCommand(true, object, method, result, arguments);
                    resolve(result);
                });
            });
            return wrappedPromise;
        };
    }

    _stringifyObject(object) {
        let s = "";
        let first = true;
        for (let key in object) {
            let value = object[key];
            if (value === undefined) {
                continue;
            }
            if (!first) s += ",";
            first = false;
            s += `"${key}":`;
            if (value === null) {
                s += "null";
            } else if (typeof(value) == "string") {
                s += `\`${value}\``;
            } else if (value.__id !== undefined) {
                s += this._getObjectVariable(value);
            } else if (value.__data !== undefined) {
                s += `D[${value.__data}]`;
            } else if (value.constructor == Array) {
                s += this._stringifyArray(value);
            } else if (typeof(value) == "object") {
                s += this._stringifyObject(value);
            } else {
                s += `${value}`;
            }
        }
        s = "{" + s + "}";
        return s;
    }

    _stringifyArray(a) {
        let s = "[";
        s += this._stringifyArgs("", a);
        s += "]";
        return s;
    }

    _getDataCache(heap, offset, length) {
        let self = this;

        function _heapAccessShiftForWebGPUHeap(heap) {
            if (!heap.BYTES_PER_ELEMENT) return 0;
            return 31 - Math.clz32(heap.BYTES_PER_ELEMENT);
        }

        function _compareCacheData(ai, view) {
            let a = self._arrayCache[ai].array;
            if (a.length != view.length) 
                return false;
            for (let i = 0, l = a.length; i < l; ++i) {
                if (a[i] != view[i]) {
                    return false;
                }
            }
            return true;
        }

        let byteOffset = ((heap.byteOffset ?? 0) + offset) << _heapAccessShiftForWebGPUHeap(heap);
        let byteLength = length << _heapAccessShiftForWebGPUHeap(heap);

        this._totalData += byteLength;
        let view = new Uint8Array(heap.buffer ?? heap, byteOffset, byteLength);

        let cacheIndex = -1;
        for (let ai = 0; ai < self._arrayCache.length; ++ai) {
            let c = self._arrayCache[ai];
            if (c.length == length) {
                if (_compareCacheData(ai, view)) {
                    cacheIndex = ai;
                    break;
                }
            }
        }

        if (cacheIndex == -1) {
            cacheIndex = self._arrayCache.length;
            let arrayCopy = Uint8Array.from(view);
            self._arrayCache.push({
                length: byteLength,
                type: heap.constructor === "ArrayBuffer" ? Uint8Array : heap.constructor.name,
                array: arrayCopy
            });
        }
        
        return cacheIndex;
    }

    _stringifyArgs(method, args) {
        if (args.length == 0 || (args.length == 1 && args[0] === undefined))
            return "";

        args = Array.from(args);

        // In order to capture buffer data, we need to know the offset and size of the data,
        // which are arguments of specific methods. So we need to special case those methods to
        // properly capture the buffer data passed to them.
        if (method == "writeBuffer") {
            let buffer = args[2];
            let offset = args[3];
            let size = args[4];
            let cacheIndex = this._getDataCache(buffer, offset, size);
            args[2] = { __data: cacheIndex };
            args[3] = 0;
        } else if (method == "writeTexture") {
            let buffer = args[1];
            let bytesPerRow = args[2].bytesPerRow;
            let rows = args[2].rowsPerImage || args[3].height || args[3][1] || 0;
            let size = bytesPerRow * rows;
            let offset = args[2].offset;
            let cacheIndex = this._getDataCache(buffer, offset, size);
            args[1] = { __data: cacheIndex };
            args[2].offset = 0;
        } else if (method == "setBindGroup") {
            if (args.length == 5) {
                let buffer = args[2];
                let offset = args[3];
                let size = args[4];
                let offsets = this._getDataCache(buffer, offset, size);
                args[2] = { __data: offsets };
                args.length = 3;
            } else if (args.length == 3) {
                let buffer = args[2];
                let offsets = this._getDataCache(buffer, 0, buffer.length);
                args[2] = { __data: offsets };
                args.length = 3;
            }
        }

        let argStrings = [];
        for (let a of args) {
            if (a === undefined) {
                argStrings.push("undefined");
            } else if (a === null) {
                argStrings.push("null");
            } else if (a.__data !== undefined) {
                argStrings.push(`D[${a.__data}]`); // This is a captured data buffer.
            } else if (a.__id) {
                argStrings.push(this._getObjectVariable(a));
            } else if (a.constructor === Array) {
                argStrings.push(this._stringifyArray(a));
            } else if (typeof(a) == "object") {
                argStrings.push(this._stringifyObject(a));
            } else if (typeof(a) == "string") {
                argStrings.push(`\`${a}\``);
            } else {
                argStrings.push(a);
            }
        }
        return argStrings.join();
    }

    _recordLine(line) {
        if (this._isRecording) {
            if (this._frameIndex == -1) {
                this._initializeCommands.push(line);
            } else {
                this._currentFrameCommands.push(line);
            }
        }
    }

    _recordCommand(async, object, method, result, args) {
        if (this._isRecording) {
            if (result)
            {
                if (typeof(result) === "string")
                    return;

                this._registerObject(result);
            }

            async = async ? "await " : "";

            if (result) {
                this._recordLine(`${this._getObjectVariable(result)} = ${async}${this._getObjectVariable(object)}.${method}(${this._stringifyArgs(method, args)});`);
            } else {
                this._recordLine(`${async}${this._getObjectVariable(object)}.${method}(${this._stringifyArgs(method, args)});`);
            }

            if (result && typeof(result) == "object")
                this._wrapObject(result);
        }
    }
}

WebGPURecorder._asyncMethods = [
    "requestAdapter",
    "requestDevice",
    "createComputePipelineAsync",
    "createRenderPipelineAsync"
];

WebGPURecorder._skipMethods = [
    "toString",
    "entries",
    "getContext",
    "forEach",
    "has",
    "keys",
    "values",
    "getPreferredFormat",
    "pushErrorScope",
    "popErrorScope"
];
