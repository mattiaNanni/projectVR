

export function tagliaVolteDentroCupola(scene, domeCenter, vaultsArray, wallMaterial) {
    // 1. Creiamo il volume di taglio (la sfera interna alla cupola)
    // Non usiamo la mesh della cupola renderizzata, usiamo una sfera geometria pura
    const cutterSphere = BABYLON.MeshBuilder.CreateSphere("cutterSphere", { diameter: 82, segments: 32 }, scene);
    cutterSphere.position = domeCenter;
    
    // Il CSG richiede una mesh "pulita"
    const cutterCSG = BABYLON.CSG.FromMesh(cutterSphere);

    vaultsArray.forEach((vault) => {
        if (vault) {
            // FONDAMENTALE: Senza questo, il CSG non vede la posizione reale della mesh
            vault.bakeCurrentTransformIntoVertices();
            
            // Creiamo il CSG della volta
            const vaultCSG = BABYLON.CSG.FromMesh(vault);
            
            // Sottraiamo il volume della sfera dalla volta
            const resultCSG = vaultCSG.subtract(cutterCSG);
            
            // Creiamo la nuova mesh tagliata
            const newVault = resultCSG.toMesh(vault.name + "_cut", null, scene);
            
            // Applichiamo le proprietà
            newVault.material = wallMaterial;
            newVault.checkCollisions = true;
            
            // Distruggiamo la vecchia volta
            vault.dispose();
        }
    });

    // Pulizia del cutter
    cutterSphere.dispose();
}

export function findValidMesh(node) {
    if (node.geometry !== null && node.getTotalVertices() > 0) {
        return node;
    }
    const children = node.getChildren(); // .getChildren() invece di getChildMeshes() per sicurezza
    for (const child of children) {
        const found = findValidMesh(child);
        if (found) return found;
    }
    return null;
}

export function tagliaCupolaConVaults(scene, rootNode, vaultsArray, wallMaterial) {
    let sourceMesh = findValidMesh(rootNode);

    if (!sourceMesh) return rootNode;

    sourceMesh.computeWorldMatrix(true);
    sourceMesh.makeGeometryUnique(); 
    sourceMesh.bakeCurrentTransformIntoVertices();

    let currentDome = sourceMesh.clone("Dome_CSG_Ready");
    sourceMesh.setEnabled(false);

    vaultsArray.forEach((vaultMesh, index) => {
        if (!vaultMesh) return;

        // --- CORREZIONE: CLONIAMO E INGRANDIAMO ---
        // Creiamo una versione temporanea leggermente più grande per evitare facce co-planari
        let tempVault = vaultMesh.clone("tempVault_" + index);
        tempVault.scaling.scaleInPlace(1.005); // Ingrandiamo del 0.5%
        tempVault.bakeCurrentTransformIntoVertices();
        tempVault.computeWorldMatrix(true);
        // ------------------------------------------

        try {
            const domeCSG = BABYLON.CSG.FromMesh(currentDome);
            const vaultCSG = BABYLON.CSG.FromMesh(tempVault); // Usiamo la versione ingrandita

            const resultCSG = domeCSG.subtract(vaultCSG);
            
            const newDome = resultCSG.toMesh("dome_cut_" + index, wallMaterial, scene);
            
            newDome.checkCollisions = true;
            newDome.computeNormals();
            newDome.bakeCurrentTransformIntoVertices();

            currentDome.dispose();
            currentDome = newDome;
            
            tempVault.dispose(); // Puliamo la mesh temporanea
        } catch (e) {
            console.error("Errore CSG sul vault " + index + ":", e);
            tempVault.dispose();
        }
    });

    return currentDome;
}

function rebuildMeshForCSG(sourceMesh, scene) {
    // 1. Estraiamo i dati grezzi dalla mesh (vertici, indici, normali, UV)
    const vertexData = BABYLON.VertexData.ExtractFromMesh(sourceMesh);
    
    // 2. Creiamo una mesh standard di Babylon totalmente nuova
    const newMesh = new BABYLON.Mesh("cleanMesh", scene);
    
    // 3. Applichiamo i dati alla nuova mesh
    vertexData.applyToMesh(newMesh);
    
    // 4. Copiamo le proprietà essenziali
    newMesh.material = sourceMesh.material;
    newMesh.position = sourceMesh.getAbsolutePosition();
    newMesh.rotationQuaternion = sourceMesh.absoluteRotationQuaternion;
    newMesh.scaling = sourceMesh.scaling;
    
    return newMesh;
}



// vaultUtils.js
export function createSafeVault(name, torusParams, innerParams, boxParams, position, rotation, scaling, scene, wallMaterial) {
    // Create outer and inner cylinders
    const vaultTorus = BABYLON.MeshBuilder.CreateCylinder("vaultOuter_" + name, torusParams, scene);
    const vaultInner = BABYLON.MeshBuilder.CreateCylinder("vaultInner_" + name, innerParams, scene);

    // Apply rotations and scaling[cite: 1]
    vaultTorus.rotation = rotation;
    vaultInner.rotation = rotation;
    if (scaling) {
        vaultTorus.scaling = scaling;
        vaultInner.scaling = scaling;
    }
    vaultTorus.position = position;
    vaultInner.position = position;
    
    // Bake transforms[cite: 1]
    vaultTorus.bakeCurrentTransformIntoVertices();
    vaultInner.bakeCurrentTransformIntoVertices();

    // Perform CSG subtraction for the cavity[cite: 1]
    const outerCSG = BABYLON.CSG.FromMesh(vaultTorus);
    const innerCSG = BABYLON.CSG.FromMesh(vaultInner);
    const vaultCSG = outerCSG.subtract(innerCSG);

    // Create and subtract the cutting box[cite: 1]
    const cutBox = BABYLON.MeshBuilder.CreateBox("cutBox_" + name, boxParams, scene);
    cutBox.position = new BABYLON.Vector3(position.x, position.y - 20, position.z); // Adjust Y offset as per source
    const cutCSG = BABYLON.CSG.FromMesh(cutBox);
    const finalVaultCSG = vaultCSG.subtract(cutCSG);

    // Finalize mesh[cite: 1]
    const finalVault = finalVaultCSG.toMesh(name, wallMaterial, scene);
    finalVault.checkCollisions = true;
    finalVault.computeWorldMatrix(true);
    finalVault.bakeCurrentTransformIntoVertices();

    // Cleanup temporary meshes[cite: 1]
    vaultTorus.dispose();
    vaultInner.dispose();
    cutBox.dispose();

    return finalVault;
}

export function tagliaCupolaConBox(scene, domeMesh, position, size) {
    // 1. Crea il cutter
    const cutterBox = BABYLON.MeshBuilder.CreateBox("cutterBox", {
        width: size.x,
        height: size.y,
        depth: size.z
    }, scene);
    
    cutterBox.position = position;
    
    // 2. PREPARAZIONE FORZATA DELLA GEOMETRIA
    // bakeCurrentTransformIntoVertices sposta i vertici fisicamente, 
    // quindi azzeriamo la posizione per non creare offset strani
    cutterBox.bakeCurrentTransformIntoVertices();
    
    // Forza la cupola ad avere vertici condivisi (spesso risolve i buchi invisibili)
    domeMesh.forceSharedVertices();
    domeMesh.bakeCurrentTransformIntoVertices();

    // 3. ESECUZIONE CSG
    const domeCSG = BABYLON.CSG.FromMesh(domeMesh);
    const boxCSG = BABYLON.CSG.FromMesh(cutterBox);
    
    // Esegui la sottrazione
    const resultCSG = domeCSG.subtract(boxCSG);

    // 4. CREAZIONE RISULTATO
    const material = domeMesh.material;
    const checkCollisions = domeMesh.checkCollisions;
    
    const newDome = resultCSG.toMesh("domeMesh", material, scene);
    newDome.checkCollisions = checkCollisions;
    newDome.material = material;
    newDome.material.backFaceCulling = false;

    // 5. PULIZIA
    domeMesh.dispose();
    cutterBox.dispose();

    return newDome;
}