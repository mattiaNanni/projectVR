// engine.js — setup base riutilizzabile

export function initEngine(canvasId) {
    const canvas = document.getElementById(canvasId);
    const engine = new BABYLON.Engine(canvas, true);
    window.addEventListener("resize", () => engine.resize());
    return { canvas, engine };
}

export function createPortal(scene, camera, targetUrl, position = new BABYLON.Vector3(0, 3, 5)) {
    const portal = BABYLON.MeshBuilder.CreateTorus("portal", {
        diameter: 4,
        thickness: 0.3,
        tessellation: 32
    }, scene);
    portal.position = position;
    portal.rotation.x = Math.PI / 2;
    portal.metadata = targetUrl;

    const portalMaterial = new BABYLON.StandardMaterial("portalMat", scene);
    portalMaterial.diffuseColor = new BABYLON.Color3(0, 0.8, 1);
    portalMaterial.emissiveColor = new BABYLON.Color3(0, 0.8, 1);
    portal.material = portalMaterial;

    const disc = BABYLON.MeshBuilder.CreateDisc("portalDisc", { radius: 1.9, tessellation: 32 }, scene);
    disc.position = position.clone();
    disc.rotation.x = Math.PI / 2;
    const discMaterial = new BABYLON.StandardMaterial("discMat", scene);
    discMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 1);
    discMaterial.emissiveColor = new BABYLON.Color3(0, 0.3, 0.8);
    discMaterial.alpha = 0.5;
    disc.material = discMaterial;

    scene.onBeforeRenderObservable.add(() => {
        portal.rotation.y += 0.01;
    });

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

    if (!xrSupported) {
        console.log("WebXR non supportato — modalità desktop attiva");
        return null;
    }

    const xrHelper = await scene.createDefaultXRExperienceAsync({
        floorMeshes: [ground],
        disableTeleportation: true,
        optionalFeatures: true
    });

    console.log("WebXR attivo — modalità Quest");

    //  Movimento manuale con collisioni corpo intero (5 raggi orizzontali)
    scene.onBeforeRenderObservable.add(() => {
        if (!xrHelper.input || !xrHelper.input.controllers) return;

        const xrCamera = xrHelper.baseExperience.camera;

        for (const controller of xrHelper.input.controllers) {
            const mc = controller.motionController;
            if (!mc) continue;

            if (mc.handness === "left") {
                const thumbstick = mc.getComponent("xr-standard-thumbstick");
                if (thumbstick && thumbstick.axes) {
                    const axisX = thumbstick.axes.x || 0;
                    const axisY = thumbstick.axes.y || 0;

                    const forward = xrCamera.getForwardRay().direction.clone();
                    forward.y = 0;
                    forward.normalize();
                    const right = BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), forward).normalize();

                    const moveDir = forward.scale(-axisY).add(right.scale(axisX));
                    if (moveDir.length() < 0.01) continue;
                    moveDir.normalize();

                    const moveSpeed = 0.1;
                    const collisionDistance = 0.6;

                    //  5 raggi a diverse altezze — simulano il corpo
                    const rayHeights = [
                        xrCamera.position.y,        // testa
                        xrCamera.position.y - 0.5,  // petto
                        xrCamera.position.y - 1.0,  // vita
                        xrCamera.position.y - 1.5,  // gambe
                        xrCamera.position.y - 2.5,  // piedi
                    ];

                    let blocked = false;
                    let slideNormal = null;

                    const meshFilter = (mesh) =>
                        mesh.checkCollisions === true &&
                        mesh.name !== "ground" &&
                        !mesh.name.startsWith("portal");

                    // Controlla collisioni a tutte le altezze del corpo
                    for (const height of rayHeights) {
                        const origin = new BABYLON.Vector3(
                            xrCamera.position.x,
                            height,
                            xrCamera.position.z
                        );
                        const ray = new BABYLON.Ray(origin, moveDir, collisionDistance);
                        const hit = scene.pickWithRay(ray, meshFilter);

                        if (hit.hit) {
                            blocked = true;
                            const normal = hit.getNormal(true);
                            if (normal) {
                                normal.y = 0;
                                normal.normalize();
                                slideNormal = normal;
                            }
                            break;
                        }
                    }

                    if (!blocked) {
                        // Nessun ostacolo — movimento libero
                        xrCamera.position.addInPlace(moveDir.scale(moveSpeed));
                    } else if (slideNormal) {
                        // Ostacolo — scivola lungo la parete
                        const slide = moveDir.subtract(
                            slideNormal.scale(BABYLON.Vector3.Dot(moveDir, slideNormal))
                        );
                        slide.y = 0;

                        if (slide.length() > 0.01) {
                            slide.normalize();

                            let slideBlocked = false;
                            for (const height of rayHeights) {
                                const origin = new BABYLON.Vector3(
                                    xrCamera.position.x,
                                    height,
                                    xrCamera.position.z
                                );
                                const slideRay = new BABYLON.Ray(origin, slide, collisionDistance);
                                const slideHit = scene.pickWithRay(slideRay, meshFilter);
                                if (slideHit.hit) {
                                    slideBlocked = true;
                                    break;
                                }
                            }

                            if (!slideBlocked) {
                                xrCamera.position.addInPlace(slide.scale(moveSpeed * 0.7));
                            }
                        }
                    }
                }
            }

            if (mc.handness === "right") {
                const thumbstick = mc.getComponent("xr-standard-thumbstick");
                if (thumbstick && thumbstick.axes) {
                    const axisX = thumbstick.axes.x || 0;
                    xrCamera.rotation.y += axisX * 0.03;
                }
            }
        }
    });

    // Gravità + salto + rilevamento superficie sotto i piedi
    scene.onAfterRenderObservable.add(() => {
        const xrCamera = xrHelper.baseExperience.camera;
        const currentX = xrCamera.position.x;
        const currentZ = xrCamera.position.z;

        // Raycast verso il basso — rileva su cosa siamo sopra
        const downRay = new BABYLON.Ray(
            new BABYLON.Vector3(xrCamera.position.x, xrCamera.position.y, xrCamera.position.z),
            new BABYLON.Vector3(0, -1, 0),
            10
        );
        const downHit = scene.pickWithRay(downRay, (mesh) =>
            mesh.checkCollisions === true &&
            !mesh.name.startsWith("portal")
        );

        // Altezza minima = superficie sotto + altezza corpo
        const floorHeight = downHit.hit ? downHit.pickedPoint.y + 3 : 3;

        if (isJumpingRef.value) {
            xrCamera.position.y += jumpVelocityRef.value;
            jumpVelocityRef.value += -0.012;

            if (xrCamera.position.y <= floorHeight) {
                xrCamera.position.y = floorHeight;
                isJumpingRef.value = false;
                jumpVelocityRef.value = 0;
            }
        } else {
            if (xrCamera.position.y > floorHeight) {
                xrCamera.position.y = Math.max(xrCamera.position.y - 0.05, floorHeight);
            } else {
                xrCamera.position.y = floorHeight;
            }
        }

        xrCamera.position.x = currentX;
        xrCamera.position.z = currentZ;
    });

    // Salto con tasto A controller destro
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

    // Portale in WebXR
    xrHelper.baseExperience.onStateChangedObservable.add((state) => {
        if (state === BABYLON.WebXRState.IN_XR) {
            scene.onBeforeRenderObservable.add(() => {
                const xrCamera = xrHelper.baseExperience.camera;
                const xrPos = xrCamera.globalPosition;
                const portalMesh = scene.getMeshByName("portal");
                if (portalMesh) {
                    const dx = xrPos.x - portalMesh.position.x;
                    const dz = xrPos.z - portalMesh.position.z;
                    if (Math.sqrt(dx * dx + dz * dz) < 2) {
                        window.location.href = portalMesh.metadata;
                    }
                }
            });
        }
    });

    return xrHelper;
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

export function createCoordDisplay(scene, camera, canvas) {
    //  Display coordinate HTML
    const coordDiv = document.createElement("div");
    coordDiv.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.6);
        color: #00cfff;
        font-family: monospace;
        font-size: 14px;
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid #00cfff;
        z-index: 999;
        pointer-events: none;
        display: none;
    `;
    document.body.appendChild(coordDiv);

    //  Pannello 3D cliccabile nella scena
    const btnMesh = BABYLON.MeshBuilder.CreatePlane("coordBtn", { width: 2, height: 0.6 }, scene);
    btnMesh.position = new BABYLON.Vector3(3, 2, -7); // posizione davanti alla camera
    btnMesh.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL; // sempre rivolto verso la camera

    // Texture con testo
    const btnTexture = new BABYLON.DynamicTexture("coordBtnTex", { width: 512, height: 128 }, scene);
    const drawButton = (active) => {
        const ctx = btnTexture.getContext();
        ctx.clearRect(0, 0, 512, 128);
        ctx.fillStyle = active ? "rgba(0, 207, 255, 0.4)" : "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = "#00cfff";
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 504, 120);
        ctx.fillStyle = "#00cfff";
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("📍 Coordinate", 256, 64);
        btnTexture.update();
    };
    drawButton(false);

    const btnMat = new BABYLON.StandardMaterial("coordBtnMat", scene);
    btnMat.diffuseTexture = btnTexture;
    btnMat.emissiveTexture = btnTexture;
    btnMat.backFaceCulling = false;
    btnMesh.material = btnMat;

    // Toggle al click sul pannello 3D
    let visible = false;
    scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERPICK) {
            if (pointerInfo.pickInfo.hit &&
                pointerInfo.pickInfo.pickedMesh === btnMesh) {
                visible = !visible;
                coordDiv.style.display = visible ? "block" : "none";
                drawButton(visible);
            }
        }
    });

    // Aggiorna coordinate ogni frame
    scene.onBeforeRenderObservable.add(() => {
        if (!visible) return;
        const x = camera.position.x.toFixed(2);
        const y = camera.position.y.toFixed(2);
        const z = camera.position.z.toFixed(2);
        coordDiv.innerHTML = `X: ${x}<br>Y: ${y}<br>Z: ${z}`;
    });
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
    const panel = BABYLON.MeshBuilder.CreatePlane("infoPanel", { width: 6, height: 4 }, scene);
    panel.position = position;
    panel.billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE;

    const texture = new BABYLON.DynamicTexture("panelTexture", { width: 1024, height: 682 }, scene);
    const ctx = texture.getContext();

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, 1024, 682);
    ctx.strokeStyle = "#00cfff";
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 1004, 662);
    ctx.fillStyle = "#00cfff";
    ctx.font = "bold 52px Arial";
    ctx.textAlign = "center";
    ctx.fillText(content.title || "Titolo", 512, 80);
    ctx.strokeStyle = "#00cfff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 105);
    ctx.lineTo(984, 105);
    ctx.stroke();

    const colX = [80, 400, 750];
    ctx.fillStyle = "#aad4f5";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "left";
    (content.headers || []).forEach((h, i) => {
        ctx.fillText(h, colX[i] || 80 + i * 300, 155);
    });

    ctx.strokeStyle = "#aad4f5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 175);
    ctx.lineTo(984, 175);
    ctx.stroke();

    (content.rows || []).forEach((row, rowIndex) => {
        const y = 230 + rowIndex * 70;
        if (rowIndex % 2 === 0) {
            ctx.fillStyle = "rgba(0, 100, 150, 0.2)";
            ctx.fillRect(20, y - 40, 984, 65);
        }
        ctx.fillStyle = "#ffffff";
        ctx.font = "32px Arial";
        row.forEach((cell, colIndex) => {
            ctx.fillText(String(cell), colX[colIndex] || 80 + colIndex * 300, y);
        });
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
    material.emissiveTexture = texture;
    material.backFaceCulling = false;
    panel.material = material;

    return panel;
}