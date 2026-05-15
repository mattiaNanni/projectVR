const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;

    // 1. Creazione della Camera
    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 2, -10), scene);

    //background
    const photoDome = new BABYLON.PhotoDome(
    "testo_sfondo",
    "assets/textures/geralt.jpg", // Percorso della tua immagine
    {
        resolution: 32,
        size: 1000 // Dimensione della sfera
    },
    scene
);
    
    // 2. Mappatura tasti WASD
    // I codici numerici corrispondono alle lettere sulla tastiera
    camera.keysUp.push(87);    // W
    camera.keysDown.push(83);  // S
    camera.keysLeft.push(65);  // A
    camera.keysRight.push(68); // D

    //Mappatura asse verticale
    camera.keysDownward.push(81); // Q
    camera.keysUpward.push(69);   // E

    // 3. Attivazione controlli
    camera.attachControl(canvas, true);

    // 4. IL TRUCCO: VINCOLO DEL MOVIMENTO
    // Questo impedisce alla camera di salire/scendere in base all'inclinazione dello sguardo
    //camera.applyGravity = true; 
    camera.checkCollisions = true;

    // Se vuoi muoverti dritto senza attivare la gravità fisica di Babylon,
    //questo comando blocca l'asse Y durante lo spostamento con WASD:
    camera.mapDirectionalInputToWorld = true;

    // 5. Configurazione velocità (opzionale)
    camera.speed = 0.5;
    camera.angularSensibility = 1000;

    // Aggiungiamo un terreno e una luce per vedere il movimento
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
    ground.checkCollisions = true;
    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2}, scene);
    sphere.position.y = 1;

    // Aggiungi qualche cubo per avere punti di riferimento
    for(let i=0; i<5; i++) {
        let box = BABYLON.MeshBuilder.CreateBox("box"+i, {size: 2}, scene);
        box.position.x = i * 4;
        box.position.y = 1;
    }

    return scene;
};

const scene = createScene();

engine.runRenderLoop(function () {
    scene.render();
});

window.addEventListener("resize", function () {
    engine.resize();
});
