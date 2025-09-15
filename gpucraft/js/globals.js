export const Globals = {
    engine: null,
    world: null,
    canvas: null,
    input: null,
    player: null,
    camera: null,
    time: 0,
    deltaTime: 1.0 / 60.0,
    maxDeltaTime: 0,
    fixedDeltaTime: 1.0 / 60.0
};

if (typeof(performance) != "undefined") {
    Globals.now = performance.now.bind(performance);
} else {
    Globals.now = Date.now.bind(Date);
}
