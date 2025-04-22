## Cartelle
### Schema delle cartelle

### Schema delle cartelle

```
App/
│
├── Common-components/
│   ├── Components/
│   └── Services/
│
├── Common-services/
│   ├── Components/
│   └── Services/
│
├── Sezione/ # rappresenta una sezione dell'applicativo
│   ├── Components/
│   └── Services/
│
├── Models/
│
├── Utils/
```

### Descrizione delle cartelle

- **Common-Components:** Contiene i componenti che non hanno una sezione dell'applicativo dedicata e/o che sono utilizzati o dalla quale si può accedere da più di una **sezione** 
  
- **Common-services:** Contiene i servizi utilizzati in molteplici **sezioni** dell'applicativo
  
- **Components**: Contiene i componenti specifici di ciascuna sezione
  
- **Services**: Contiene i servizi utilizzati esclusivamente dai componenti della sezione, assente nel caso i servizi utilizzati siano tutti presi da **/Common-Services**
  
- **Sezione:** Rappresenta ogni sezione dell'applicativo, i cui componenti sono raccolti nella propria cartella **Components** e i cui servizi, se ne ha di esclusivi, nella cartella **Services**

- **Models:** I modelli utilizzati nell'applicativo si trovano dentro la cartella Models

### Modelli

I modelli utilizzati sono contenuti all'interno della cartella "Models" e rappresentano alcune delle entità realizzate nel backend.
Inoltre sono state create delle interfacce nei servizi più indicati, per i ritorni di alcune chiamate API.

### Utils

In questa cartella sono presenti alcuni file che contengono dati utili e comuni all'applicazione.

## Session storage

Il session storage è un punto focale dell'applicazione perché salva alcuni dati utili, in modo tale da ridurre il numero di chiamate API, evitando di recuperare gli stessi dati molteplici volte.

### Item

Gli item che vengono impostati sono:
- **"allData:"** contiene i dati principali di tutti i veicoli, inclusi i controlli relativi ad antenna, GPS e sessione, oltre ai dati del tempo reale di ciascun veicolo. Necessario per evitare di recuperare nuovamente gli stessi dati all'apertura della **dashboard**.
- **"AllVehicles":** contiene i dati su tutti i veicoli, che vengono recuperati all'apertura del **parco mezzi**. Necessario per evitare di recuperare nuovamente i medesimi dati all'apertura della medesima sezione.
- **"dashboard-section":** contiene un contrassegno per tenere in memoria la sezione della **dashboard** che si stava consultando in caso di ricarica della pagina.
- **"lastUpdate:"** Contiene la data dell'ultimo aggiornamento dei dati, oppure assume il valore "recente" se la dashboard è impostata per mostrare l'andamento più recente dei veicoli. Questo elemento è fondamentale per mantenere lo stato attuale della dashboard in caso di ricarica della pagina.
- **"previous_url":** Contiene l'URL dell'ultima sezione visitata, utile per gestire la navigazione dinamica "go back" disponibile in alcune sezioni dell'applicazione.
- **"navbar_previous_url":** Item introdotto per separare la logica di navigazione "go back" specifica delle sezioni dell'applicazione da quella gestita dalla navbar.


## App Component 

L'app.component contiene due **mat-drawer**(sidebar) uno fisso e l'altro dinamico, i quali si chiudono e aprono reciprocamente.
Il contenuto dei drawer sono il componente di login alla quale accedono tutti gli utenti non autenticati, e il router outlet a cui si può accedere dopo l'autenticazione.
Inoltre nell'app component vengono prese tutte le notifiche che poi verranno passate allla navbar, inoltre gestisce le sottoscrizioni ai subject che notificano della modifica o eliminazione delle notifiche.
## Environment

Il file di Environment è un file che esporta una variabile che contiene l'URL del server a cui i servizi fanno le chiamate API.
