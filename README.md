# Fleet App
Applicazione per la gestione e visualizzazione dei dati riguardanti i terminali installati su automezzi.

Le chiamate vengono fatte al webservice di Fleet Control, preposto all'estrazione storica di dati, al seguente link [WSDL](https://ws.fleetcontrol.it/FWANWs3/services/FWANSOAP).
## Backend
La parte di backend è stata realizzata con NestJS, sotto la cartella `backend_fleet`
## Database
Il database utilizzato è PostgreSQL, creato dentro un container Docker. 
Dentro la cartella `db` è possibile trovare alcuni documenti che rappresentano la struttura dello schema.