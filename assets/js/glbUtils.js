export function placeAltar(scene, position = new BABYLON.Vector3(188, 6, 2), rotationY = 0, width = 4, depth = 2) {
    // Granito stile Minecraft — grigio medio chiaro
    const graniteMat = new BABYLON.StandardMaterial("graniteMat_" + position.x, scene);
    graniteMat.diffuseColor = new BABYLON.Color3(0.6, 0.55, 0.52); // ✅ rosa/grigio caldo come il granito Minecraft
    graniteMat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    graniteMat.specularPower = 64;

    const graniteTexture = new BABYLON.DynamicTexture("graniteTex_" + position.x, { width: 512, height: 512 }, scene);
    const ctx = graniteTexture.getContext();
    ctx.fillStyle = "#9e8e88"; // ✅ base rosata/grigia stile Minecraft
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 30; i++) {
        ctx.strokeStyle = `rgba(80,60,60,${0.05 + Math.random() * 0.1})`;
        ctx.lineWidth = 0.5 + Math.random() * 2;
        ctx.beginPath();
        ctx.moveTo(Math.random() * 512, 0);
        ctx.bezierCurveTo(
            Math.random() * 512, Math.random() * 512,
            Math.random() * 512, Math.random() * 512,
            Math.random() * 512, 512
        );
        ctx.stroke();
    }
    graniteTexture.update();
    graniteMat.diffuseTexture = graniteTexture;

    //  Scala 5, altezza abbassata di 2
    const scaledWidth = width * 2;   //  era 5, ora 3
    const scaledDepth = depth * 2;   //  era 5, ora 3
    const scaledHeight = (1.2 * 3); //  scala 3 poi -3
    const scaledTopHeight = (0.2 * 5) - 2 < 0.3 ? 0.3 : (0.2 * 5);

    const altarBase = BABYLON.MeshBuilder.CreateBox("altarBase_" + position.x, {
        width: scaledWidth,
        height: scaledHeight,
        depth: scaledDepth
    }, scene);
    altarBase.position = new BABYLON.Vector3(position.x, position.y + scaledHeight / 2, position.z);
    altarBase.rotation.y = rotationY;
    altarBase.material = graniteMat;
    altarBase.checkCollisions = true;

    const altarTop = BABYLON.MeshBuilder.CreateBox("altarTop_" + position.x, {
        width: scaledWidth - 0.5,
        height: scaledTopHeight,
        depth: scaledDepth - 0.2
    }, scene);
    altarTop.position = new BABYLON.Vector3(position.x, position.y + scaledHeight + scaledTopHeight / 2, position.z);
    altarTop.rotation.y = rotationY;
    altarTop.material = graniteMat;
    altarTop.checkCollisions = true;
}

export async function createGlass(scene, position = new BABYLON.Vector3(-23, 42, 10.3)) {
    const result = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/models/", "glass.glb", scene);
    const glassRoot = result.meshes[0];
    
    glassRoot.position = position;
    
    // Scala raddoppiata e rotazione 90 gradi
    glassRoot.scaling = new BABYLON.Vector3(2, 2, 2);
    glassRoot.rotationQuaternion = null;
    glassRoot.rotation.y = Math.PI / 2;
    if (glassRoot.position.x > 200) glassRoot.rotation.y = -Math.PI/2;
    
    //  Luce omnidirezionale (PointLight)
    const glassLight = new BABYLON.PointLight("glassLight", position, scene);
    glassLight.intensity = 0.2;
    
    glassRoot.getChildMeshes().forEach((mesh) => {
        mesh.checkCollisions = true;
    });

    return glassRoot;
}

export async function placeOrgan(scene, position = new BABYLON.Vector3(-96.4, 0, 151)) {
    const result = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/models/", "pipe_organ.glb", scene);
    const organRoot = result.meshes[0];
    
    organRoot.position = position;
    organRoot.rotationQuaternion = null;
    organRoot.rotation.y = Math.PI + Math.PI / 5;
    organRoot.scaling = new BABYLON.Vector3(12, 12, 12);
    
    organRoot.getChildMeshes().forEach(mesh => {
        mesh.checkCollisions = true;
    });

    return organRoot;
}


export async function placeWoodDoor(scene, position = new BABYLON.Vector3(29, 0, -22.79)) {
    const result = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/models/", "wood_door.glb", scene);
    const doorRoot = result.meshes[0];
    
    doorRoot.position = position;
    doorRoot.rotationQuaternion = null;
    doorRoot.rotation.y = 0;
    
    doorRoot.getChildMeshes().forEach(mesh => {
        mesh.checkCollisions = true;
    });

    return doorRoot;
}