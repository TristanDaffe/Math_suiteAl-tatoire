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
function nbStationsOptimal(nbStationsMin, nbStationsMax, tempsSimu) {
    for( let nbStations = nbStationsMin; nbStations <= nbStationsMax; nbStations++){
        let file = 0,
            filePrioritaire = 0,
            fileCumulée = 0,
            filePrioritaireCumulée = 0,
            nbTransfoClientTot = 0,
            tempsInnocupéTot = 0;
        let stations = [];
        initStations(nbStations, stations);

        for(let temps = 1; temps <= tempsSimu; temps++){
            // affichage des états de chawue stations pour les 20 premières minutes du nombre de station min
            if( temps <= 20 && nbStations == nbStationsMin ){
                console.log("AVANT PLACEMENT");
                for(let i = 0; i < nbStations; i++){
                    let message =  "- Stations "+ (i+1) +" : ";
                    if(stations[i] !== 0){
                        message += stations[i] +" clients.";
                    }
                    else{
                        message += "pas de client.";
                    }
                    console.log(message);
                }
                // affichage de la description de chaque file
                console.log("File de client ordinaire : "+ fileOrdinaire +" client(s).");
                console.log("File de client prioritaire :"+ filePrioritaire +" client(s) (max : 5)");
            }  
            // génération des arrivées
            const {nbArrivées, x0N :x01} = génèreArrivées(x0, a, c, m, tabLoiPoisson);
            x0 = x01;
            // répartition des arrivées entre prioritaire et ordinaire
            const {fileOrdinaire, filePrio, x0N: x02, nbTransformation} = répartitionArrivée(file, filePrioritaire, x0, nbTransformation);
            // ajoute les clients générés à la file correspondante
            file = fileOrdinaire;
            filePrioritaire += filePrio;
            nbTransfoClientTot += nbTransformation;
            x0 = x02;

            // affichage pour les 20 première minutes du nombre de station min
            if( temps <= 20 && nbStations === nbStationsMin ){
                console.log('Minutes '+ temps +' : '+ nbArrivées +' arrivées générées.');
                console.log(fileOrdinaire +' clients ordinaires et '+ filePrio +' clients prioritaires.');
            }

            // répartition des clients prioritaire dans la première station
            const {filePrio: filePrioNew, x0N: x03, tempsInnocupé} = repartiClientPrio(stations, filePrioritaire, x0);
            x0 = x03;
            tempsInnocupéTot += filePrioNew;
            filePrioritaire = filePrioNew;
        }
    }
}

/*  

 o───────────────────o ↓ nbStationsMin, nbStationsMax, tempsSimul
 │ nbStationsOptimal │
 o───────────────────o ↓ nbStationsOptimal
┌─── *

│║║ o───────────────────o ↓  stations, x0, a, c, m, tempsInnocupé
│║║ │ repartiClientPrio │
│║║ o───────────────────o ↓  stations, filePrioritaires, x0, temspInnocupé
│║║ 
│║║ o───────────────o ↓  stations, x0, a, c, m, tempsInnocupé
│║║ │ repartiClient │
│║║ o───────────────o ↓  stations, file, filePrioritaires, x0, temspInnocupé
│║║ 
│║║ // additionne le nombre de client de chaque type pour avoir le temps d'attente de chaque type de client
│║║ filePrioCumulée += filePrioritaire
│║║ fileCumulée += file
│║║ 
│║║┌── if( nbStattions == nbStationsMin AND temps ≤ 20 )
│║║│ sortir "APRÈS PLACEMENT"
│║║│ i = 0
│║║│╔══ while ( i < nbStations )
│║║│║ sortir " - Station "+ i +" : "
│║║│║┌── if( station[i] ≠ 0)
│║║│║│ // ajouté le type de client
│║║│║│ sortir stations[i] +" clients."
│║║│║├── else
│║║│║│ sortir " pas de client."
│║║│║└──
│║║│║ i++
│║║│╙──
│║║│ 
│║║│ // affichage de la description de chaque file
│║║│ // infos nécessaire pour la compréhension des files ?
│║║│ sortir "File de client ordinaire : "+ fileOrdinaire +" client(s)."
│║║│ sortir "File de client prioritaire :"+ filePrioritaire +" client(s) (max : 5)"
│║║└──
│║║ 
│║║ temps ++
│║╙──
│║ 
│║ // différents coûts à calculer
│║ sortir "Coûts pour "+ nbStations +" stations."
│║ o─────────────o ↓  fileCumulée, filePrioCumulée, nbTransfoClientTot, tempsInnocupéTot
│║ │ afficheCout │
│║ o─────────────o ↓  total
│║ 
│║ // le nombre de station minimum n'est pas forcement 0
│║ // ⇒ on soustrais le nombre de station minimum du nombre de station pour avoir un indice de 0 à nbMaxStations - nbStations
│║ couts[nbStations - nbStationsMin] = total
│║ 
│║ nbStations ++
│║ o──────────────────o ↓ couts
│║ │ rechercheCoutMin │
│║ o──────────────────o ↓ nbStationsOptimal
│╙──
└──────────
*/

// génère un tableau de station et les initialise à 0
function initStations(nbStations, stations){
    for(let i = 0; i < nbStations; i++){
        stations[i] = 0;
    }
    // stations passé par référence (pas besoin de le retourner)
}

// génère le nombre d'arrivées
function génèreArrivées(x0, a, c, m){
    let {un, x0N} = génèreUN(x0, a, c, m);
    x0 = x0N;

    let i = 0;
    while(un > tabPoisson[i]){
        i++;
    }
    // retourne le nombre d'arrivées et le nouveau x0
    // i renvoyé sous le nom de nbArrivées
    return {nbArrivées: i, x0};
}

// génère un nombre aléatoire entre 0 et 1
function génèreUN(x0, a, c, m){
    let x1 = (a * x0 + c) % m;
    let un = x1 / m;
    x0 = x1;
    return {un, x0};
}

// répartition des arrivées entre file ordinaire et file prioritaire
function répartitionArrivée(nbArrivées, x0, a, c, m){
    let fileOrdinaire = 0,
        filePrio = 0,
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
function repartiClientPrio(stations, filePrio, x0){
    let tempsInnocupé = 0;
    // regarde si la station est libre
    if(stations[0] === 0){
        // si elle est libre, regarde si un client attend dans la file
        if(filePrio !== 0){
            // génère le temps pour le client, l'enlève de la file et l'ajoute dans la station
            filePrio--;
            x0 = génèreDurée(x0, a, c, m, stations, 0);
            // enlève une minute de traitement
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
    return {x0, filePrio, tempsInnocupé};
}

// réparti les clients dans les stations
function repartiClient(stations, file, x0, a, c, m){
    // parcour le tableau de station pour
    // - regarder si une station est libre (== 0)
    // => si oui, génère une durée pour un client si il attend dans la file 
    //      , l'ajoute à la station et enlève un client de la file
    // - enlève une minute de traitement de chaque station
    let tempsInnocupé = 0;
    // pas 0 car la station 0 est résevé au client prioritaire
    for(let i = 1; i < stations.length; i++){
        if(stations[i] === 0){
            // regarde si un client est dans la file prioritaire (priorité sur la file ordinaire)) 
            if(filePrioritaire !== 0){
                // enlève un client de la file prioritaire
                filePrioritaire--;
                // génère une durée pour le client et l'ajoute à la station
                x0 = génèreDurée(x0, a, c, m, stations, i);
                // enlève une minute
                station[i]--;
            }else if(file !== 0){
                // regarde si un client est dans la file ordinaire
                file--;
                x0 = génèreDurée(x0, a, c, m, stations, i);
                station[i]--;
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
    return {x0, file, tempsInnocupé};
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

    x0 = x1;
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
function calculCouts (fileCumulée, filePrioCumulée, nbTransfoClientTot) {
    let total = 0;

    let coutsPrésenceDansSysOrdinaire = fileCumulée / 60 * COUT_1H_ORDINAIRE;
    console.log("cout de présence dans le système : "+ coutsPrésenceDansSysOrdinaire);
    total += coutsPrésenceDansSysOrdinaire;

    let coutsPrésenceDansSysPrio = filePrioCumulée / 60 * COUT_1H_PRIORITAIRE;
    console.log("cout de présence dans le système ( client prioritaire): "+ coutsPrésenceDansSysPrio);
    total += coutsPrésenceDansSysPrio;

    let coutOccupationStationClassique = fileCumulée / 60 * COUT_1H_STATION_ORDINAIRE;
    console.log("cout d'occupation de station : "+ coutOccupationStationClassique);
    total += coutOccupationStationClassique;

    let coutOccupationStationPrio = filePrioCumulée / 60 * COUT_1H_STATION_PRIORITÈRE;
    console.log("cout d'occupation de station ( client prioritaire ): "+ coutOccupationStationPrio);
    total += coutOccupationStationPrio;

    let coutTransformationClient = nbTransfoClientTot * COUT_TRANSFORMATION_CLIENT_PRIO_VERS_ORDINAIRE;
    console.log("cout de transformation de client classique vers prioritaire : "+ coutTransformationClient);
    total += coutTransformationClient;

    let coutInnocupation = tempsInnocupéTot / 60 * COUT_1H_STATION_INOCCUPÉE;
    console.log("cout d'innocupation d'une station : "+ coutInnocupation);
    total += coutInnocupation;

    return total;
}
