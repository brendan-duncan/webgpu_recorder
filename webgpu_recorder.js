var WebGPURecorder = {
    _objectIndex: 1,
    _startFrameObjectIndex: 1,
    _initalized: false,
    _initializeCommands: [],
    _frameCommands: [],
    _currentFrameCommands: null,
    _frameIndex: -1,
    _isRecording: false,
    _frameVariables: {},

    config: {
        maxFrameCount: 100,
        exportName: "WebGPURecord",
        canvasWidth: 800,
        canvasHeight: 600
    },

    initialize: function() {
        if (!navigator.gpu || this._initalized)
            return;

        this._isRecording = true;
        this._initalized = true;
        this._frameIndex = -1;
        this._frameCommands = [];
        this._initializeCommands = [];
        this._frameVariables = {};
        this._frameVariables[-1] = new Set();

        this._registerObject(navigator.gpu);
        this._recordLine(`${this._getObjectVariable(navigator.gpu)} = navigator.gpu;`);

        this._intializeCanvases();

        this._wrapObject(navigator.gpu);

        let self = this;
        window.__requestAnimationFrame = window.requestAnimationFrame;
        window.requestAnimationFrame = function(cb) {
            function callback() {
                self.frameStart();
                cb(performance.now());
                self.frameEnd();
            }
            window.__requestAnimationFrame(callback);
        };
    },

    frameStart: function() {
        this._frameIndex++;
        this._frameVariables[this._frameIndex] = new Set();
        if (this._frameIndex == 0) {
            this._startFrameObjectIndex = this._objectIndex;
        } else {
            this._objectIndex = this._startFrameObjectIndex;
        }
        this._currentFrameCommands = [];
        this._frameCommands.push(this._currentFrameCommands);
    },

    frameEnd: function() {
        if (this._frameIndex == this.config.maxFrameCount) {
            this._isRecording = false;
            this.generateOutput();
        }
    },

    generateOutput: function() {
        let s = 
`<html>
    <body style="text-align: center;">
        <canvas id="#webgpu" width=${this.config.canvasWidth} height=${this.config.canvasHeight}></canvas>
        <script>
let D = [];
async function main() {
  let canvas = document.getElementById("#webgpu");
  let frameLabel = document.createElement("div");
  frameLabel.style = "position: absolute; top: 10px; left: 10px; font-size: 24pt; color: #f00;";
  document.body.append(frameLabel);
  ${this._getVariableDeclarations(-1)}
  ${this._initializeCommands.join("\n  ")}\n`;
for (let fi = 0, fl = this._frameCommands.length; fi < fl; ++fi) {
        s += `function f${fi}() {
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
    let frame = 0
    let t0 = performance.now();
    function renderFrame() {
        if (frame > ${this._frameCommands.length - 1}) return;
        requestAnimationFrame(renderFrame);
        let t1 = performance.now();
        frameLabel.innerText = "F: " + frame + "  T:" + (t1 - t0).toFixed(2);
        t0 = t1;
        frames[frame]();
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

function B64ToA(aType, s) {
    let x = decodeBase64(s);
    return new aType(x.buffer, 0, x.length / aType.BYTES_PER_ELEMENT);
}\n`;
    s += "D = [\n";
    for (let ai = 0; ai < this._arrayCache.length; ++ai) {
        if (ai != 0) s += ",";
        let a = this._arrayCache[ai];
        let b64 = this._arrayToBase64(a.array);

        s += 'B64ToA(' + a.type + ', "' + b64 + '")\n';
    }
    s += `];

window.addEventListener('load', main);
        </script>
    </body>
</html>\n`;
        this._downloadFile(s, (this.config.exportName || 'WebGpuRecord') + ".html");
    },

    _encodeBase64: function(bytes) {
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
    },

    _arrayToBase64: function(a) {
        return this._encodeBase64(new Uint8Array(a.buffer, a.byteOffset, a.byteLength));
    },

    _downloadFile: function(data, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([data], {type: 'application/javascript'}));
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    _intializeCanvases: function() {
        let self = this;
        let canvases = document.getElementsByTagName('canvas');
        for (let i = 0; i < canvases.length; ++i) {
            let c = canvases[i];
            if (!c.__id) {
                this._registerObject(c);
                let origGetContext = c.getContext;
                c.getContext = function(a1, a2) {
                    let ret = origGetContext.call(c, a1, a2);
                    if (a1 == 'webgpu') {
                        if (ret) {
                            self._wrapContext(ret);
                        }
                    }
                    return ret;
                };
            }
        }
    },

    _registerObject: function(object) {
        let id = this._objectIndex++;
        object.__id = id;
        object.__frame = this._frameIndex;
    },

    _isFrameVariable: function(frame, name) {
        return this._frameVariables[frame] && this._frameVariables[frame].has(name);
    },

    _removeVariable: function(name) {
        for (let f in this._frameVariables) {
            let fs = this._frameVariables[f];
            fs.delete(name);
        }
    },

    _addVariable: function(frame, name) {
        this._frameVariables[frame].add(name);
    },

    _getVariableDeclarations: function(frame) {
        let s = this._frameVariables[frame];
        if (!s.size) return "";
        return `let ${[...s].join(",")};`;
    },

    _getObjectVariable: function(object) {
        if (object.__id === undefined)
            this._registerObject(object);

        let name = `x${object.__id||0}`;

        if (this._frameIndex != object.__frame) {
            if (!this._isFrameVariable(-1, name)) {
                this._removeVariable(name);
                this._addVariable(-1, name);
            }
        } else {
            this._addVariable(this._frameIndex, name);
        }

        return name;
    },

    _wrapContext: function(ctx) {
        this._recordLine(`${this._getObjectVariable(ctx)} = canvas.getContext('webgpu');`);
        this._wrapObject(ctx);
    },

    _asyncMethods: [
        "requestAdapter",
        "requestDevice",
        "createComputePipelineAsync",
        "createRenderPipelineAsync"
    ],

    _skipMethods: [
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
    ],

    _objectHasMethods: function(object) {
        for (let m in object) {
            if (typeof(object[m]) == "function" && this._skipMethods.indexOf(m) == -1) {
                return true;
            }
        }
        return false;
    },

    _queue: null,

    _wrapObject: function(object) {
        // eslint-disable-next-line no-undef
        if (object.constructor === GPUQueue)
            this._queue = object;
        for (let m in object) {
            if (typeof(object[m]) == "function") {
                if (this._skipMethods.indexOf(m) == -1) {
                    if (this._asyncMethods.indexOf(m) != -1)
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
    },

    _wrapMethod: function(object, method) {
        if (this._skipMethods.indexOf(method) != -1)
            return;
        let origMethod = object[method];
        let self = this;
        object[method] = function() {
            // We can't track changes to mapped data because it's just a regular JS array buffer and
            // any JS process can modify that data. So in the recording, we convert createBuffer
            // mappedAtCreation to false, keep track of mapped buffers from the getMappedRange
            // method and don't record that, and we don't record unmap and instead make a copy of
            // the data in the getMappedRange buffers and update the WebGPU state with
            // device.queue.writeBuffer.
            if (method == "getMappedRange") {
                let result = origMethod.call(object, ...arguments);
                if (!object.__mappedRanges)
                    object.__mappedRanges = [];
                // Keep track of the mapped ranges for the buffer object.
                object.__mappedRanges.push(result);
                // Don't record the getMappedRange call.
                return result;
            } else if (method == "unmap") {
                if (object.__mappedRanges) {
                    for (let buffer of object.__mappedRanges) {
                        // Make a copy of the getMappedRange buffer data as it is when unmap
                        // is called.
                        let cacheIndex = self._getDataCache(buffer, buffer.byteOffset, buffer.byteLength);
                        // Generate a queue.writeBuffer method to update the buffer object with that
                        // recorded data, instead of using the unmap method.
                        self._recordLine(`${self._getObjectVariable(self._queue)}.writeBuffer(${self._getObjectVariable(object)}, 0, D[${cacheIndex}].buffer, 0, D[${cacheIndex}].byteLength);`);
                    }
                    delete object.__mappedRanges;
                }
                // Call the original unmap
                let result = origMethod.call(object, ...arguments);
                return result;
            }
            let result = origMethod.call(object, ...arguments);
            self._recordCommand(false, object, method, result, arguments);
            return result;
        };
    },

    _wrapAsync: function(object, method) {
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
    },

    _stringifyObject: function(object) {
        let s = "{";
        for (let key in object) {
            s += `"${key}":`;
            let value = object[key];
            if (value === undefined) {
                s += "undefined";
            } else if (value === null) {
                s += "null";
            } else if (typeof(value) == "string") {
                s += `\`${value}\``;
            } else if (value.__id) {
                s += `x${value.__id}`;
            } else if (value.constructor == Array) {
                s += this._stringifyArray(value);
            } else if (typeof(value) == "object") {
                s += this._stringifyObject(value);
            } else {
                s += `${value}`;
            }
            s += ",";
        }
        s += "}";
        return s;
    },

    _stringifyArray: function(a) {
        let s = "[";
        s += this._getArgs("", a);
        s += "]";
        return s;
    },

    _arrayCache: [],
    _totalData: 0,

    _getDataCache: function(heap, offset, length) {
        let self = this;

        function _heapAccessShiftForWebGPUHeap(heap) {
            return 31 - Math.clz32(heap.BYTES_PER_ELEMENT);
        }

        function _validateCacheData(ai, view) {
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
        
        offset = offset << _heapAccessShiftForWebGPUHeap(heap);
        this._totalData += length;
        let view = new Uint8Array(heap.buffer ?? heap, offset, length);

        let cacheIndex = -1;
        for (let ai = 0; ai < self._arrayCache.length; ++ai) {
            let c = self._arrayCache[ai];
            if (c.offset == offset && c.length == length) {
                if (_validateCacheData(ai, view)) {
                    cacheIndex = ai;
                    break;
                }
            }
        }

        if (cacheIndex == -1) {
            cacheIndex = self._arrayCache.length;
            let arrayCopy = Uint8Array.from(view);
            self._arrayCache.push({
                offset: 0,
                length: length,
                type: 'Uint8Array',
                array: arrayCopy
            });
        }
        return cacheIndex;
    },

    _getArgs: function(method, args) {
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
            let height = args[3].height || args[3][1] || 0;
            let size = bytesPerRow * height;
            let offset = args[2].offset;
            let cacheIndex = this._getDataCache(buffer, offset, size);
            args[1] = { __data: cacheIndex };
            args[2].offset = 0;
        } else if (method == "setBindGroup") {
            args.length = 2; // TODO: support dynamic offsets
        } else if (method == "createBuffer") {
            if (args[0].mappedAtCreation) {
                args[0] = { ...args[0] }; // clone args[0]
                args[0].mappedAtCreation = false;
            }
        }

        let argStrings = [];
        for (let a of args) {
            if (a == undefined) {
                argStrings.push('undefined');
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
    },

    _recordLine: function(line) {
        if (this._isRecording) {
            if (this._frameIndex == -1) {
                this._initializeCommands.push(line);
            } else {
                this._currentFrameCommands.push(line);
            }
        }
    },

    _recordCommand: function(async, object, method, result, args) {
        if (this._isRecording) {
            if (result)
                this._registerObject(result);

            async = async ? "await " : "";

            if (result) {
                this._recordLine(`${this._getObjectVariable(result)} = ${async}${this._getObjectVariable(object)}.${method}(${this._getArgs(method, args)});`);
            } else {
                this._recordLine(`${async}${this._getObjectVariable(object)}.${method}(${this._getArgs(method, args)});`);
            }

            if (result && typeof(result) == "object")
                this._wrapObject(result);
        }
    }
};

function WebGPURecorder_initialize() {
    // Get configuration settings from the html in the form:
    // <script id="webgpu_recorder" type="application/json">{
    //    "frames": 100,
    //    "export": "WebGPURecord",
    //    "width": 800,
    //    "height": 600
    // }</script>
    let configData = document.getElementById("webgpu_recorder");
    if (configData) {
        try {
            let data = JSON.parse(configData.text);
            WebGPURecorder.config.maxFrames = parseInt(data["frames"] || WebGPURecorder.config.maxFrames);
            WebGPURecorder.config.exportName = data["export"] || WebGPURecorder.config.exportName;
            WebGPURecorder.config.canvasWidth = parseInt(data["width"] || WebGPURecorder.config.canvasWidth);
            WebGPURecorder.config.canvasHeight = parseInt(data["height"] || WebGPURecorder.config.canvasHeight);
        } catch (error) {
            //
        }
    }
    WebGPURecorder.initialize();
}
window.addEventListener('load', WebGPURecorder_initialize);
setTimeout(WebGPURecorder_initialize, 100);
