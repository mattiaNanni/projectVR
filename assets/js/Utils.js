export function generateComplexVaultsAndDome(scene, domeMaterial) {
    // ✅ Outer Z
    const vaultOuterZ = BABYLON.MeshBuilder.CreateCylinder("vaultOuterZ", {
        height: 268, diameter: 78, tessellation: 18
    }, scene);
    vaultOuterZ.rotation.x = Math.PI / 2;
    vaultOuterZ.position = new BABYLON.Vector3(111.9, 27, 5.5);
    vaultOuterZ.computeWorldMatrix(true);
    vaultOuterZ.bakeCurrentTransformIntoVertices();

    // ✅ Inner Z
    const vaultInnerZ = BABYLON.MeshBuilder.CreateCylinder("vaultInnerZ", {
        height: 269, diameter: 69, tessellation: 18
    }, scene);
    vaultInnerZ.rotation.x = Math.PI / 2;
    vaultInnerZ.position = new BABYLON.Vector3(111.9, 27, 5.5);
    vaultInnerZ.computeWorldMatrix(true);
    vaultInnerZ.bakeCurrentTransformIntoVertices();

    // ✅ Outer X
    const vaultOuterX = BABYLON.MeshBuilder.CreateCylinder("vaultOuterX", {
        height: 300, diameter: 1, tessellation: 18
    }, scene);
    vaultOuterX.rotation.z = Math.PI / 2;
    vaultOuterX.scaling = new BABYLON.Vector3(77.9, 1, 27);
    vaultOuterX.position = new BABYLON.Vector3(99.5, 26, 2.7);
    vaultOuterX.computeWorldMatrix(true);
    vaultOuterX.bakeCurrentTransformIntoVertices();

    // ✅ Inner X
    const vaultInnerX = BABYLON.MeshBuilder.CreateCylinder("vaultInnerX", {
        height: 301, diameter: 1, tessellation: 18
    }, scene);
    vaultInnerX.rotation.z = Math.PI / 2;
    vaultInnerX.scaling = new BABYLON.Vector3(73.9, 1, 27);
    vaultInnerX.position = new BABYLON.Vector3(99.5, 26, 2.7);
    vaultInnerX.computeWorldMatrix(true);
    vaultInnerX.bakeCurrentTransformIntoVertices();

    // ✅ Cupola outer e inner
    const domeOuter = BABYLON.MeshBuilder.CreateSphere("domeOuter", { diameter: 60, segments: 16 }, scene);
    domeOuter.position = new BABYLON.Vector3(112, 55, 4);
    domeOuter.computeWorldMatrix(true);
    domeOuter.bakeCurrentTransformIntoVertices();

    const domeInner = BABYLON.MeshBuilder.CreateSphere("domeInner", { diameter: 59.5, segments: 16 }, scene);
    domeInner.position = new BABYLON.Vector3(112, 55, 4);
    domeInner.computeWorldMatrix(true);
    domeInner.bakeCurrentTransformIntoVertices();

    const domeSolid = BABYLON.MeshBuilder.CreateSphere("domeSolid", { diameter: 60, segments: 16 }, scene);
    domeSolid.position = new BABYLON.Vector3(112, 55, 4);
    domeSolid.computeWorldMatrix(true);
    domeSolid.bakeCurrentTransformIntoVertices();

    // ✅ CSG
    const outerZCSG = BABYLON.CSG.FromMesh(vaultOuterZ);
    const outerXCSG = BABYLON.CSG.FromMesh(vaultOuterX);
    const innerZCSG = BABYLON.CSG.FromMesh(vaultInnerZ);
    const innerXCSG = BABYLON.CSG.FromMesh(vaultInnerX);
    const domeSolidCSG = BABYLON.CSG.FromMesh(domeSolid);
    const outerDomeCSG = BABYLON.CSG.FromMesh(domeOuter);
    const innerDomeCSG = BABYLON.CSG.FromMesh(domeInner);

    const outerUnionCSG = outerZCSG.union(outerXCSG);
    const innerUnionCSG = innerZCSG.union(innerXCSG);

    let voltaCSG = outerUnionCSG.subtract(innerUnionCSG);

    // Taglio volta
    const cutBoxVolta = BABYLON.MeshBuilder.CreateBox("cutBoxVolta", { width: 400, height: 40, depth: 400 }, scene);
    cutBoxVolta.position = new BABYLON.Vector3(99.5, 6, 1.5);
    cutBoxVolta.computeWorldMatrix(true);
    cutBoxVolta.bakeCurrentTransformIntoVertices();
    voltaCSG = voltaCSG.subtract(BABYLON.CSG.FromMesh(cutBoxVolta));
    voltaCSG = voltaCSG.subtract(domeSolidCSG);

    const voltaFinale = voltaCSG.toMesh("voltaFinale", domeMaterial, scene);
    voltaFinale.checkCollisions = true;

    // Cupola cava
    let domeCavCSG = outerDomeCSG.subtract(innerDomeCSG);
    const domeCutBox = BABYLON.MeshBuilder.CreateBox("domeCutBox", { width: 100, height: 30, depth: 100 }, scene);
    domeCutBox.position = new BABYLON.Vector3(112, 37, 4);
    domeCutBox.computeWorldMatrix(true);
    domeCutBox.bakeCurrentTransformIntoVertices();
    domeCavCSG = domeCavCSG.subtract(BABYLON.CSG.FromMesh(domeCutBox));

    const outerUnionCSG2 = BABYLON.CSG.FromMesh(vaultOuterZ).union(BABYLON.CSG.FromMesh(vaultOuterX));
    domeCavCSG = domeCavCSG.subtract(outerUnionCSG2);

    const finalDome = domeCavCSG.toMesh("finalDome", domeMaterial, scene);
    finalDome.checkCollisions = true;

    // Cleanup
    vaultOuterZ.dispose(); vaultInnerZ.dispose(); vaultOuterX.dispose(); vaultInnerX.dispose();
    domeOuter.dispose(); domeInner.dispose(); domeSolid.dispose(); domeCutBox.dispose(); cutBoxVolta.dispose();
}

/////////////////////////////////////////////////////////////////SEPARATORE///////////////////////////////////////////////////////////////////////

export function createPainting(scene, position, name, imageUrl) {
    const painting = BABYLON.MeshBuilder.CreateBox(name, {
        width: 6, height: 4, depth: 0.2
    }, scene);
    painting.rotationQuaternion = null;
    painting.position = position;

    if(painting.position.z < 0) painting.rotation.z = Math.PI;

    painting.position = position;
    painting.checkCollisions = true;


    // Crea il materiale e carica l'immagine automaticamente
    const mat = new BABYLON.StandardMaterial("mat_" + name, scene);
    mat.diffuseTexture = new BABYLON.Texture(imageUrl, scene);
    
    painting.material = mat;
    return painting;
}

/////////////////////////////////////////////////////////////////SEPARATORE///////////////////////////////////////////////////////////////////////

export async function placeDoors(scene, modelUrl = "assets/models/", modelName = "entrance.glb") {
    const zFront = -13;
    const zBack = 18;
    const zMid = (zFront + zBack) / 2;
    const x = -29;
    const y = 0;

    const doorConfigs = [
        { name: "door_front", position: new BABYLON.Vector3(x, y, zFront), scaling: new BABYLON.Vector3(0.5, 0.5, 0.5) },
        { name: "door_back", position: new BABYLON.Vector3(x, y, zBack), scaling: new BABYLON.Vector3(0.5, 0.5, 0.5) },
        { name: "door_main", position: new BABYLON.Vector3(x, y, zMid), scaling: new BABYLON.Vector3(1, 1, 1) },
    ];

    const result = await BABYLON.SceneLoader.ImportMeshAsync("", modelUrl, modelName, scene);
    const doorRoot = result.meshes[0];
    doorRoot.setEnabled(false);

    const placedDoors = [];

    doorConfigs.forEach((config) => {
        const doorInstance = doorRoot.clone(config.name);
        doorInstance.position = config.position;
        doorInstance.scaling = config.scaling;

        // ⚠️ i modelli glTF spesso usano rotationQuaternion, che sovrascrive rotation.y
        doorInstance.rotationQuaternion = null;
        doorInstance.rotation.y = Math.PI / 2;

        doorInstance.setEnabled(true);
        doorInstance.getChildMeshes().forEach((mesh) => {
            mesh.checkCollisions = true;
            mesh.rotationQuaternion = null; // stesso discorso anche per i figli, se presente
        });
        placedDoors.push(doorInstance);
    });

    return placedDoors;
}

/////////////////////////////////////////////////////////////////SEPARATORE///////////////////////////////////////////////////////////////////////

export async function placeColumns(scene, wallMaterial) {
    const result = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/models/", "Columns.glb", scene);
    const firstColumnRoot = result.meshes[0];
    firstColumnRoot.scaling = new BABYLON.Vector3(0.05, 0.08, 0.05);
    firstColumnRoot.setEnabled(false);

    const columnPositions = [];
    for (let i = -1; i < 6; i++) {
        const posX = -12 + i * 18;
        columnPositions.push(posX);

        const colFront = firstColumnRoot.clone("colFront_" + i);
        colFront.position = new BABYLON.Vector3(posX, 3, 14.2);
        colFront.setEnabled(true);
        colFront.getChildMeshes().forEach(mesh => mesh.checkCollisions = true);

        const colBack = firstColumnRoot.clone("colBack_" + i);
        colBack.position = new BABYLON.Vector3(posX, 3, -16.8);
        colBack.setEnabled(true);
        colBack.getChildMeshes().forEach(mesh => mesh.checkCollisions = true);
    }

    const archBaseY = 19.3;
    const wallHeight = 10;
    const archDiameter = 12;
    const colWidth = 20;
    const shift = 3;

    for (let i = 0; i < columnPositions.length - 1; i++) {
        const midX = (columnPositions[i] + columnPositions[i + 1]) / 2;
        const finalMidX = midX - shift;

        [15, -16].forEach(zPos => {
            const isLeft = zPos === 15;
            const currentWallWidth = isLeft ? colWidth + 0.8 : colWidth;
            const currentDepth = isLeft ? 20.5 : 14;
            const finalZ = isLeft ? 25.6 : -17.3;

            const wallBox = BABYLON.MeshBuilder.CreateBox("wall", {
                width: currentWallWidth, height: wallHeight, depth: currentDepth
            }, scene);
            wallBox.position = new BABYLON.Vector3(finalMidX, archBaseY + wallHeight / 2, finalZ);

            const currentArchDiameter = isLeft ? archDiameter + 0.8 : archDiameter;
            const archHole = BABYLON.MeshBuilder.CreateCylinder("archHole", {
                height: currentDepth + 0.5, diameter: currentArchDiameter
            }, scene);
            archHole.rotation.x = Math.PI / 2;
            archHole.position = new BABYLON.Vector3(finalMidX, archBaseY, finalZ);

            const wallCSG = BABYLON.CSG.FromMesh(wallBox);
            const holeCSG = BABYLON.CSG.FromMesh(archHole);
            const resultCSG = wallCSG.subtract(holeCSG);

            const finalWall = resultCSG.toMesh("finalWall", wallMaterial, scene);
            finalWall.checkCollisions = true;

            wallBox.dispose();
            archHole.dispose();
        });
    }
}

/////////////////////////////////////////////////////////////////SEPARATORE///////////////////////////////////////////////////////////////////////

export async function placeSecondColumns(scene) {
    const result = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/models/", "Columns.glb", scene);
    const firstColRoot2 = result.meshes[0];
    firstColRoot2.scaling = new BABYLON.Vector3(0.05, 0.08, 0.05);
    firstColRoot2.setEnabled(false);

    for (let i = 0; i < 7; i++) {
        const posX = 172 + i * 18;

        const colFront2 = firstColRoot2.clone("colFront2_" + i);
        colFront2.position = new BABYLON.Vector3(posX, 5, 14.2);
        colFront2.setEnabled(true);
        colFront2.getChildMeshes().forEach(mesh => mesh.checkCollisions = true);

        const colBack2 = firstColRoot2.clone("colBack2_" + i);
        colBack2.position = new BABYLON.Vector3(posX, 5, -16.8);
        colBack2.setEnabled(true);
        colBack2.getChildMeshes().forEach(mesh => mesh.checkCollisions = true);
    }
}