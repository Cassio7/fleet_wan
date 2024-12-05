# Fleet App
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
Fleet App è uno strumento per visualizzare in modo rapido i veicoli aziendali e monitorare e controllare il funzionamento di lettori RFID e antenne.

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
### Frontend

#### NAVBAR
##### Icona menu
Permette con un click di aprire il [Menù laterale](#Menù-laterale).
##### Icona notifiche
Mostrerà una notifica in caso di novità sui veicoli, inoltre con un click aprirà un menù a tendina che visualizzerà le ultime notifiche ed un link per navigare alla bacheca dove saranno presenti le notifiche ricevute.
##### Icona account 
Icona che permette di accedere al profilo, o di uscire dall'account attuale tramite il menù a tendina.

---

#### Menù laterale
Permette di accedere alle altre pagine tramite apposti bottoni:

---

##### DASHBOARD

###### Tabella
Contiene i dati più rilevanti di ciascun veicolo per il monitoraggio, con la possibilità di ordinare le colonne per targa, cantiere e sessione, sia in ordine crescente che decrescente. Le colonne disponibili sono:

###### Targa:
Contiene la targa del veicolo.

###### Cantiere:
Contiene il nome del comune di appartenenza del veicolo.

###### GPS:
Contiene un'icona che indica il funzionamento del GPS per quel veicolo, le icone possono essere:
- ✅: Se il GPS funziona correttamente per quel veicolo
- ❌: Se il GPS presenta un'anomalia (tipo di anomalia visualizzabile onMouseHover)

###### Antenna:
Contiene un'icona che indica il funzionamento del GPS per quel veicolo, le icone possono essere:
- 📡(di colore verde): Se l'antenna è presente e funziona sul veicolo
- 📡(di colore rosso): Se l'antenna è presente sul veicolo e presenta un anomalia 
- 📡❌(di colore blu e croce rossa): Se l'antenna il veicolo non è munito di antenna (tipo di anomalia visualizzabile onMouseHover)

###### Sessione:
Contiene la data dell'ultima sessione valida del veicolo ed un'icona che indica la correttezza della sessione:
- ✅: Se la sessione è corretta
- ❌: Se c'è un'anomalia di sessione (tipo di anomalia visualizzabile onMouseHover)


##### Filtro per cantieri
Permette di filtrare le righe della tabella in base al cantiere di provenienza dei veicoli.

##### Grafici
Visualizzano un resoconto di alcuni dati dei veicoli nella tabella
alla pressione di una fetta di ciascuno dei due grafici.

###### Select
Grazie al menù a tendina è possibile scegliere tra le due modalità di visualizzazione del grafico:
- A torta
- A barre

###### Grafico degli errori
Visualizza una percentuale del funzionamento dei veicoli nella tabella.
Gli errori sono categorizzati, in base al peso attribuitogli, in:
- ✅(Funzionante): Mostra il corretto funzionamento.
- ⚠️(Warning): Che sono associati, in caso di malfunzionamento, ai GPS.
- ❌(Error):  Che sono associati, in caso di malfunzionamento, alle antenne e alla sessione.

###### Grafico tipologia istallazione
Visualizza in percentuale i veicoli muniti solo di blackbox per il tracciamento (blackbox) ed i veicoli muniti sia di blackbox che di antenna RFID per la lettura dei contenitori (blackbox+antenna).

--- 

###### Mappa
Dov'è verrà visualizzata l'ultima posizione registrata per ciascun veicolo.

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

