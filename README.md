# WasteTrucker
## Indice
1. [Introduzione](#introduzione)
2. [Cosa Risolve](#cosa-risolve)
3. [Obiettivo dell'Applicazione](#obiettivo-dellapplicazione)
4. [Architettura dell'Applicazione](#architettura-dellapplicazione)
5. [Requisiti](#requisiti)
6. [Installazione](#installazione)
8. [API Documentation](#api-documentation)
9. [Moduli Principali](#moduli-principali)
11. [Manutenzione e Debug](#manutenzione-e-debug)
12. [Roadmap e Futuri Aggiornamenti](#roadmap-e-futuri-aggiornamenti)
13. [Contatti e Crediti](#contatti-e-crediti)

---
## Introduzione
WasteTrucker è uno strumento per visualizzare in modo rapido i veicoli aziendali e monitorare e controllare il funzionamento di lettori RFID e antenne.

---
## Cosa Risolve
Risolve il problema di un controllo manuale e molto lento per verificare l'effettivo funzionamento dei mezzi, che implica un'analisi procedurale veicoli per veicoli.

---
## Obiettivo dell'Applicazione
L'obiettivo principale è il controllo delle anomalie dei mezzi, in particolare si possono riscontrare 3 tipologie di controlli:
1. **GPS**: definisce il malfunzionamento, oppure un funzionamento scorretto del GPS, che porta la posizione del veicolo ad uno stato non congruente con la realtà.
2. **Antenna**: si riferisce a un malfunzionamento del dispositivo installato sul veicolo, incaricato di leggere i tag applicati ai contenitori. 
3. **Sessione**: va a verificare se l'ultimo evento registrato e salvato all'interno del veicolo corrisponde alla chiusura effettiva della sua ultima sessione. 

---
## Architettura dell'Applicazione
### Backend
La parte di backend è stata realizzata con NestJS, sotto la cartella `backend_fleet`.

---
## NAVBAR

### Sezione sinistra
Nella parte sinistra è indicato il nome della pagina in cui ci si trova e il percorso relativo
### Sezione destra
Nella parte destra è indicato il nome dell'account attualmente in uso e il ruolo associato a quest'ultimo.

---

## MENÙ LATERALE
Permette di navigare facilmente tra le diverse parti dell'applicativo tramite i seguenti bottoni:
- Dashboard
- Mezzi
- Dettaglio mezzo
- Storico mezzi
- Mappa

---
## DASHBOARD

### Sezione destra

#### Titolo
In alto a sinistra è indicato il titolo della sezione in cui ci si trova e subito affianco a quando sono aggiornati i dati della tabella

#### Interruttore andamento
Proseguendo sulla destra, è presente un interruttore che consente di modificare l'ordine cronologico dei dati visualizzati nella dashboard.  

L'utente può scegliere tra due modalità di visualizzazione:  
- **"Oggi"**: mostra il resoconto giornaliero.  
- **"Recente"**: visualizza l'ultimo andamento di ciascun veicolo, includendo i controlli effettuati all'orario specificato.
#### Menù kebab
Di seguito è presente un "kebab menu" composto da 4 icone che permettono di accedere ai rispettivi [kanban](#Kanban) modificando visualizzazione della dashboard.
#### Kanban
I kanban offrono delle visualizzazioni più specifiche in base al dispositivo alla quale si riferiscono:
- **Kanban GPS**: è composto da 3 colonne che rispecchiano i 3 stati in cui può trovarsi il GPS:  
  - **OK**  
  - **Warning**  
  - **Error** (per le anomalie di GPS totali)  
  Inoltre sulla sezione di sinistra sarà visualizzabile solo il grafico riassuntivo degli stati del GPS.

- **Kanban Antenna**: è composto da 3 colonne che rispecchiano i 3 stati in cui può trovarsi l'antenna:  
  - **OK**  
  - **Error**  
  - **No Antenna**  
  Inoltre sulla sezione di sinistra sarà visualizzabile solo il grafico riassuntivo degli stati dell'antenna.

- **Kanban Sessione**: è composto da 2 colonne che rispecchiano i 2 stati in cui può trovarsi la sessione:  
  - **OK**  
  - **Error**  
  Inoltre sulla sezione di sinistra sarà visualizzabile solo il grafico riassuntivo degli stati della sessione.

In ogni colonna di ciascun kanban, i veicoli sono suddivisi in base allo stato del dispositivo a cui il kanban fa riferimento.
Inoltre, per ciascun elemento all'interno delle colonne, è possibile visualizzare l'ultima posizione del veicolo associato. Per farlo, basta premere sull'icona della mappa situata in basso a sinistra dell'elemento corrispondente.
Per tornare alla visualizzazione tabellare che racchiude gli stati di ogni dispositivo è necessario premere sulla prima icona a sinistra.

#### Aggiorna dati
L'ultimo bottone sulla destra è il bottone "Aggiorna dati", che permette di recuperare gli ultimi dati ricevuti e aggiornare la dashboard di conseguenza
#### Tabella
Contiene i dati di ciascun veicolo più utili al monitoraggio di quest'ultimi, le colonne presenti sono:
##### Servizio
Contiene il servizio svolto dal veicolo
##### Targa:
Contiene la targa del veicolo
##### Cantiere:
Contiene il nome del comune di appartenenza del veicolo
##### Stato GPS:
Contiene un'icona che indica il corretto funzionamento del GPS per quel veicolo, le icone possono essere:
- ✅: Se il GPS funziona correttamente 
- ⚠: Se il GPS presenta un'anomalia parziale
- ❌: Se il GPS presenta un'anomalia totale
##### Stato Antenna:
Contiene un'icona che indica il corretto funzionamento del GPS per quel veicolo, le icone possono essere:
- 📡(di colore verde): Se l'antenna è presente e funziona sul veicolo
- 📡(di colore rosso): Se l'antenna è presente sul veicolo e presenta un anomalia 
- 📡❌(di colore blu e croce rossa): Se l'antenna il veicolo non è munito di antenna

##### Detection quality
Contiene delle informazioni relative alla media delle qualità di lettura, che può assumere valori compresi tra un massimo di -16 e un minimo di -70. In questo contesto, più il valore si avvicina a 0, migliore è la qualità di lettura ottenuta dal veicolo nel periodo di tempo in cui viene effettuato il controllo. Le condizioni sono le seguenti:
- <span style="background-color: green; padding: 2px; border-radius: 2px; color: white">OK</span> (Excellent) se la media della qualità di lettura è compresa tra 0 e -59.
- <span style="background-color: #c5d026; padding: 2px; border-radius: 2px; color: white">Warning</span> (Good) se la media della qualità di lettura è compresa tra -60 e -69. 
- <span style="background-color: #d02626; padding: 2px; border-radius: 2px; color: white">Error</span> (Poor) se la media della qualità di lettura è superiore a -69


##### Stato della Sessione:
Oltre alla data, questa sezione include un'icona che segnala la presenza o l'assenza di anomalie nell'ultima sessione registrata dal veicolo. Le icone utilizzate sono le seguenti:

- ✅: Indica che la sessione è stata completata correttamente.
- ❌: Indica che la sessione presenta un'anomalia.

##### Ultima posizione
In questa colonna è presente per tutte le righe una mappa che se premuta permette di visualizzare, sulla mappa nella sezione di sinistra, l'ultima posizione registrata del veicolo

#### Filtri

##### Filtro per targa
Permette di filtrare le righe della tabella in base alla targa inserita.
##### Filtro per cantieri
Permette di filtrare le righe della tabella in base al cantiere di provenienza dei veicoli.
##### Filtro per stato GPS
Permette di filtrare le righe della tabella in base ad un determinato stato di GPS.
##### Filtro per stato Antenna
Permette di filtrare le righe della tabella in base ad un determinato stato di Antenna.
##### Filtro per stato Sessione
Permette di filtrare le righe della tabella in base ad un determinato stato di Sessione.

---
### Sezione sinistra
#### Grafici
Sono presenti nella sezione a sinistra e visualizzano, oltre che il numero totale di veicoli, anche un resoconto dei controlli per ciascun parametro:
- GPS
- Antenna
- Sessione
##### Grafico dei GPS
Mostra il resoconto dei controlli sui GPS
##### Grafico delle antenne 
Mostra il resoconto dei controlli sulle antenne
##### Grafico delle sessioni
Mostra il resoconto dei controlli sulle sessioni
#### Mappa
Sempre nella sezione di sinistra, sotto i grafici, è presente una piccola mappa che alla pressione sull'icona della mappa presente nella colonna della tabella "**Ultima sessione**" visualizza l'ultima posizione registrata del veicolo

---
## MEZZI
Pagina che visualizza tutto l'archivio dei mezzi registrati, con la possibilità di filtrare i veicoli per targa e cantiere.
Inoltre è possibile aggiungere una singola nota per veicolo tramite un campo di testo, accessibile tramite il bottone di apertura nell'ultima colonna a destra che espande la riga mostrando la sezione nota, nella quale si possono performare azioni sulla nota: 
- Crea: per creare la nota
- Aggiorna: per aggiornare
- Elimina: per eliminare

---
## DETTAGLIO MEZZO
Pagina che visualizza informazioni più specifiche sul singolo mezzo ed è diviso anch'esso in due sezioni:
### Sezione sinistra
In questa sezione sono elencate maggiori informazioni sul singolo mezzo, ed è così strutturata:
#### Parte sinistra
In alto è possibile tornare alla sezione dell'applicativo che si stava consultando prima di accedere al dettaglio del mezzo.
Al di sotto vi sono 3 contenitori che permettono di monitorare lo stato delle anomalie del veicolo, ed infatti possono essere:
- <span><span style="background-color: #5c9074;color: white">Verde</span> se non vi è anomalia</span>
- <span><span style="background-color: #c5d026;color: white">Giallo</span> se l'anomalia è un errore</span>
- <span><span style="background-color: #d02626;color: white">Rosso</span> se l'anomalia è un errore</span>
#### Parte centrale
Sono presenti diversi contenitori, nei primi in alto sono presenti delle informazioni sul veicolo e sul dispositivo, scendendo è presente il **campo note** associato ed in fondo, ovviamente solo per i mezzi dotati di antenna RFID, si trova un grafico che rappresenta un resoconto dell'andamento delle qualità di lettura.
#### Parte destra
Nella parte destra è possibile ricercare le giornate e le sessioni svolte da un veicolo in un arco di tempo desiderato, se si inserisce un arco di tempo nel form apposito (premendo sull'icona a forma di calendario), la tabella sottostante si aggiornerà e mostrerà le giornate con sessioni che quel veicolo ha svolto in quell'arco di tempo,
ogni riga della tabella indica una diversa giornata mostrandone le anomalie complessive e, tramite il tasto '+' sulla prima della riga, è possibile espandere la giornata per visionare le sessioni svolte in quella giornata e alcuni dati rilevanti su ciascuna di esse.

---
## STORICO MEZZI
Qui è possibile visionare lo storico di più mezzi ed è suddivisa in:
### Sezione sinistra
È presente una lista dei mezzi, che può essere filtrata tramite il cantiere e targa, e mostra le informazioni base per l'identificazione di ciascun mezzo.
Inoltre sull'ultima colonna a destra e presente un'icona di una mappa che, se premuta, mostra l'ultima posizione del veicolo selezionato su una mappa nella [[Frontend fleet#STORICO MEZZI#Sezione destra | Sezione destra]].
### Sezione centrale
Questa sezione presenta una tabella inizialmente vuota, che verrà popolata con i dati relativi ai giorni e alle sessioni di un veicolo, selezionabile cliccando sulla riga corrispondente al veicolo desiderato nella lista della Sezione Sinistra. Una volta scelto il veicolo e definito un intervallo di date tramite l’apposito modulo, la tabella si riempirà con le informazioni riguardanti le giornate in cui il veicolo ha effettuato delle sessioni, nell’arco di tempo selezionato. Per ogni giornata, una riga della tabella mostrerà le eventuali anomalie riscontrate, in modo simile a quanto accade nella tabella della sezione destra del [[Frontend fleet#DETTAGLIO MEZZO | Dettaglio mezzo]]. Inoltre, sarà possibile espandere ogni riga relativa a una giornata cliccando sul simbolo "+" nella prima colonna, per visualizzare alcune informazioni aggiuntive.

A differenza della tabella del [[Frontend fleet#DETTAGLIO MEZZO | Dettaglio mezzo]], sia nella tabella delle giornate che in quella espandibile delle sessioni, l’ultima colonna contiene un'icona che rappresenta il percorso del veicolo. Se cliccata, questa icona mostrerà il percorso del veicolo per la giornata selezionata (nel caso in cui la riga faccia parte della tabella delle giornate) o per una sessione specifica (se la riga si riferisce a una sessione). Il percorso verrà visualizzato nella sezione destra.

### Sezione destra
Questa sezione della pagina è inizialmente vuota, ma si popola con una mappa quando si clicca su una delle icone relative all'**ultima posizione** o al **percorso** presenti nella **lista mezzi** o nelle **tabelle delle giornate e delle sessioni**. Se viene selezionata una singola posizione, la mappa visualizzerà un cerchio che indica l'ultima posizione del veicolo. Nel caso di un percorso relativo a una giornata, invece, la mappa mostrerà dei **marker** (segnaposto) per ogni inizio di sessione che compone quella giornata, numerati in base al numero della sessione di riferimento. Il punto di fine percorso, corrispondente alla conclusione dell'ultima sessione della giornata, sarà contrassegnato da un'icona a forma di bandierina. Se il percorso selezionato riguarda una singola sessione, la mappa mostrerà il punto di inizio (incluso l'ID della sessione) e il punto di fine, indicato anch'esso con una bandierina.

---

## MAPPA
La sezione mappa presenta una mappa a schermo intero che inizialmente visualizza l'ultima posizione registrata di ciascun veicolo. È possibile filtrare i veicoli per **targa** e per **cantiere**: selezionando un cantiere, il filtro per targa mostrerà solo le targhe dei veicoli presenti in quel cantiere. Dopo aver scelto le targhe desiderate, è necessario premere il tasto **"Aggiorna dati"** per aggiornare i veicoli visualizzati sulla mappa in base ai filtri selezionati. Ogni **marker** o **segnaposto** include un popup con la targa del veicolo associato. Cliccando su un **marker**, la mappa eseguirà uno **zoom** su di esso e, sulla sinistra, comparirà un **box con le informazioni essenziali** per l'identificazione del mezzo, insieme a un **report sullo stato delle anomalie**. Per approfondire i dettagli, è possibile cliccare sul pulsante **"Vedi dettagli"**, che reindirizzerà direttamente alla pagina **[[Frontend fleet#DETTAGLIO MEZZO | Dettaglio mezzo]]** del veicolo selezionato.

---

##### MEZZI
Pagina che visualizza tutto l'archivio dei mezzi registrati,
dove è presente una tabella che contiene dati sui veicoli.

---

##### DETTAGLIO MEZZI
Pagina che estende i dati visualizzati nella dashboard con maggiori opzioni per la visualizzazione e la possibilità di applicare più filtri ai dati.

---

##### IMPOSTAZIONI
Pagina per modificare le impostazioni.

---

##### GESTIONE UTENTI
Pagina che sarà consultabile solo dall'utente Amministratore(Admin), i cui poteri non sono ancora ben stati definiti. Sarà possibile gestire informazioni come le credenziali degli altri utenti e apportare modifiche più specifiche sui veicoli.

---

### Database
Il database utilizzato è PostgreSQL, creato dentro un container Docker. 
Dentro la cartella `db` è possibile trovare alcuni documenti che rappresentano la struttura dello schema.

---
## Requisiti
TODO

---
## Installazione
Guida passo-passo per installare e configurare l'applicazione.

---
## API Documentation
Su Postman

---
## Moduli Principali
Descrizione dei componenti principali del frontend, backend e database.

---
## Manutenzione e Debug
TODO

---
## Roadmap e Futuri Aggiornamenti
TODO

---
## Contatti e Crediti
TODO

