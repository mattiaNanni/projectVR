import { initEngine, initCamera, initJump, initWebXR, createPortal, createCoordDisplay } from "./engine.js?v=12";

const { canvas, engine } = initEngine("renderCanvas");

const createScene = async function () {
    const scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -0.15, 0);

    // Sfondo nero — siamo all'interno
    scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.05, 1.0);

    const camera = initCamera(scene, canvas);
    createCoordDisplay(scene, camera, canvas);

    // ✅ Luci
    const mainLight = new BABYLON.HemisphericLight("mainLight", new BABYLON.Vector3(0, 1, 0), scene);
    mainLight.intensity = 0.8;
    mainLight.diffuse = new BABYLON.Color3(1, 0.95, 0.85); // luce calda

    const pointLight = new BABYLON.PointLight("altarLight", new BABYLON.Vector3(0, 8, 15), scene);
    pointLight.intensity = 0.6;
    pointLight.diffuse = new BABYLON.Color3(1, 0.9, 0.7);

    // ✅ Materiali
    const stoneMat = new BABYLON.StandardMaterial("stone", scene);
    stoneMat.diffuseColor = new BABYLON.Color3(0.76, 0.70, 0.62);

    const marbleMat = new BABYLON.StandardMaterial("marble", scene);
    marbleMat.diffuseColor = new BABYLON.Color3(0.9, 0.88, 0.84);
    marbleMat.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);

    const darkMat = new BABYLON.StandardMaterial("dark", scene);
    darkMat.diffuseColor = new BABYLON.Color3(0.3, 0.25, 0.2);

    const goldMat = new BABYLON.StandardMaterial("gold", scene);
    goldMat.diffuseColor = new BABYLON.Color3(0.8, 0.65, 0.2);
    goldMat.specularColor = new BABYLON.Color3(1, 0.9, 0.4);
    goldMat.specularPower = 64;

    // ✅ Pavimento
    const floor = BABYLON.MeshBuilder.CreateGround("ground", { width: 30, height: 60 }, scene);
    floor.checkCollisions = true;
    floor.material = marbleMat;

    // ✅ Muri laterali
    const wallMat = stoneMat;
    const wallLeft = BABYLON.MeshBuilder.CreateBox("wallLeft", { width: 1, height: 30, depth: 60 }, scene);
    wallLeft.position = new BABYLON.Vector3(-15, 15, 0);
    wallLeft.checkCollisions = true;
    wallLeft.material = wallMat;

    const wallRight = BABYLON.MeshBuilder.CreateBox("wallRight", { width: 1, height: 30, depth: 60 }, scene);
    wallRight.position = new BABYLON.Vector3(15, 15, 0);
    wallRight.checkCollisions = true;
    wallRight.material = wallMat;

    // Muro fondo (abside)
    const wallBack = BABYLON.MeshBuilder.CreateBox("wallBack", { width: 30, height: 30, depth: 1 }, scene);
    wallBack.position = new BABYLON.Vector3(0, 15, 30);
    wallBack.checkCollisions = true;
    wallBack.material = wallMat;

    // Muro ingresso
    const wallFront = BABYLON.MeshBuilder.CreateBox("wallFront", { width: 30, height: 30, depth: 1 }, scene);
    wallFront.position = new BABYLON.Vector3(0, 15, -30);
    wallFront.checkCollisions = true;
    wallFront.material = wallMat;

    // ✅ Soffitto navata
    const ceiling = BABYLON.MeshBuilder.CreateBox("ceiling", { width: 30, height: 1, depth: 60 }, scene);
    ceiling.position = new BABYLON.Vector3(0, 30, 0);
    ceiling.material = stoneMat;

    // ✅ Cupola centrale — cilindro base + semisfera
    const domeCylinder = BABYLON.MeshBuilder.CreateCylinder("domeCyl", {
        height: 8,
        diameter: 16,
        tessellation: 32
    }, scene);
    domeCylinder.position = new BABYLON.Vector3(0, 34, 0);
    domeCylinder.material = stoneMat;
    domeCylinder.checkCollisions = true;

    // Semisfera della cupola (vista dall'interno)
    const dome = BABYLON.MeshBuilder.CreateSphere("dome", {
        diameter: 16,
        segments: 32,
        slice: 0.5  // solo metà sfera
    }, scene);
    dome.position = new BABYLON.Vector3(0, 38, 0);
    dome.material = marbleMat;
    // Rendi visibile solo l'interno
    dome.material.backFaceCulling = false;

    // Lanterna in cima alla cupola
    const lantern = BABYLON.MeshBuilder.CreateCylinder("lantern", {
        height: 4,
        diameter: 4,
        tessellation: 16
    }, scene);
    lantern.position = new BABYLON.Vector3(0, 46, 0);
    lantern.material = marbleMat;

    // ✅ Colonne — 4 coppie lungo la navata
    const columnPositionsZ = [-15, -5, 5, 15];
    columnPositionsZ.forEach((z, i) => {
        [-11, 11].forEach((x) => {
            // Fusto colonna
            const col = BABYLON.MeshBuilder.CreateCylinder("col" + i + x, {
                height: 20,
                diameter: 2,
                tessellation: 16
            }, scene);
            col.position = new BABYLON.Vector3(x, 10, z);
            col.material = marbleMat;
            col.checkCollisions = true;

            // Base colonna
            const base = BABYLON.MeshBuilder.CreateCylinder("base" + i + x, {
                height: 1,
                diameterTop: 2.5,
                diameterBottom: 2.8,
                tessellation: 16
            }, scene);
            base.position = new BABYLON.Vector3(x, 0.5, z);
            base.material = darkMat;

            // Capitello colonna
            const capital = BABYLON.MeshBuilder.CreateCylinder("cap" + i + x, {
                height: 1.5,
                diameterTop: 3.5,
                diameterBottom: 2,
                tessellation: 16
            }, scene);
            capital.position = new BABYLON.Vector3(x, 20.5, z);
            capital.material = goldMat;
        });
    });

    // ✅ Altare
    const altarBase = BABYLON.MeshBuilder.CreateBox("altarBase", { width: 6, height: 1.2, depth: 3 }, scene);
    altarBase.position = new BABYLON.Vector3(0, 0.6, 24);
    altarBase.material = marbleMat;
    altarBase.checkCollisions = true;

    const altarTop = BABYLON.MeshBuilder.CreateBox("altarTop", { width: 5, height: 0.3, depth: 2.5 }, scene);
    altarTop.position = new BABYLON.Vector3(0, 1.35, 24);
    altarTop.material = goldMat;

    // Croce sull'altare
    const crossV = BABYLON.MeshBuilder.CreateBox("crossV", { width: 0.3, height: 3, depth: 0.3 }, scene);
    crossV.position = new BABYLON.Vector3(0, 3.5, 24);
    crossV.material = goldMat;

    const crossH = BABYLON.MeshBuilder.CreateBox("crossH", { width: 2, height: 0.3, depth: 0.3 }, scene);
    crossH.position = new BABYLON.Vector3(0, 4.5, 24);
    crossH.material = goldMat;

    // ✅ Banchi — due file
    [-4, 4].forEach((x) => {
        for (let i = 0; i < 6; i++) {
            const bench = BABYLON.MeshBuilder.CreateBox("bench" + x + i, { width: 3.5, height: 0.5, depth: 1 }, scene);
            bench.position = new BABYLON.Vector3(x, 0.5, -20 + i * 6);
            bench.material = darkMat;
            bench.checkCollisions = true;

            const backrest = BABYLON.MeshBuilder.CreateBox("back" + x + i, { width: 3.5, height: 1, depth: 0.15 }, scene);
            backrest.position = new BABYLON.Vector3(x, 1.2, -19.5 + i * 6);
            backrest.material = darkMat;
            backrest.checkCollisions = true;
        }
    });

    // ✅ Archi decorativi tra le colonne
    columnPositionsZ.forEach((z, i) => {
        const arch = BABYLON.MeshBuilder.CreateTorus("arch" + i, {
            diameter: 11,
            thickness: 0.5,
            tessellation: 32
        }, scene);
        arch.position = new BABYLON.Vector3(0, 21, z);
        arch.rotation.z = Math.PI / 2;
        arch.material = stoneMat;
    });

    // ✅ Ground invisibile per collisioni (necessario per engine.js)
    const ground = BABYLON.MeshBuilder.CreateGround("groundCollider", { width: 30, height: 60 }, scene);
    ground.checkCollisions = true;
    ground.isVisible = false;

    const { isJumpingRef, jumpVelocityRef, jumpForce } = initJump(scene, camera);
    await initWebXR(scene, ground, isJumpingRef, jumpVelocityRef, jumpForce);
    createPortal(scene, camera, "index.html", new BABYLON.Vector3(0, 3, -25));

    return scene;
};

createScene().then((scene) => {
    engine.runRenderLoop(() => scene.render());
});