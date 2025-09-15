import { Engine } from "./engine.js";

function main() {
    const canvas = document.getElementById("gpucraft");
    const engine = new Engine();
    engine.run(canvas, { autoResizeCanvas: true });
}
window.addEventListener('load', main);
