import {
  initEngine,
  initCamera,
  initJump,
  initWebXR,
  createCoordDisplay,
} from "./engine.js?v=12";
import { createPainting, generateComplexVaultsAndDome, placeDoors } from "./Utils.js";

const { canvas, engine } = initEngine("renderCanvas");

const createScene = async function () {
  const scene = new BABYLON.Scene(engine);
  scene.collisionsEnabled = true;

  const originalGravity = new BABYLON.Vector3(0, -0.15, 0);
  scene.gravity = originalGravity;
  scene.clearColor = new BABYLON.Color4(0.0, 0.6, 0.2, 1.0);

  const camera = initCamera(scene, canvas);
  createCoordDisplay(scene, camera, canvas);

  const originalSpeed = camera.speed || 2;

  window.addEventListener("keydown", (event) => {
    if (event.key === "CapsLock") {
      if (scene.gravity.y < 0) {
        camera.speed = originalSpeed * 5;
        scene.gravity = new BABYLON.Vector3(0, 0, 0);
      } else {
        camera.speed = originalSpeed;
        scene.gravity = originalGravity;
      }
    }
    if (event.key.toLowerCase() === "e") camera.position.y += 0.5;
    if (event.key.toLowerCase() === "q") camera.position.y -= 0.5;
  });

  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene,
  );
  light.intensity = 0.8;

  const light1 = new BABYLON.HemisphericLight(
    "light1",
    new BABYLON.Vector3(110, 62, -10),
    scene,
  );
  light.intensity = 0.01;

    const wallColor = new BABYLON.Color3(0.96, 0.82, 0.35);
    const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
    wallMaterial.diffuseColor = wallColor;
    wallMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // niente riflessi lucidi
    wallMaterial.specularPower = 0; // ammorbidisce eventuali highlight residui
    wallMaterial.ambientColor = wallColor; // aiuta a mantenere il colore anche in ombra

    const domeMaterial = new BABYLON.StandardMaterial("domeMaterial", scene);
    domeMaterial.diffuseColor = new BABYLON.Color3(0.96, 0.94, 0.85);
    domeMaterial.specularColor = new BABYLON.Color3(0, 0, 0);

  const platformCollider = BABYLON.MeshBuilder.CreateGround(
    "ground",
    { width: 20000, height: 20000 },
    scene,
  );
  platformCollider.checkCollisions = true;
  platformCollider.isVisible = false;

  BABYLON.SceneLoader.ImportMeshAsync(
    "",
    "assets/models/",
    "floor.glb",
    scene,
  ).then((result) => {
    const floorRoot = result.meshes[0];
    if (floorRoot) {
      floorRoot.scaling = new BABYLON.Vector3(50, 1, 50);
      floorRoot.position = new BABYLON.Vector3(0, 0, 0);
    }
  });

  BABYLON.SceneLoader.ImportMeshAsync(
    "",
    "assets/models/",
    "Columns.glb",
    scene,
  ).then((result) => {
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
      colFront.getChildMeshes().forEach((mesh) => {
        mesh.checkCollisions = true;
      });

      const colBack = firstColumnRoot.clone("colBack_" + i);
      colBack.position = new BABYLON.Vector3(posX, 3, -16.8);
      colBack.setEnabled(true);
      colBack.getChildMeshes().forEach((mesh) => {
        mesh.checkCollisions = true;
      });
    }

    const archBaseY = 19.3;
    const wallHeight = 10;
    const archDiameter = 12;

    const colWidth = 20;
    const shift = 3;

    for (let i = 0; i < columnPositions.length - 1; i++) {
      const midX = (columnPositions[i] + columnPositions[i + 1]) / 2;
      const finalMidX = midX - shift;

      [15, -16].forEach((zPos) => {
        const isLeft = zPos === 15;
        const currentWallWidth = isLeft ? colWidth + 0.8 : colWidth;

        const currentDepth = isLeft ? 20.5 : 14;
        const finalZ = isLeft ? 25.6 : -17.3;

        const wallBox = BABYLON.MeshBuilder.CreateBox(
          "wall",
          { width: currentWallWidth, height: wallHeight, depth: currentDepth },
          scene,
        );
        wallBox.position = new BABYLON.Vector3(
          finalMidX,
          archBaseY + wallHeight / 2,
          finalZ,
        );

        const currentArchDiameter = isLeft ? archDiameter + 0.8 : archDiameter;

        const archHole = BABYLON.MeshBuilder.CreateCylinder(
          "archHole",
          { height: currentDepth + 0.5, diameter: currentArchDiameter },
          scene,
        );
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

    const wallHeightBox = 29;
    const wallThickness = 0.3;
    const sharedWallLength = 117;
    const wallXCenter = 17.75;

    const wallLeft = BABYLON.MeshBuilder.CreateBox(
      "wallLeft",
      { width: sharedWallLength, height: wallHeightBox, depth: wallThickness },
      scene,
    );
    wallLeft.position = new BABYLON.Vector3(wallXCenter, wallHeightBox / 2, 28); // ✅ era 36, -8
    wallLeft.material = wallMaterial;
    wallLeft.checkCollisions = true;

    const wallRight = BABYLON.MeshBuilder.CreateBox(
      "wallRight",
      { width: sharedWallLength, height: wallHeightBox, depth: wallThickness },
      scene,
    );
    wallRight.position = new BABYLON.Vector3(
      wallXCenter,
      wallHeightBox / 2,
      -23,
    );
    wallRight.material = wallMaterial;
    wallRight.checkCollisions = true;

    const extraY = 15.4;

    const wallEndRightExtra_bis = BABYLON.MeshBuilder.CreateBox(
      "wallEndRightExtra_bis",
      { width: 2.1, height: wallHeightBox + 1, depth: 55 },
      scene,
    );
    wallEndRightExtra_bis.position = new BABYLON.Vector3(76, extraY - 1, 55.2); // ✅ era 63.2, -8
    wallEndRightExtra_bis.material = wallMaterial;
    wallEndRightExtra_bis.checkCollisions = true;

    const wallEndRightExtra = BABYLON.MeshBuilder.CreateBox(
      "wallEndrRightExtra",
      { width: 3.5, height: wallHeightBox + 1, depth: 60 },
      scene,
    );
    wallEndRightExtra.position = new BABYLON.Vector3(76, extraY, -52.6);
    wallEndRightExtra.material = wallMaterial;
    wallEndRightExtra.checkCollisions = true;

    const newPerpWallLeft = BABYLON.MeshBuilder.CreateBox(
      "newPerpWallLeft",
      { width: 2.1, height: wallHeightBox + 100, depth: 80 },
      scene,
    );
    newPerpWallLeft.position = new BABYLON.Vector3(112, extraY, 82); // ✅ era 90, -8
    newPerpWallLeft.rotation.y = Math.PI / 2;
    newPerpWallLeft.material = wallMaterial;
    newPerpWallLeft.checkCollisions = true;

    const newPerpWallRight = BABYLON.MeshBuilder.CreateBox(
      "newPerpWallRight",
      { width: 2.1, height: wallHeightBox + 100, depth: 70 },
      scene,
    );
    newPerpWallRight.position = new BABYLON.Vector3(112, extraY, -76);
    newPerpWallRight.rotation.y = Math.PI / 2;
    newPerpWallRight.material = wallMaterial;
    newPerpWallRight.checkCollisions = true;

    const rectWallRight = BABYLON.MeshBuilder.CreateBox(
      "rectWallRight",
      { width: 1.6, height: 10, depth: 14 },
      scene,
    );
    rectWallRight.position = new BABYLON.Vector3(76.7, archBaseY + 5, -17.3);
    rectWallRight.material = wallMaterial;
    rectWallRight.checkCollisions = true;

    const rectWallRight2 = BABYLON.MeshBuilder.CreateBox(
      "rectWallRight2",
      { width: 1.6, height: 10, depth: 21.1 },
      scene,
    );
    rectWallRight2.position = new BABYLON.Vector3(76.7, archBaseY + 5, 25.95);
    rectWallRight2.material = wallMaterial;
    rectWallRight2.checkCollisions = true;

    const wallConnector = BABYLON.MeshBuilder.CreateBox(
      "wallConnector",
      { width: wallThickness, height: wallHeightBox + 70, depth: 80 },
      scene,
    );
    wallConnector.position = new BABYLON.Vector3(-30, wallHeightBox / 2, 6.5);
    wallConnector.material = wallMaterial;
    wallConnector.checkCollisions = true;

    const wallEndLeftExtra2 = BABYLON.MeshBuilder.CreateBox(
      "wallEndLeftExtra2",
      { width: 4.1, height: wallHeightBox + 1, depth: 55 },
      scene,
    );
    wallEndLeftExtra2.position = new BABYLON.Vector3(148, extraY, 55.2); // ✅ era 63.2, -8
    wallEndLeftExtra2.material = wallMaterial;
    wallEndLeftExtra2.checkCollisions = true;

    const wallEndRightExtra2 = BABYLON.MeshBuilder.CreateBox(
      "wallEndRightExtra2",
      { width: 4.1, height: wallHeightBox + 1, depth: 55 },
      scene,
    );
    wallEndRightExtra2.position = new BABYLON.Vector3(148, extraY, -52.6);
    wallEndRightExtra2.material = wallMaterial;
    wallEndRightExtra2.checkCollisions = true; // ✅ typo corretto

    // ✅ Materiale marmo con striature nere

    const marmoMat = new BABYLON.StandardMaterial("marmoMat", scene);
    marmoMat.diffuseColor = new BABYLON.Color3(0.9, 0.88, 0.84);
    marmoMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    marmoMat.specularPower = 64;

    const marmoTexture = new BABYLON.DynamicTexture(
      "marmoTex",
      { width: 512, height: 512 },
      scene,
    );
    const ctx = marmoTexture.getContext();
    ctx.fillStyle = "#e8e4de";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 12; i++) {
      ctx.strokeStyle = `rgba(20,20,20,${0.1 + Math.random() * 0.3})`;
      ctx.lineWidth = 1 + Math.random() * 3;
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, 0);
      ctx.bezierCurveTo(
        Math.random() * 512,
        Math.random() * 512,
        Math.random() * 512,
        Math.random() * 512,
        Math.random() * 512,
        512,
      );
      ctx.stroke();
    }
    marmoTexture.update();
    marmoMat.diffuseTexture = marmoTexture;

    const totalSteps = 5; // un gradino per ogni unità di altezza
    const totalHeight = 3; // altezza finale = altezza muro
    const startX = 146;

    // ✅ Scala lato negativo — Z da -12 a -27, sale fino a Y=30
    for (let s = 0; s < totalSteps; s++) {
      const h = (s + 1) * (totalHeight / totalSteps);
      const box = BABYLON.MeshBuilder.CreateBox(
        "stepNeg_" + s,
        {
          width: 1,
          height: h,
          depth: 15,
        },
        scene,
      );
      box.position = new BABYLON.Vector3(startX + s, h / 2, -18.5);
      box.checkCollisions = true;
      box.material = marmoMat;
    }

    // ✅ Scala lato positivo — Z da 14 a 29, sale fino a Y=30
    for (let s = 0; s < totalSteps; s++) {
      const h = (s + 1) * (totalHeight / totalSteps);
      const box = BABYLON.MeshBuilder.CreateBox(
        "stepPos_" + s,
        {
          width: 1,
          height: h,
          depth: 15,
        },
        scene,
      );
      box.position = new BABYLON.Vector3(startX + s, h / 2, 21.5);
      box.checkCollisions = true;
      box.material = marmoMat;
    }

    // ✅ Materiale marmo grigio con striature bianche
    const grayMarmoMat = new BABYLON.StandardMaterial("grayMarmoMat", scene);
    grayMarmoMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    grayMarmoMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    grayMarmoMat.specularPower = 64;

    const grayMarmoTexture = new BABYLON.DynamicTexture(
      "grayMarmoTex",
      { width: 512, height: 512 },
      scene,
    );
    const ctxGray = grayMarmoTexture.getContext();
    ctxGray.fillStyle = "#c0c0c0";
    ctxGray.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 12; i++) {
      ctxGray.strokeStyle = `rgba(255,255,255,${0.1 + Math.random() * 0.4})`;
      ctxGray.lineWidth = 1 + Math.random() * 3;
      ctxGray.beginPath();
      ctxGray.moveTo(Math.random() * 512, 0);
      ctxGray.bezierCurveTo(
        Math.random() * 512,
        Math.random() * 512,
        Math.random() * 512,
        Math.random() * 512,
        Math.random() * 512,
        512,
      );
      ctxGray.stroke();
    }
    grayMarmoTexture.update();
    grayMarmoMat.diffuseTexture = grayMarmoTexture;

    const hexagon = BABYLON.MeshBuilder.CreateCylinder(
      "hexagon",
      {
        height: 7,
        diameter: 8, // ✅ era 3, ora 5
        tessellation: 6,
      },
      scene,
    );
    hexagon.position = new BABYLON.Vector3(147, 2.5, 11); // ✅ era 144, ora 147
    hexagon.checkCollisions = true;
    hexagon.material = grayMarmoMat;

    const hexagonMirror = BABYLON.MeshBuilder.CreateCylinder(
      "hexagonMirror",
      {
        height: 7,
        diameter: 8,
        tessellation: 6,
      },
      scene,
    );
    hexagonMirror.position = new BABYLON.Vector3(147, 2.5, -9); // ✅ speculare rispetto a Z=11
    hexagonMirror.checkCollisions = true;
    hexagonMirror.material = grayMarmoMat;

    BABYLON.SceneLoader.ImportMeshAsync(
      "",
      "assets/models/",
      "floor.glb",
      scene,
    ).then((result) => {
      const raisedFloor = result.meshes[0];
      raisedFloor.scaling = new BABYLON.Vector3(19, 0.5, 19);
      raisedFloor.position = new BABYLON.Vector3(238.04 + 40, 3, -1.5);
      raisedFloor.name = "raisedFloor";
    });

    // ✅ Collider invisibile per il pavimento principale
    const raisedFloorCollider = BABYLON.MeshBuilder.CreateBox(
      "raisedFloorCollider",
      {
        width: 112,
        height: 0.5,
        depth: 59,
      },
      scene,
    );
    raisedFloorCollider.position = new BABYLON.Vector3(207, 3, -1.5);
    raisedFloorCollider.isVisible = false;
    raisedFloorCollider.checkCollisions = true;

    // ✅ Scale centrali tra gli esagoni
    for (let s = 0; s < totalSteps; s++) {
      const h = (s + 1) * (totalHeight / totalSteps);
      const box = BABYLON.MeshBuilder.CreateBox(
        "stepCenter_" + s,
        {
          width: 1,
          height: h,
          depth: 20,
        },
        scene,
      );
      box.position = new BABYLON.Vector3(startX + s, h / 2, 1);
      box.checkCollisions = true;
      box.material = marmoMat;
    }

    // ✅ Scale laterali Z negativo
    const totalStepsSide = 10;
    const totalHeightSide = 4;
    const startZ = -36;
    const spanX = 145 - 70;

    for (let s = 0; s < totalStepsSide; s++) {
      const h = (s + 1) * (totalHeightSide / totalStepsSide);
      const box = BABYLON.MeshBuilder.CreateBox(
        "stepSide_" + s,
        {
          width: spanX,
          height: h,
          depth: 1,
        },
        scene,
      );
      box.position = new BABYLON.Vector3(76 + spanX / 2, h / 2, startZ - s);
      box.checkCollisions = true;
      box.material = marmoMat;
    }

    BABYLON.SceneLoader.ImportMeshAsync(
      "",
      "assets/models/",
      "floor.glb",
      scene,
    ).then((result) => {
      const sideFloor = result.meshes[0];
      sideFloor.scaling = new BABYLON.Vector3(5, 0.5, 5);
      sideFloor.position = new BABYLON.Vector3(
        100,
        4,
        startZ - totalStepsSide - 50.2,
      );
      sideFloor.name = "sideFloor";
    });

    // ✅ Collider invisibile per il pavimento laterale
    const sideFloorCollider = BABYLON.MeshBuilder.CreateBox(
      "sideFloorCollider",
      {
        width: 90,
        height: 0.5,
        depth: 40,
      },
      scene,
    );
    sideFloorCollider.position = new BABYLON.Vector3(
      110.5,
      4,
      startZ - totalStepsSide - 19,
    );
    sideFloorCollider.isVisible = false;
    sideFloorCollider.checkCollisions = true;

    // ✅ Muri perpendicolari
    const perpWallTop = BABYLON.MeshBuilder.CreateBox(
      "perpWallTop",
      {
        width: 104,
        height: wallHeightBox + 1,
        depth: wallThickness + 0.2,
      },
      scene,
    );
    perpWallTop.position = new BABYLON.Vector3(148 + 104 / 2, extraY, 28.1);
    perpWallTop.material = wallMaterial;
    perpWallTop.checkCollisions = true;

    const perpWallTop1 = BABYLON.MeshBuilder.CreateBox(
      "perpWallTop1",
      {
        width: 104,
        height: wallHeightBox + 1,
        depth: wallThickness + 0.2,
      },
      scene,
    );
    perpWallTop1.position = new BABYLON.Vector3(148 + 104 / 2, extraY, -25.4);
    perpWallTop1.material = wallMaterial;
    perpWallTop1.checkCollisions = true;

    // ✅ Muro di collegamento
    const connectorWall = BABYLON.MeshBuilder.CreateBox(
      "connectorWall",
      {
        width: 0.8,
        height: wallHeightBox + 100,
        depth: 53.5 + 30,
      },
      scene,
    );
    connectorWall.position = new BABYLON.Vector3(
      252,
      extraY,
      (28.1 + -25.4) / 2,
    );
    connectorWall.material = wallMaterial;
    connectorWall.checkCollisions = true;

    // ✅ Colonne replicate — scaling Y ripristinato a 0.08, stesso delle originali
    BABYLON.SceneLoader.ImportMeshAsync(
      "",
      "assets/models/",
      "Columns.glb",
      scene,
    ).then((result) => {
      const firstColRoot2 = result.meshes[0];
      firstColRoot2.scaling = new BABYLON.Vector3(0.05, 0.08, 0.05); // ✅ ripristinato
      firstColRoot2.setEnabled(false);

      for (let i = 0; i < 7; i++) {
        const posX = 172 + i * 18;

        const colFront2 = firstColRoot2.clone("colFront2_" + i);
        colFront2.position = new BABYLON.Vector3(posX, 5, 14.2);
        colFront2.setEnabled(true);
        colFront2.getChildMeshes().forEach((mesh) => {
          mesh.checkCollisions = true;
        });

        const colBack2 = firstColRoot2.clone("colBack2_" + i);
        colBack2.position = new BABYLON.Vector3(posX, 5, -16.8);
        colBack2.setEnabled(true);
        colBack2.getChildMeshes().forEach((mesh) => {
          mesh.checkCollisions = true;
        });
      }
    });

    // ✅ Archi per le nuove colonne — archBaseY2 alzato, diametro ridotto
    const archBaseY2 = 22; // ✅ era 20.25, alzato
    const newColumnPositions = [];
    for (let i = 0; i < 7; i++) {
      newColumnPositions.push(172 + i * 18); // ✅ allineato a posX delle colonne
    }

    for (let i = 0; i < newColumnPositions.length - 1; i++) {
      const midX = (newColumnPositions[i] + newColumnPositions[i + 1]) / 2;
      const finalMidX = midX - shift;

      [15, -16].forEach((zPos) => {
        const isLeft = zPos === 15;
        const currentWallWidth = isLeft ? colWidth + 0.8 : colWidth;
        const currentDepth = isLeft ? 20.5 : 14;
        const finalZ = isLeft ? 25.6 : -17.3;

        const wallBox2 = BABYLON.MeshBuilder.CreateBox(
          "wall2_" + i + zPos,
          {
            width: currentWallWidth,
            height: wallHeight,
            depth: currentDepth,
          },
          scene,
        );
        wallBox2.position = new BABYLON.Vector3(
          finalMidX,
          archBaseY2 + wallHeight / 2,
          finalZ,
        );

        // ✅ Diametro arco ridotto
        const currentArchDiameter = isLeft ? 9 : 8;

        const archHole2 = BABYLON.MeshBuilder.CreateCylinder(
          "archHole2_" + i + zPos,
          {
            height: currentDepth + 0.5,
            diameter: currentArchDiameter,
          },
          scene,
        );
        archHole2.rotation.x = Math.PI / 2;
        archHole2.position = new BABYLON.Vector3(finalMidX, archBaseY2, finalZ);

        const wallCSG2 = BABYLON.CSG.FromMesh(wallBox2);
        const holeCSG2 = BABYLON.CSG.FromMesh(archHole2);
        const resultCSG2 = wallCSG2.subtract(holeCSG2);

        const finalWall2 = resultCSG2.toMesh(
          "finalWall2_" + i + zPos,
          wallMaterial,
          scene,
        );
        finalWall2.checkCollisions = true;

        wallBox2.dispose();
        archHole2.dispose();
      });
    }

    // ✅ Riempimento spazi vuoti tra archi e muro — da X=147 a X=166, Z front e back
    const fillHeight = wallHeightBox - (archBaseY + wallHeight); // altezza da colmare
    const fillStartY = archBaseY + wallHeight; // parte dalla cima degli archi

    for (let i = 0; i < columnPositions.length - 1; i++) {
      const midX = (columnPositions[i] + columnPositions[i + 1]) / 2;
      const finalMidX = midX - shift;

      [25.6, -17.3].forEach((finalZ) => {
        const currentDepth = finalZ === 25.6 ? 20.5 : 14;

        const fillBox = BABYLON.MeshBuilder.CreateBox(
          "fillBox_" + i + finalZ,
          {
            width: colWidth,
            height: Math.abs(fillHeight),
            depth: currentDepth,
          },
          scene,
        );
        fillBox.position = new BABYLON.Vector3(
          finalMidX,
          fillStartY + Math.abs(fillHeight) / 2,
          finalZ,
        );
        fillBox.material = wallMaterial;
        fillBox.checkCollisions = true;
      });
    }

    // ✅ Riempimento gap tra muro laterale e archi — X da 148 a 167
    const gapFill = BABYLON.MeshBuilder.CreateBox(
      "gapFill",
      {
        width: 19, // da X=148 a X=167
        height: wallHeightBox, // stessa altezza dei muri
        depth: wallThickness + 0.2,
      },
      scene,
    );
    gapFill.position = new BABYLON.Vector3(
      148 + 19 / 2, // centro X = 157.5
      wallHeightBox / 2,
      28.1, // stessa Z del muro perpendicolare superiore
    );
    gapFill.material = wallMaterial;
    gapFill.checkCollisions = true;

    const gapFill2 = BABYLON.MeshBuilder.CreateBox(
      "gapFill2",
      {
        width: 19,
        height: wallHeightBox,
        depth: wallThickness + 0.2,
      },
      scene,
    );
    gapFill2.position = new BABYLON.Vector3(
      148 + 19 / 2,
      wallHeightBox / 2,
      -25.4, // stessa Z del muro perpendicolare inferiore
    );
    gapFill2.material = wallMaterial;
    gapFill2.checkCollisions = true;

    const boxFill = BABYLON.MeshBuilder.CreateBox(
      "boxFill",
      {
        width: 22,
        height: 10,
        depth: 20,
      },
      scene,
    );
    boxFill.position = new BABYLON.Vector3(
      157, // centro X tra 148 e 167
      27,
      25.41, // centro Z tra -25.4 e 28.1
    );
    boxFill.material = wallMaterial;
    boxFill.checkCollisions = true;

    const boxFill2 = BABYLON.MeshBuilder.CreateBox(
      "boxFill2",
      {
        width: 22,
        height: 10,
        depth: 20,
      },
      scene,
    );
    boxFill2.position = new BABYLON.Vector3(
      157, // centro X tra 148 e 167
      27,
      -20.39, // centro Z tra -25.4 e 28.1
    );
    boxFill2.material = wallMaterial;
    boxFill2.checkCollisions = true;
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////77

    generateComplexVaultsAndDome(scene, domeMaterial);

    // ✅ Quadri
    // In cima al file (dentro createScene)

    // 1. Configura qui i tuoi quadri: posizione e percorso immagine
    const gallery = [
      { pos: new BABYLON.Vector3(-8, 12, -22), img: "percorso/immagine1.jpg" },
      { pos: new BABYLON.Vector3(13, 12, -22), img: "percorso/immagine2.jpg" },
      { pos: new BABYLON.Vector3(50, 12, -22), img: "percorso/immagine3.jpg" },
    ];

    // 2. Questo ciclo crea tutto automaticamente
    gallery.forEach((item, index) => {
      createPainting(scene, item.pos, "quadro_" + index, item.img);
    });



    placeDoors(scene);
  });

  return scene;
};

createScene().then((scene) => {
  engine.runRenderLoop(() => scene.render());
});
