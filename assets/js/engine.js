// engine.js — setup base riutilizzabile
// Importa questo file in ogni scena e chiama initEngine(canvas) per inizializzare

export function initEngine(canvasId) {
    const canvas = document.getElementById(canvasId);
    const engine = new BABYLON.Engine(canvas, true);

    window.addEventListener("resize", () => engine.resize());

    return { canvas, engine };
}

export function createPortal(scene, camera, targetUrl, position = new BABYLON.Vector3(0, 3, 5)) {
    console.log("✅ portale creato a posizione:", position);
    // Anello 3D del portale
    const portal = BABYLON.MeshBuilder.CreateTorus("portal", {
        diameter: 4,
        thickness: 0.3,
        tessellation: 32
    }, scene);
    portal.position = position;
    portal.rotation.x = Math.PI / 2; // verticale

    // Materiale luminoso
    const portalMaterial = new BABYLON.StandardMaterial("portalMat", scene);
    portalMaterial.diffuseColor = new BABYLON.Color3(0, 0.8, 1);
    portalMaterial.emissiveColor = new BABYLON.Color3(0, 0.8, 1); // effetto glow
    portal.material = portalMaterial;

    // Disco interno semitrasparente
    const disc = BABYLON.MeshBuilder.CreateDisc("portalDisc", { radius: 1.9, tessellation: 32 }, scene);
    disc.position = position.clone();
    disc.rotation.x = Math.PI / 2;
    const discMaterial = new BABYLON.StandardMaterial("discMat", scene);
    discMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
    discMaterial.emissiveColor = new BABYLON.Color3(0, 0.3, 0.8);
    discMaterial.alpha = 0.5;
    disc.material = discMaterial;

    // Rotazione animata dell'anello
    scene.onBeforeRenderObservable.add(() => {
        portal.rotation.y += 0.01;
    });

    // Trigger: se la camera entra nel raggio del portale → cambia pagina
    scene.onBeforeRenderObservable.add(() => {
        const dx = camera.position.x - portal.position.x;
        const dz = camera.position.z - portal.position.z;
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
        if (horizontalDistance < 2) {
            window.location.href = targetUrl;
        }
    });

    return portal;
}

export async function initWebXR(scene, ground, isJumpingRef, jumpVelocityRef, jumpForce) {
    const xrSupported = await BABYLON.WebXRSessionManager.IsSessionSupportedAsync("immersive-vr");

    if (xrSupported) {
        const xrHelper = await scene.createDefaultXRExperienceAsync({
            floorMeshes: [ground],
            disableTeleportation: true,
            optionalFeatures: true
        });

        const featureManager = xrHelper.baseExperience.featuresManager;
        featureManager.enableFeature(
            BABYLON.WebXRFeatureName.MOVEMENT,
            "latest",
            {
                xrInput: xrHelper.input,
                movementSpeed: 0.15,
                rotationSpeed: 0.25,
                movementOrientationFollowsViewerPose: true
            }
        );

        console.log("✅ WebXR attivo — modalità Quest");

        xrHelper.input.onControllerAddedObservable.add((controller) => {
            controller.onMotionControllerInitObservable.add((motionController) => {
                if (motionController.handness === "right") {
                    const aButton = motionController.getComponent("a-button");
                    if (aButton) {
                        aButton.onButtonStateChangedObservable.add((state) => {
                            if (state.pressed && !isJumpingRef.value) {
                                isJumpingRef.value = true;
                                jumpVelocityRef.value = jumpForce;
                            }
                        });
                    }
                }
            });
        });

    } else {
        console.log("ℹ️ WebXR non supportato — modalità desktop attiva");
    }
}

export function initCamera(scene, canvas) {
    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 3, -10), scene);

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

    return camera;
}

export function initJump(scene, camera) {
    const isJumpingRef = { value: false };
    const jumpVelocityRef = { value: 0 };
    const jumpForce = 0.5;
    const jumpGravity = -0.012;
    const baseGroundHeight = 3;

    scene.onBeforeRenderObservable.add(() => {
        if (isJumpingRef.value) {
            camera.applyGravity = false;
            camera.position.y += jumpVelocityRef.value;
            jumpVelocityRef.value += jumpGravity;

            const ray = new BABYLON.Ray(camera.position, new BABYLON.Vector3(0, -1, 0), 10);
            const hit = scene.pickWithRay(ray, (mesh) => mesh.checkCollisions && mesh.name !== "player");
            const landingHeight = hit.hit ? hit.pickedPoint.y + 3 : baseGroundHeight;

            if (camera.position.y <= landingHeight) {
                camera.position.y = landingHeight;
                isJumpingRef.value = false;
                jumpVelocityRef.value = 0;
                camera.applyGravity = true;
            }
        }
    });

    window.addEventListener("keydown", (e) => {
        if (e.code === "Space" && !isJumpingRef.value) {
            isJumpingRef.value = true;
            jumpVelocityRef.value = jumpForce;
        }
    });

    return { isJumpingRef, jumpVelocityRef, jumpForce };
}

export function createInfoPanel(scene, position = new BABYLON.Vector3(0, 4, 5), content = []) {
    // Piano su cui viene proiettata la GUI
    const panel = BABYLON.MeshBuilder.CreatePlane("infoPanel", { width: 6, height: 4 }, scene);
    panel.position = position;
    panel.billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE;

    // Texture dinamica su cui disegniamo testo e righe
    const texture = new BABYLON.DynamicTexture("panelTexture", { width: 1024, height: 682 }, scene);
    const ctx = texture.getContext();

    // Sfondo
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, 1024, 682);

    // Bordo
    ctx.strokeStyle = "#00cfff";
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 1004, 662);

    // Titolo
    ctx.fillStyle = "#00cfff";
    ctx.font = "bold 52px Arial";
    ctx.textAlign = "center";
    ctx.fillText(content.title || "Titolo", 512, 80);

    // Linea separatrice titolo
    ctx.strokeStyle = "#00cfff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 105);
    ctx.lineTo(984, 105);
    ctx.stroke();

    // Intestazioni colonne
    const colX = [80, 400, 750];
    ctx.fillStyle = "#aad4f5";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "left";
    const headers = content.headers || [];
    headers.forEach((h, i) => {
        ctx.fillText(h, colX[i] || 80 + i * 300, 155);
    });

    // Linea separatrice intestazioni
    ctx.strokeStyle = "#aad4f5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 175);
    ctx.lineTo(984, 175);
    ctx.stroke();

    // Righe dati
    const rows = content.rows || [];
    rows.forEach((row, rowIndex) => {
        const y = 230 + rowIndex * 70;

        // Sfondo alternato
        if (rowIndex % 2 === 0) {
            ctx.fillStyle = "rgba(0, 100, 150, 0.2)";
            ctx.fillRect(20, y - 40, 984, 65);
        }

        // Testo celle
        ctx.fillStyle = "#ffffff";
        ctx.font = "32px Arial";
        row.forEach((cell, colIndex) => {
            ctx.fillText(String(cell), colX[colIndex] || 80 + colIndex * 300, y);
        });

        // Linea separatrice riga
        ctx.strokeStyle = "rgba(0, 207, 255, 0.2)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, y + 25);
        ctx.lineTo(984, y + 25);
        ctx.stroke();
    });

    texture.update();

    const material = new BABYLON.StandardMaterial("panelMat", scene);
    material.diffuseTexture = texture;
    material.emissiveTexture = texture; // visibile anche senza luce diretta
    material.backFaceCulling = false;   // visibile da entrambi i lati
    panel.material = material;

    return panel;
}