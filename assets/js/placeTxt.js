export function placeInfoBoards(scene, customBoards = null) {
    // Dati predefiniti per scena3 (se non vengono passati dati custom)
    const defaultBoards = [
        {
            position: new BABYLON.Vector3(-7, 5.62, -10),
            text: `L'interno è in stile neorinascimentale, a tre navate con volte a botte lunettate.
La navata centrale è più spaziosa.
Non vi sono quadri o pitture.
Nei bracci del transetto sono conservate le statue del Sacro Cuore e della Vergine Immacolata.
L'altare maggiore è a tabernacolo in colonne di marmo pompeiano che custodiscono l'immagine sacra della Madonna, restaurata dopo i numerosi strati di pittura accumulatisi nei secoli.`
        },
        {
            position: new BABYLON.Vector3(142, 3, 29),
            text: `La cripta, attualmente in restauro, conserva ancora il piccolo altare risalente alla prima costruzione della basilica, avvenuta nel 1951. 
Al suo interno è presente una zona dedicata che ospita un gruppo scultoreo rappresentante la Madonna Addolorata insieme al Cristo morto. 
Vi si trova l'altare che custodisce la statua processionale della Madonna, raffigurata nell'atto di apparire al contadino Alessandro Muzio. 
Si tratta di un'opera di manifattura leccese, molto venerata durante le celebrazioni.`
        },
        {
            position: new BABYLON.Vector3(172, 7, 0),
            text: `La Biblioteca Monastica di Santa Maria dei Miracoli è stata inaugurata il 13 novembre 2004.
Le sue origini risalgono al 1926 con la fondazione del monastero.
Oggi possiede oltre 60.000 volumi dedicati principalmente alle discipline religiose.
Comprende inoltre opere di storia, letteratura italiana e straniera, storia dell'arte e musicologia.`
        },
        {
            position: new BABYLON.Vector3(193, 11, -1),
            text: `Il fondo speciale del Cardinale Vincenzo Fagiolo nasce dal lascito del 2001.
Comprende circa 5.000 volumi tra monografie, collezioni e opuscoli.
La raccolta è dedicata soprattutto al diritto canonico e alle biografie dei santi.
Sono inoltre conservati i suoi effetti personali, oggi esposti in una sala aperta al pubblico destinata anche a conferenze e attività culturali.`
        }
    ];

    const boards = customBoards || defaultBoards;
    const createdBoards = [];

    boards.forEach((board, i) => {
        const plane = BABYLON.MeshBuilder.CreatePlane(
            "infoBoard" + i,
            { width: 7, height: 4 },
            scene
        );

        plane.position = board.position;
        plane.alwaysSelectAsActiveMesh = true;

        const texture = new BABYLON.DynamicTexture(
            "boardTexture" + i,
            { width: 2048, height: 1024 },
            scene,
            false
        );

        const ctx = texture.getContext();
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 2048, 1024);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 10;
        ctx.strokeRect(10, 10, 2028, 1004);
        ctx.fillStyle = "white";
        ctx.font = "bold 46px Arial";

        const maxWidth = 1850;
        const lineHeight = 58;
        let y = 90;
        const words = board.text.split(" ");
        let line = "";

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + " ";
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth) {
                ctx.fillText(line, 90, y);
                line = words[n] + " ";
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, 90, y);
        texture.update();

        const material = new BABYLON.StandardMaterial("boardMaterial" + i, scene);
        material.diffuseTexture = texture;
        material.emissiveColor = BABYLON.Color3.White();
        material.specularColor = BABYLON.Color3.Black();
        material.backFaceCulling = false;
        plane.material = material;

        createdBoards.push(plane);
    });

    scene.registerBeforeRender(() => {
        const camera = scene.activeCamera;
        if (!camera) return;

        createdBoards.forEach(mesh => {
            mesh.lookAt(camera.position);
            mesh.rotation.y += Math.PI;
            mesh.rotation.x = 0;
            mesh.rotation.z = 0;
        });
    });
}