Questo documento definisce la logica e i controlli fatti, per far si che un veicolo abbia una tipologia di anomalia da segnalare.
# Range temporale
Il controllo viene effettuato su un veicolo e su un intervallo di date definito dall'utente, ma il sistema considera sempre singole giornate. Ad esempio, se l'utente inserisce l'intervallo _10/12/24 - 13/12/24_, il controllo avverrà in questo modo:

| Date from         | Date to           |
| ----------------- | ----------------- |
| 10/12/24 00:00:00 | 10/12/24 23:59:59 |
| 11/12/24 00:00:00 | 11/12/24 23:59:59 |
| 12/12/24 00:00:00 | 12/12/24 23:59:59 |
All'interno di questo intervallo, vengono recuperate le sessioni disponibili per ciascun giorno. Se una sessione inizia prima del _date from_ e termina dopo il _date to_, essa verrà comunque considerata e inserita nel controllo del giorno successivo.
# Anomalie
## GPS
L'anomalia del GPS definisce il non funzionamento, oppure un funzionamento scorretto del GPS, che porta la posizione del veicolo ad uno stato non congruente con la realtà.
Le tipologie di errore sono 2, problematica relativa alla distanza, cioè quanti km ha fatto il mezzo durante una sessione e alla posizione, quindi ai rispettivi lat e long.

Per **evitare di avere dei falsi positivi,** vengono considerati soltanto i veicoli che in una giornata hanno **almeno 1 sessione e almeno più di 5 posizioni registrate** (le posizioni vengono prese in base alla durata di 1 sessione, ogni 3 minuti, quindi 5 posizioni rappresentano 15 minuti di viaggio).
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
L'anomalia dell'antenna si riferisce a un malfunzionamento del dispositivo installato sul veicolo, incaricato di leggere i tag applicati ai contenitori. 
Vengono controllati soltanto i veicoli con l'apparato *RFID reader* montato.
Questa anomalia viene rilevata quando, in una giornata, un veicolo registra almeno un tag letto ma non si verifica alcuna **sessione valida** (ossia una sessione con durata superiore a 3 minuti), oppure quando esiste almeno una sessione valida ma non vengono rilevati tag.

Il controllo viene sempre eseguito con la logica indicata in [[#Range temporale]].
### Sessioni trovate ma tag no
Attualmente, questo caso particolare può generare falsi positivi, poiché se un veicolo rimane acceso per più di 3 minuti e resta fermo, questo viene considerato come una sessione valida (questo punto va rivisto). Allo stesso modo, anche se il veicolo è in movimento, ma durante la giornata **non svuota contenitori**, viene comunque rilevata un'anomalia.
### Tag trovati ma sessioni no
Questo è il caso più affidabile, poiché, se le letture vengono effettuate e salvate ma non ci sono sessioni valide, significa che il veicolo non invia le sessioni aggiornate al server Fleet.
## Sessione
Il controllo della sessione va a verificare se l'ultimo evento registrato e salvato all'interno del veicolo corrisponde alla chiusura effettiva della sua ultima sessione. 
L'anomalia si ha quando questi dati non coincidono. 
### Evento < ultima sessione
Questa anomalia si verifica quando l'ultimo evento registrato è del giorno prima o più dell'ultima sessione chiusa, questo per evitare falsi positivi nel caso in cui un mezzo sia in movimento nell'esatti momento del controllo. 
Le sessioni che causano anomalie effettive vengono avviate ma mai chiuse, finche il mezzo non riprende segnale ed invia tutti i dati salvati localmente.
### Evento > ultima sessione
Questa anomalia si verifica quando l'ultimo evento registrato è dopo l'ultima sessione, questo errore viene causato da sessione nulle, che causano problemi nel recupero dei datti proprio dal SOAP.