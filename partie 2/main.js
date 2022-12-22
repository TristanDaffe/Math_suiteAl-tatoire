function init () {
    nbStationsOptimal(2, 43,     600,      4, 75, 74, 65537)
//nbStationsMin, nbStationsMax, tempsSimu, x0, a, c,  m
}

window.onload = init;
/*----------------------------------------------*/
/*                   Constantes                 */
/*----------------------------------------------*/

// cout présence dans le système
const COUT_1H_ORDINAIRE = 25,
    COUT_1H_PRIORITAIRE = 40;

// cout d'occupation d'une station
const  COUT_1H_STATION_PRIORITÈRE = 75,
    COUT_1H_STATION_ORDINAIRE = 50,
    COUT_1H_STATION_INOCCUPÉE = 20;

// client prioriaire
const  COUT_TRANSFORMATION_CLIENT_PRIO_VERS_ORDINAIRE = 30,
    MAX_PRIORITAIRE_FILE = 5,
    TAUX_PRIORITAIRE = 0.3;

// tableau des valeurs cumulées pour la loi de poisson
const tabPoisson = [0.183, 0.494, 0.758, 0.908, 0.9716,  0.9932,  0.99932, 1.00081];

/*----------------------------------------------*/
/*                      Code                    */
/*----------------------------------------------*/

// module de calcul du nombre de stations optimal
function nbStationsOptimal(nbStationsMin, nbStationsMax, tempsSimu, x0, a, c, m) {
    let couts = [];

    for( let nbStations = nbStationsMin; nbStations <= nbStationsMax; nbStations++){
        let file = 0,
            filePrioritaire = 0,
            nbTransfoClientTot = 0,
            tempsInnocupéTot = 0
            tempsTraitements = 0
            tempsTraitementsPrio = 0;
        let stations = [];
        let nbClientsTot = 0;
        
        initStations(stations, nbStations);

        for(let temps = 1; temps <= tempsSimu; temps++){
            // affichage des états de chawue stations pour les 20 premières minutes du nombre de station min
            if( temps <= 20 && nbStations == nbStationsMin ){
                console.log("Minutes "+ temps +" :")
                console.log("\tAVANT PLACEMENT");
                for(let i = 0; i < nbStations; i++){
                    let message =  "\t- Stations "+ (i+1) +" : ";
                    if(stations[i] !== 0){
                        message += stations[i] +" minutes restantes.";
                    }
                    else{
                        message += "pas de client.";
                    }
                    console.log(message);
                }
                // affichage de la description de chaque file
                console.log("\t\tFile de client ordinaire : "+ file +" client(s).");
                console.log("\t\tFile de client prioritaire : "+ filePrioritaire +" client(s) (max : 5)");
            }  

            // génération des arrivées
            const resArrivées = génèreArrivées(x0, a, c, m, tabPoisson);
            x0 = resArrivées.x0;

            // répartition des arrivées entre prioritaire et ordinaire
            const resRépartitionPrio = répartitionArrivée(resArrivées.nbArrivées, filePrioritaire, x0, a, c, m );
            // ajoute les clients générés à la file correspondante
            file = resRépartitionPrio.fileOrdinaire;
            filePrioritaire = resRépartitionPrio.filePrio;
            nbTransfoClientTot += resRépartitionPrio.nbTransformation;
            x0 = resRépartitionPrio.x0;
            nbClientsTot += resArrivées.nbArrivées;
            // affichage pour les 20 première minutes du nombre de station min
            if( temps <= 20 && nbStations === nbStationsMin ){
                console.log('\t\tMinutes '+ temps +' : '+ resArrivées.nbArrivées +' arrivées générées.');
                console.log('\t\t'+ resRépartitionPrio.fileOrdinaire +' clients ordinaires et '+ resRépartitionPrio.filePrio +' clients prioritaires.');
            }
            
            // répartition des clients prioritaire dans la première station
            const resRépartition = repartiClientPrio(stations, filePrioritaire, x0, a, c, m);
            x0 = resRépartition.x0;
            tempsInnocupéTot += resRépartition.tempsInnocupé;
            tempsTraitementsPrio += resRépartition.tempsTraitementsPrio;
            filePrioritaire = resRépartition.filePrio;

            // répartition des clients ordinaires dans les stations
            const resRepartitionClient = repartiClient(stations, file, filePrioritaire, x0, a, c, m);
            x0 = resRepartitionClient.x0;
            tempsInnocupéTot += resRepartitionClient.tempsInnocupé;
            tempsTraitements += resRepartitionClient.tempsTraitements;
            tempsTraitementsPrio += resRepartitionClient.tempsTraitementsPrio;
            file = resRepartitionClient.file;
            filePrioritaire = resRepartitionClient.filePrioritaire;

            if (nbStations == nbStationsMin && temps <= 20){
                console.log("\tAPRÈS PLACEMENT");
                for(let i = 0; i < nbStations; i++){
                    let message =  "\t- Stations "+ (i+1) +" : ";
                    if(stations[i] !== 0){
                        message += stations[i] +" minutes restantes.";
                    }
                    else{
                        message += "pas de client.";
                    }
                    console.log(message);
                }
                 // affichage de la description de chaque file
                 // infos nécessaire pour la compréhension des files ?
                console.log("\t\tFile de client ordinaire : "+ file +" client(s).");
                console.log("\t\tFile de client prioritaire : "+ filePrioritaire +" client(s) (max : 5)");
            }
        }
        // différents coûts à calculer
        console.log("Coûts pour "+ nbStations +" stations.  - "+ nbClientsTot +" clients générés.");
        const total = calculCouts(tempsInnocupéTot, tempsTraitements, tempsTraitementsPrio, nbTransfoClientTot);
        console.log("    Coût total : "+ total +"€.");
        // le nombre de station minimum n'est pas forcement 0
        // ⇒ on soustrais le nombre de station minimum du nombre de station pour avoir un indice de 0 à nbMaxStations - nbStations
        couts[nbStations - nbStationsMin] = total;
    }
    const nbOptimalStations = rechercheCoutMin(couts, nbStationsMin, nbStationsMax);
    console.log("Le nombre optimal de stations est de "+ nbOptimalStations +" pour un coût de "+ couts[nbOptimalStations - nbStationsMin] +"€.");
}

// génère un tableau de station et les initialise à 0
function initStations(stations, nbStations){
    for(let i = 0; i < nbStations; i++){
        stations[i] = 0;
    }
    // stations passé par référence (pas besoin de le retourner)
}

// génère le nombre d'arrivées
function génèreArrivées(x0, a, c, m){
    let {un, x0N} = génèreUN(x0, a, c, m);
    x0 = x0N;
    let nbArrivées = 0;
    while(nbArrivées < tabPoisson.length -1 && un > tabPoisson[nbArrivées]){
        nbArrivées++;
    }
    // retourne le nombre d'arrivées et le nouveau x0
    return {nbArrivées, x0};
}

// génère un nombre aléatoire entre 0 et 1
function génèreUN(x0N, a, c, m){
    let x1 = (a * x0N + c) % m;
    let un = x1 / m;
    x0N = x1;

    return {un, x0N};
}

// répartition des arrivées entre file ordinaire et file prioritaire
function répartitionArrivée(nbArrivées, filePrio, x0, a, c, m){
    let fileOrdinaire = 0,
        nbTransformation = 0;

    for(let i = 0; i < nbArrivées; i++){
        let {un, x0N} = génèreUN(x0, a, c, m);
        x0 = x0N;
        if(un < TAUX_PRIORITAIRE){
            if(filePrio <= MAX_PRIORITAIRE_FILE){
                filePrio++;
            }else{
                // gestion cout sup
                nbTransformation++;
                fileOrdinaire++;
            }
        }else{
            fileOrdinaire++;
        }
    }
    return {fileOrdinaire, filePrio, x0, nbTransformation};
}

// traitement du client prioritaire
function repartiClientPrio(stations, filePrio, x0, a, c, m){
    let tempsInnocupé = 0;
    let tempsTraitementsPrio = 0;
    // regarde si la station est libre
    if(stations[0] === 0){
        // si elle est libre, regarde si un client attend dans la file
        if(filePrio !== 0){
            // génère le temps pour le client, l'enlève de la file et l'ajoute dans la station
            filePrio--;
            x0 = génèreDurée(x0, a, c, m, stations, 0);
            // enlève une minute de traitement
            tempsTraitementsPrio+= stations[0]
            stations[0]--;
        }else{
            // si aucune file n'est remplie, ajoute un temps d'innocupation pour les couts
            tempsInnocupé++;
        }
    }else{
        // enlève une minute de traitement
        stations[0]--;
    }
    // stations passé par référence (pas besoin de le retourner)
    return {x0, filePrio, tempsInnocupé, tempsTraitementsPrio};
}

// réparti les clients dans les stations
function repartiClient(stations, file, filePrioritaire, x0, a, c, m){
    // parcour le tableau de station pour
    // - regarder si une station est libre (== 0)
    // => si oui, génère une durée pour un client si il attend dans la file 
    //      , l'ajoute à la station et enlève un client de la file
    // - enlève une minute de traitement de chaque station
    let tempsInnocupé = 0;
    let tempsTraitements = 0;
    let tempsTraitementsPrio = 0;
    // pas 0 car la station 0 est résevé au client prioritaire
    for(let i = 1; i < stations.length; i++){
        if(stations[i] === 0){
            // regarde si un client est dans la file prioritaire (priorité sur la file ordinaire)) 
            if(filePrioritaire !== 0){
                // enlève un client de la file prioritaire
                filePrioritaire--;
                // génère une durée pour le client et l'ajoute à la station
                x0 = génèreDurée(x0, a, c, m, stations, i);
                tempsTraitementsPrio += stations[i]
                // enlève une minute
                stations[i]--;
            }else if(file !== 0){
                // regarde si un client est dans la file ordinaire
                file--;
                x0 = génèreDurée(x0, a, c, m, stations, i);
                tempsTraitements+= stations[i]
                stations[i]--;
            }else{
                // si aucune file n'est remplie, ajoute un temps d'innocupation pour les couts 
                tempsInnocupé++;
            }
        } 
        else {
            // enlève une minute de traitement
            stations[i]--;
        }   
    }
    // stations passé par référence (pas besoin de le retourner)
    return {x0, file, filePrioritaire, tempsInnocupé, tempsTraitements, tempsTraitementsPrio};
}

// génère une durée
function génèreDurée(x0, a, c, m, stations, ind){
    let {un, x0N} = génèreUN(x0, a, c, m);
    x0 = x0N;

    if (un < 0.305)
        T = 1;
    else if (un < 0.661)
        T = 2;
    else if (un < 0.915)
        T = 3;
    else if (un < 0.966)
        T = 4;
    else if (un < 0.983)    
        T = 5;
    else
        T = 6;

    x0 = un;
    // tableau passé par référence (pas besoin de le retourner)
    stations[ind] = T;

    return x0;
}

// recherche du cout minimal
function rechercheCoutMin(couts, nbStationsMin){
    let coutMin = couts[0],
        iStationOpti = 0;

    for(let i = 1; i < couts.length; i++){
        if(couts[i] < coutMin){
            coutMin = couts[i];
            iStationOpti = i;
        }
    }

    return iStationOpti + nbStationsMin;
}

// calcul les couts et affiches les détails
function calculCouts (tempsInnocupéTot, tempsTraitement, tempsTraitementsPrio, nbTransfoClientTot) {
    let total = 0;

    let coutsPrésenceDansSysOrdinaire = (tempsTraitement) / 60 * COUT_1H_ORDINAIRE;
    console.log("\tcout de présence dans le système : "+ coutsPrésenceDansSysOrdinaire);
    total += coutsPrésenceDansSysOrdinaire;

    let coutsPrésenceDansSysPrio = (tempsTraitement) / 60 * COUT_1H_PRIORITAIRE;
    console.log("\tcout de présence dans le système ( client prioritaire): "+ coutsPrésenceDansSysPrio);
    total += coutsPrésenceDansSysPrio;

    let coutOccupationStationClassique = tempsTraitement / 60 * COUT_1H_STATION_ORDINAIRE;
    console.log("\tcout d'occupation de station : "+ coutOccupationStationClassique);
    total += coutOccupationStationClassique;

    let coutOccupationStationPrio = tempsTraitementsPrio / 60 * COUT_1H_STATION_PRIORITÈRE;
    console.log("\tcout d'occupation de station ( client prioritaire ): "+ coutOccupationStationPrio);
    total += coutOccupationStationPrio;

    let coutTransformationClient = nbTransfoClientTot * COUT_TRANSFORMATION_CLIENT_PRIO_VERS_ORDINAIRE;
    console.log("\tcout de transformation de client classique vers prioritaire : "+ coutTransformationClient);
    total += coutTransformationClient;

    let coutInnocupation = tempsInnocupéTot / 60 * COUT_1H_STATION_INOCCUPÉE;
    console.log("\tcout d'innocupation d'une station : "+ coutInnocupation);
    total += coutInnocupation;

    return total;
}
