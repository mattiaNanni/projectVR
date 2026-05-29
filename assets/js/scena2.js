import { initEngine, initCamera, initJump, initWebXR,createPortal } from "./engine.js?v=5";

const { canvas, engine } = initEngine("renderCanvas");

const createScene = async function () {
    const scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -0.15, 0);

    // Sfondo blu
    scene.clearColor = new BABYLON.Color4(0.1, 0.3, 0.8, 1.0);

    // Camera
    const camera = initCamera(scene, canvas);

    // Luce
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Piattaforma gigante visibile
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 4000000, height: 4000000 }, scene);
    ground.checkCollisions = true;
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4); // grigio
    ground.material = groundMaterial;

    // Salto
    const { isJumpingRef, jumpVelocityRef, jumpForce } = initJump(scene, camera);

    // WebXR
    await initWebXR(scene, ground, isJumpingRef, jumpVelocityRef, jumpForce);
    createPortal(scene, camera, "index.html", new BABYLON.Vector3(0, 3, 5));
    return scene;
};



createScene().then(async (scene) => {
    engine.runRenderLoop(() => scene.render());
});