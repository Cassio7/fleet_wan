# Fleet App
Applicazione per la gestione e visualizzazione dei dati riguardanti i terminali installati su automezzi.

Le chiamate vengono fatte al webservice di Fleet Control, preposto all'estrazione storica di dati, al seguente servizio [SOAP](https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP).

## Obiettivo principale
Verificare il funzionamento del lettore RFID e antenna, tramite controllo delle sessioni, verifica velocità mezzo e diversificazione posizioni registrate.   

## Backend
La parte di backend è stata realizzata con NestJS, sotto la cartella `backend_fleet`.

## Frontend
Sotto cartella `frontend_fleet`, realizzata con Angular 18.

## Database
Il database utilizzato è PostgreSQL, creato dentro un container Docker. 
Dentro la cartella `db` è possibile trovare alcuni documenti che rappresentano la struttura dello schema.