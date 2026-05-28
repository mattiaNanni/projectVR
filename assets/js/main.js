import { initEngine, initCamera, initJump, initWebXR, createPortal } from "./engine.js";

const { canvas, engine } = initEngine("renderCanvas");

const createScene = async function () {
    const scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -0.15, 0);

    // Camera
    const camera = initCamera(scene, canvas);

    // Background
    const photoDome = new BABYLON.PhotoDome(
        "testo_sfondo",
        "assets/textures/geralt.jpg",
        { resolution: 32, size: 1000 },
        scene
    );

    // Luce
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Terreno
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 4000000, height: 4000000 }, scene);
    ground.checkCollisions = true;
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.alpha = 0;
    ground.material = groundMaterial;

    // Sfera
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2 }, scene);
    sphere.position.y = 1;
    sphere.checkCollisions = true;

    // Box rossi
    for (let i = 0; i < 5; i++) {
        let box = BABYLON.MeshBuilder.CreateBox("box" + i, { size: 2 }, scene);
        box.position.x = (i - 2) * 5;
        box.position.y = 1;
        box.checkCollisions = true;
        const redMaterial = new BABYLON.StandardMaterial("redMat" + i, scene);
        redMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
        box.material = redMaterial;
    }

    // Salto
    const { isJumpingRef, jumpVelocityRef, jumpForce } = initJump(scene, camera);

    // WebXR per Quest
    await initWebXR(scene, ground, isJumpingRef, jumpVelocityRef, jumpForce);
    createPortal(scene, camera, "scena2.html", new BABYLON.Vector3(0, 3, 5));
    return scene;
};


createScene().then((scene) => {
    engine.runRenderLoop(() => scene.render());
});