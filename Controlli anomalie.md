Questo documento definisce la logica e i controlli fatti, per far si che un veicolo abbia una tipologia di anomalia da segnalare.
# Anomalie
## GPS
L'anomalia del GPS definisce il non funzionamento, oppure un funzionamento scorretto del GPS, che porta la posizione del veicolo ad uno stato non congruente con la realtà.
Le tipologie di errore sono 2, problematica relativa alla distanza, cioè quanti km ha fatto il mezzo durante una sessione e alla posizione, quindi ai rispettivi lat e long.

Il controllo viene eseguito su un veicolo e in un range temporale, stabilito dall'utente, ma nella logica si prendono sempre le giornate singole. Se l'utente inserisce *10/12/24 - 13/12/24* il controllo verrà fatto con questa divisione:

| Date from         | Date to           |
| ----------------- | ----------------- |
| 10/12/24 00:00:00 | 10/12/24 23:59:59 |
| 11/12/24 00:00:00 | 11/12/24 23:59:59 |
| 12/12/24 00:00:00 | 12/12/24 23:59:59 |
| 13/12/24 00:00:00 | 13/12/24 23:59:59 |
Per **evitare di avere dei falsi positivi,** vengono considerati soltanto i veicoli che in una giornata hanno **almeno più di 1 sessione e almeno più di 15 posizioni registrate** (le posizioni vengono prese in base alla durata di 1 sessione, ogni 3 minuti, 15 posizioni, quindi almeno 45 minuti di viaggio).
La prima distinzione si fa se il veicolo controllato è *Can* o no. 
### Veicolo Can
Vengono fatti i seguenti controlli per determinare anomalia:
1. Se tutte le distanze di tutte le sessioni in quella giornata hanno come valore 0;
2. Se tutte le lat e long presentano sempre lo stesso valore ripetuto;
3. Se più del 20% del totale delle coordinate presentano come lat e long il valore 0;
### Veicolo non Can
Vengono fatti i seguenti controlli per determinare anomalia:
1. Se tutte le distanze di tutte le sessioni in quella giornata hanno come valore 0 oppure se tutte le distanze hanno sempre lo stesso valore costante;
2. Se tutte le lat e long presentano sempre lo stesso valore ripetuto;
3. Se più del 20% del totale delle coordinate presentano come lat e long il valore 0;
## Antenna

## Sessione
Il controllo della sessione va a verificare se l'ultimo evento registrato e salvato all'interno del veicolo corrisponde alla chiusura effettiva della sua ultima sessione. 
L'anomalia si ha quando questi dati non coincidono. 
### Evento < ultima sessione
Questa anomalia si verifica quando l'ultimo evento registrato è del giorno prima o più dell'ultima sessione chiusa, questo per evitare falsi positivi nel caso in cui un mezzo sia in movimento nell'esatti momento del controllo. 
Le sessioni che causano anomalie effettive vengono avviate ma mai chiuse, finche il mezzo non riprende segnale ed invia tutti i dati salvati localmente.
### Evento > ultima sessione
Questa anomalia si verifica quando l'ultimo evento registrato è dopo l'ultima sessione, questo errore viene causato da sessione nulle, che causano problemi nel recupero dei datti proprio dal SOAP.