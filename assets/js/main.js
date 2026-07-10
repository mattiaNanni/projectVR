import { initEngine, initCamera, initJump, initWebXR, createPortal, createInfoPanel, createCoordDisplay } from "./engine.js?v=12";

const { canvas, engine } = initEngine("renderCanvas");

const createScene = async function () {
    const scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -0.15, 0);

    const camera = initCamera(scene, canvas);

    const photoDome = new BABYLON.PhotoDome(
        "testo_sfondo",
        "assets/textures/santuario_jpeg.jpg",
        { resolution: 32, size: 1000 },
        scene
    );

    createCoordDisplay(scene, camera, canvas);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 4000000, height: 4000000 }, scene);
    ground.checkCollisions = true;
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.alpha = 0;
    ground.material = groundMaterial;

    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2 }, scene);
    sphere.position.y = 1;
    sphere.checkCollisions = true;

    for (let i = 0; i < 5; i++) {
        let box = BABYLON.MeshBuilder.CreateBox("box" + i, { size: 2 }, scene);
        box.position.x = (i - 2) * 5;
        box.position.y = 1;
        box.checkCollisions = true;
        const redMaterial = new BABYLON.StandardMaterial("redMat" + i, scene);
        redMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
        box.material = redMaterial;
    }

    const { isJumpingRef, jumpVelocityRef, jumpForce } = initJump(scene, camera);

    await initWebXR(scene, ground, isJumpingRef, jumpVelocityRef, jumpForce);

    createPortal(scene, camera, "scena3.html", new BABYLON.Vector3(0, 3, 5));

    createInfoPanel(scene, new BABYLON.Vector3(0, 4, 8), {
        title: "Tabella Siti Archeologici",
        headers: ["Sito", "Periodo", "Posizione"],
        rows: [
            ["Pompei",       "79 d.C.",   "Italia"],
            ["Machu Picchu", "1450 d.C.", "Perù"],
            ["Stonehenge",   "3000 a.C.", "UK"],
            ["Colosseo",     "70 d.C.",   "Roma"],
            ["Angkor Wat",   "1100 d.C.", "Cambogia"],
        ]
    });

    const ambientSound = new BABYLON.Sound(
        "ambient",
        "assets/audio/ambient.mp3",  // ← metti qui il path del tuo file audio
        scene,
        null,
        {
            loop: true,       // si ripete in loop
            autoplay: true,   // parte automaticamente
            volume: 0.1       // volume molto basso (0.0 - 1.0)
        }
    );

    return scene;
};

// ✅ Semplice — niente secondo xrHelper
createScene().then((scene) => {
    engine.runRenderLoop(() => scene.render());
});