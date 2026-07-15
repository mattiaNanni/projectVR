import { initEngine, initCamera, initJump, initWebXR, createPortal, createInfoPanel, createCoordDisplay } from "./engine.js?v=12";
import { placeInfoBoards } from "./placeTxt.js?v=3";
import { placeInfoImages } from "./imgUtils.js?v=3";

const { canvas, engine } = initEngine("renderCanvas");

const createScene = async function () {
    const scene = new BABYLON.Scene(engine);
    scene.collisionsEnabled = true;
    scene.gravity = new BABYLON.Vector3(0, -0.15, 0);

    const camera = initCamera(scene, canvas);

    const photoDome = new BABYLON.PhotoDome(
        "testo_sfondo",
        "assets/textures/santuario_jpeg.jpg",
        { resolution: 32, size: 1000 },
        scene
    );

    createCoordDisplay(scene, camera, canvas);

    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 4000000, height: 4000000 }, scene);
    ground.checkCollisions = true;
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.alpha = 0;
    ground.material = groundMaterial;

    const { isJumpingRef, jumpVelocityRef, jumpForce } = initJump(scene, camera);

    await initWebXR(scene, ground, isJumpingRef, jumpVelocityRef, jumpForce);

    createPortal(scene, camera, "scena3.html", new BABYLON.Vector3(0, 3, 5));

    const ambientSound = new BABYLON.Sound(
        "ambient",
        "assets/audio/ambient.mp3",  // ← metti qui il path del tuo file audio
        scene,
        null,
        {
            loop: true,       // si ripete in loop
            autoplay: true,   // parte automaticamente
            volume: 0.1       // volume molto basso (0.0 - 1.0)
        }
    );

    // ✅ Array con i tuoi nuovi testi e coordinate
const mieiTesti = [
    {
        position: new BABYLON.Vector3(-13, 3, 13),
        text: `La facciata è ispirata in parte alla basilica di Santa Maria Novella di Firenze, con la base divisa dal resto del corpo da cornicione marcapiano, e ripartita verticalmente in tre settori da quattro coppie di colonne a capitello ionico, con tre portali architravati, di cui il maggiore è quello centrale; oltre il cornicione la facciata si restringe al solo corpo centrale, con due coppie di colonne ioniche che inquadrano tre finestre centrali ad arco a tutto sesto, di cui sempre il finestrone maggiore è quello centrale, per terminare con l'architrave a timpano triangolare. La cupola sorge al centro del transetto. Il portone in bronzo è caratterizzato da rilievi che raffigurano l’apparizione della madonna.`
    },
    {
        position: new BABYLON.Vector3(-5, 3, -14),
        text: `La Basilica - Santuario della Madonna dei Miracoli, si erge a Miracoli, frazione di Casalbordino (CH), ed ha origine dall’apparizione della Beata Vergine Maria ad un anziano di Pollutri, Alessandro Muzio, avvenuta nel lontano 11 giugno 1576. L’apparizione è enunciata in un documento scritto da don Giuseppe Muzio, figlio di Alessandro Muzio. Il documento è conservato oggi nell’archivio parrocchiale di Pollutri e attesta: che una terribile tempesta di grandine si era scatenata su tutto il territorio di Casalbordino, devastandone i raccolti. Il giorno successivo, passata la tempesta, Alessandro si recò nel territorio di Casalbordino per controllare le condizioni del campo coltivato che possedeva. Quando arrivò nel punto in cui sorge oggi il Santuario, mentre recitava il rosario, sentì la campana della chiesa che annunciava la consacrazione dell’Eucarestia e si inginocchiò in adorazione. Proprio in quel momento gli apparve la Madonna. La Vergine parlò all’uomo rimasto in ginocchio ai suoi piedi con la corona del rosario fra le mani. La Madonna indicò nel peccato degli uomini la causa del disastroso temporale del giorno precedente, assicurò il vecchio che il suo campo era stato risparmiato dalla grandine e gli affidò il messaggio per il parroco di Pollutri, affinché predicasse il rispetto del 3° Comandamento: ricordati di santificare la festa.`
    },
    {
        position: new BABYLON.Vector3(13, 3, -1),
        text: `Un dipinto a tempera su tela di circa 10 m di lunghezza e 4 m d'altezza, intitolato Pellegrinaggio a Casalbordino (o gli Storpi), presentato da Francesco Paolo Michetti alla Esposizione Universale di Parigi del 1900 e attualmente conservato al Museo Michetti a Francavilla al mare, descrive la processione degli storpi che si svolgeva all'epoca a Casalbordino, soffermandosi sui particolari pietosi dei protagonisti, delle loro piaghe e delle loro sofferenze mentre due buoi, simboleggianti l'indifferenza della natura per le sofferenze umane, sovrastano imperturbabili la scena.`
    },
    {
        position: new BABYLON.Vector3(9, 3, 3),
        text: `Le origini della chiesa risalgono all'apparizione mariana che avrebbe avuto nel 1576 il contadino Alessandro Muzio, dopo una terribile tempesta. Dopo di ciò, ben presto si sviluppò una devozione popolare verso questa apparizione, e nel luogo, in un vasto campo a nord di Casalbordino, venne costruita la prima cappella, ampliata nel 1614, conservando l'altare originale, con l'affresco della Vergine dei Miracoli col Muzio inginocchiato. Il verificarsi di vari avvenimenti portentosi ben presto portò la popolazione a invocare l'intercessione della "Madonna di Casalbordino" per ottenere miracoli. La stessa località Pian del Lago con la cappella divenne "Madonna dei Miracoli", e la devozione si sparse non solo nel circondario vastese, ma in tutto l'Abruzzo.`
    },
    {
        position: new BABYLON.Vector3(9, 3, 24),
        text: `Le autorità decisero di costruire un tempio maggiore per accogliere i pellegrini, progettato nel 1824 dall'architetto Torresi, che concepì l'edificio con la pianta a croce greca e mattoni a vista senza intonacatura; l'altare maggiore della Madonna tuttavia rimase sempre lo stesso con l'affresco, e venne rivestito in muratura. Questa chiesa, dotata di una piccola cupola ottagonale, è quella che si vede in fotografie storiche del primo Novecento, e anche in un filmato dei primi anni 1920 prodotto dalla Teatina Film, e ovviamente fu quella visitata dal poeta Gabriele D'Annunzio nel 1889, che la descrisse in alcune lettere a Barbara Leoni, e nel romanzo Trionfo della morte (1894).`
    }
];

// ✅ Chiamata che passa i dati a placeInfoBoards
placeInfoBoards(scene, mieiTesti);

const mieImmagini = [
    { position: new BABYLON.Vector3(20, 3, -8), url: "assets/img/affresco.jpg" },
    { position: new BABYLON.Vector3(11, 3, -28), url: "assets/img/chiesaNotturna.jpg" },
    { position: new BABYLON.Vector3(-4, 3, -25), url: "assets/img/vecchia_chiesa.jpg" }
];

// ✅ Chiamata alla funzione per piazzare le immagini
placeInfoImages(scene, mieImmagini);

    return scene;
};

// ✅ Semplice — niente secondo xrHelper
createScene().then((scene) => {
    engine.runRenderLoop(() => scene.render());
});