const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = async function () {
    const scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -0.15, 0);

    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 3, -10), scene);

    const photoDome = new BABYLON.PhotoDome(
        "testo_sfondo",
        "assets/textures/geralt.jpg",
        { resolution: 32, size: 1000 },
        scene
    );

    camera.keysUp.push(87);
    camera.keysDown.push(83);
    camera.keysLeft.push(65);
    camera.keysRight.push(68);
    camera.keysDownward.push(81);
    camera.keysUpward.push(69);

    camera.attachControl(canvas, true);
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera.ellipsoid = new BABYLON.Vector3(0.7, 3, 0.7);
    camera.ellipsoidOffset = new BABYLON.Vector3(0, 3, 0);
    camera.angularSensibility = 1000;
    camera.speed = 0.2;
    camera.inertia = 0.9;

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

    // Salto desktop
    let isJumping = false;
    let jumpVelocity = 0;
    const jumpForce = 0.5;
    const jumpGravity = -0.012;
    const baseGroundHeight = 3;

    scene.onBeforeRenderObservable.add(() => {
        if (isJumping) {
            camera.applyGravity = false;
            camera.position.y += jumpVelocity;
            jumpVelocity += jumpGravity;

            const ray = new BABYLON.Ray(camera.position, new BABYLON.Vector3(0, -1, 0), 10);
            const hit = scene.pickWithRay(ray, (mesh) => mesh.checkCollisions && mesh.name !== "player");
            const landingHeight = hit.hit ? hit.pickedPoint.y + 3 : baseGroundHeight;

            if (camera.position.y <= landingHeight) {
                camera.position.y = landingHeight;
                isJumping = false;
                jumpVelocity = 0;
                camera.applyGravity = true;
            }
        }
    });

    window.addEventListener("keydown", (e) => {
        if (e.code === "Space" && !isJumping) {
            isJumping = true;
            jumpVelocity = jumpForce;
        }
    });

    // ✅ WebXR — si attiva solo se il browser/dispositivo lo supporta
    const xrSupported = await BABYLON.WebXRSessionManager.IsSessionSupportedAsync("immersive-vr");

    if (xrSupported) {
        const xrHelper = await scene.createDefaultXRExperienceAsync({
            floorMeshes: [ground],
            disableTeleportation: true, // ✅ niente teleportazione, solo thumbstick
            optionalFeatures: true
        });

        // ✅ Movimento continuo con thumbstick sinistro
        const featureManager = xrHelper.baseExperience.featuresManager;

        featureManager.enableFeature(
            BABYLON.WebXRFeatureName.MOVEMENT,
            "latest",
            {
                xrInput: xrHelper.input,
                movementSpeed: 0.15,
                rotationSpeed: 0.25,
                movementOrientationFollowsViewerPose: true // direzione = dove guardi
            }
        );

        console.log("✅ WebXR attivo — modalità Quest");

        // ✅ Salto con tasto A del controller destro
        xrHelper.input.onControllerAddedObservable.add((controller) => {
            controller.onMotionControllerInitObservable.add((motionController) => {
                if (motionController.handness === "right") {
                    const aButton = motionController.getComponent("a-button");
                    if (aButton) {
                        aButton.onButtonStateChangedObservable.add((state) => {
                            if (state.pressed && !isJumping) {
                                isJumping = true;
                                jumpVelocity = jumpForce;
                            }
                        });
                    }
                }
            });
        });

    } else {
        console.log("ℹ️ WebXR non supportato — modalità desktop attiva");
    }

    return scene;
};

// ✅ async per WebXR
createScene().then((scene) => {
    engine.runRenderLoop(() => scene.render());
});

window.addEventListener("resize", () => engine.resize());