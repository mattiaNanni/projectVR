import { initEngine, initCamera, initJump, initWebXR, createCoordDisplay } from "./engine.js?v=12";

const { canvas, engine } = initEngine("renderCanvas");

const createScene = async function () {
    const scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    
    // Configurazione Gravità
    const originalGravity = new BABYLON.Vector3(0, -0.15, 0);
    scene.gravity = originalGravity;
    scene.clearColor = new BABYLON.Color4(0.0, 0.6, 0.2, 1.0);

    const camera = initCamera(scene, canvas);
    createCoordDisplay(scene, camera, canvas);

    const originalSpeed = camera.speed || 2;
    
    window.addEventListener("keydown", (event) => {
        if (event.key === "CapsLock") {
            if (scene.gravity.y < 0) {
                camera.speed = originalSpeed * 3;
                scene.gravity = new BABYLON.Vector3(0, 0, 0);
            } else {
                camera.speed = originalSpeed;
                scene.gravity = originalGravity;
            }
        }
        if (event.key.toLowerCase() === 'e') camera.position.y += 0.5;
        if (event.key.toLowerCase() === 'q') camera.position.y -= 0.5;
    });

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.8; 
    
    // Materiali
    const wallColor = new BABYLON.Color3(1, 0.9, 0.2);
    const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
    wallMaterial.diffuseColor = wallColor;

    // Mega Cubo Rosso
    const redMaterial = new BABYLON.StandardMaterial("redMaterial", scene);
    redMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
    const redCube = BABYLON.MeshBuilder.CreateBox("redCube", { size: 50 }, scene);
    redCube.position = new BABYLON.Vector3(0, 100, 0);
    redCube.material = redMaterial;

    const platformCollider = BABYLON.MeshBuilder.CreateGround("ground", { width: 20000, height: 20000 }, scene);
    platformCollider.checkCollisions = true;
    platformCollider.isVisible = false; 

    BABYLON.SceneLoader.ImportMeshAsync("", "assets/models/", "floor.glb", scene).then((result) => {
        const floorRoot = result.meshes[0];
        if (floorRoot) {
            floorRoot.scaling = new BABYLON.Vector3(100, 1, 100);
            floorRoot.position = new BABYLON.Vector3(0, 0, 0);
        }
    });

    BABYLON.SceneLoader.ImportMeshAsync("", "assets/models/", "Columns.glb", scene).then((result) => {
        const firstColumnRoot = result.meshes[0]; 
        firstColumnRoot.scaling = new BABYLON.Vector3(0.05, 0.08, 0.05);
        firstColumnRoot.setEnabled(false);

        const columnPositions = [];
        for (let i = -1; i < 6; i++) {
            const posX = -12 + (i * 18);
            columnPositions.push(posX);

            const colFront = firstColumnRoot.clone("colFront_" + i);
            colFront.position = new BABYLON.Vector3(posX, 3, 15);
            colFront.setEnabled(true);
            const colBack = firstColumnRoot.clone("colBack_" + i);
            colBack.position = new BABYLON.Vector3(posX, 3, -16); 
            colBack.setEnabled(true);
        }

        const archBaseY = 19.5; 
        const wallHeight = 10;
        const wallDepth = 0.5; 
        const archDiameter = 12;
        
        const colWidth = 20; 
        const shift = 3; 
        
        const wallWidth = colWidth; 

        for (let i = 0; i < columnPositions.length - 1; i++) {
            const midX = (columnPositions[i] + columnPositions[i+1]) / 2;
            const finalMidX = midX - shift;

            [15, -16].forEach(zPos => {
                let finalZ = zPos;
                let yOffset = 0;

                if (zPos === -16) {
                    finalZ = -10; 
                    yOffset = -2.5; 
                }

                const wallBox = BABYLON.MeshBuilder.CreateBox("wall", { width: wallWidth, height: wallHeight, depth: wallDepth }, scene);
                wallBox.position = new BABYLON.Vector3(finalMidX, archBaseY + (wallHeight / 2) + yOffset, finalZ); 
                
                const archHole = BABYLON.MeshBuilder.CreateCylinder("archHole", { height: wallDepth + 0.5, diameter: archDiameter }, scene);
                archHole.rotation.x = Math.PI / 2;
                archHole.position = new BABYLON.Vector3(finalMidX, archBaseY + yOffset, finalZ);
                
                const wallCSG = BABYLON.CSG.FromMesh(wallBox);
                const holeCSG = BABYLON.CSG.FromMesh(archHole);
                const resultCSG = wallCSG.subtract(holeCSG);
                
                const finalWall = resultCSG.toMesh("finalWall", wallMaterial, scene);
                finalWall.checkCollisions = true;

                wallBox.dispose();
                archHole.dispose();
            });
        }

        const wallHeightBox = 22; 
        const wallThickness = 0.3;
        const sharedWallLength = 85; 
        const wallXCenter = 12.5;

        const wallLeft = BABYLON.MeshBuilder.CreateBox("wallLeft", { width: sharedWallLength, height: wallHeightBox, depth: wallThickness }, scene);
        wallLeft.position = new BABYLON.Vector3(wallXCenter, wallHeightBox / 2, 36);
        wallLeft.material = wallMaterial;
        wallLeft.checkCollisions = true;

        const wallRight = BABYLON.MeshBuilder.CreateBox("wallRight", { width: sharedWallLength, height: wallHeightBox, depth: wallThickness }, scene);
        wallRight.position = new BABYLON.Vector3(wallXCenter, wallHeightBox / 2, -23);
        wallRight.material = wallMaterial;
        wallRight.checkCollisions = true;

        const wallConnector = BABYLON.MeshBuilder.CreateBox("wallConnector", { width: wallThickness, height: wallHeightBox, depth: 59 });
        wallConnector.position = new BABYLON.Vector3(-30, wallHeightBox / 2, 6.5);
        wallConnector.material = wallMaterial;
        wallConnector.checkCollisions = true;
    });

    return scene;
};

createScene().then((scene) => {
    engine.runRenderLoop(() => scene.render());
});