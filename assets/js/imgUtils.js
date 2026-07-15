export function placeInfoImages(scene, imageList = null) {

    // Se non vengono passate immagini, usa una lista predefinita
    const defaultImages = [
        { position: new BABYLON.Vector3(29, 3, 2), url: "assets/img/ingresso.png" },
        { position: new BABYLON.Vector3(131, 3, -22), url: "assets/img/statua_madonna.jpg" },
        { position: new BABYLON.Vector3(141, 3, 2), url: "assets/img/altare.png" },
        { position: new BABYLON.Vector3(164, 7, 21), url: "assets/img/cripta.png" },
        { position: new BABYLON.Vector3(85, 3, 45), url: "assets/img/organo.png" },
        { position: new BABYLON.Vector3(92, 3, 11), url: "assets/img/corridoio.png" },
        { position: new BABYLON.Vector3(183, 7, 10), url: "assets/img/sala_fagiolo.jpg" }
    ];

    const images = imageList || defaultImages;
    const createdImages = [];

    images.forEach((imgData, i) => {
        const plane = BABYLON.MeshBuilder.CreatePlane(
            "infoImage" + i,
            { width: 8, height: 6 },
            scene
        );

        plane.position = imgData.position;
        plane.alwaysSelectAsActiveMesh = true;

        const material = new BABYLON.StandardMaterial("imageMaterial" + i, scene);
        const texture = new BABYLON.Texture(imgData.url, scene);
        
        material.diffuseTexture = texture;
        material.emissiveColor = BABYLON.Color3.White();
        material.backFaceCulling = false;
        plane.material = material;

        createdImages.push(plane);
    });

    scene.registerBeforeRender(() => {
        const camera = scene.activeCamera;
        if (!camera) return;

        createdImages.forEach(mesh => {
            mesh.lookAt(camera.position);
            mesh.rotation.y += Math.PI;
            mesh.rotation.x = 0;
            mesh.rotation.z = 0;
        });
    });
}