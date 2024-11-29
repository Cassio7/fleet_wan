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
### Frontend
Sotto cartella `frontend_fleet`, realizzata con Angular 18.
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

