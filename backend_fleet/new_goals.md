# Obiettivi

- [x] accorpare su utils il controllo inserimento date
- [x] cambiare entità per groups e integrare il discorso dei cantieri, sede e comune
- [x] note come tabella connessa a veicolo per diversificare chi scrive note
- [x] realizzare la parte di login con autenticazione, bycrypt e jwtToken
- [x] inserire il campo mezzi dismessi di tipo date
- [x] recuperare i veicoli da file csv
- [x] ottimizzazione inserimento dati
- [x] altra connessione al database per gli inserimenti per evitare attese e peso aggiuntivo.
- [x] entità per role_company
- [x] restituire i detection quality in base al veicolo per creare una futuro grafico con media
- [x] rivedere logica dei ruoli ma sostituire con i cantieri
- [x] aggiunte le operazioni CRUD oer Utente accessibili solo da admin
- [x] inserire una tabella con la tipologia di veicolo (spazzatrice ...)
- [x] pensare a tabella di appoggio per allocare i controlli per tutti i veicoli con GPS, Antenna e Sessione -> tabella anomalies
- [x] risoluzione posizione con openstreetmap [reverse](https://nominatim.org/release-docs/develop/api/Reverse/)
- [x] integrazione con Redis per ridurre tempo risoluzione chiamate risoluzione posizione e altro
- [x] gestito errore 502 _AxiosError_ per il recupero dei dati, riprova 3 volte prima di saltare
- [x] manca ANOMALIES come aggiornamento sul pdf del database
- [ ] succede che vengono letti anche i tag di oggetti che non sono contenitori, tipo capi della Decathlon, 3 opzioni
  1. funzione che valida gli epc;
  2. recupero i tag validi da un altra parte, come tabella da kevin,
  3. salvo comunque tutto comunque.
- [ ] integrazione dei DTO
- [ ] rimuovere codice non utilizzato
- [ ] aggiungere campo azienda appartenenza mezzo
- [ ] dare un formato di risposta corretto a tutte le API
- [ ] segnare la posizione dei cantieri con circonferenza, layer comunali
- [ ] implementazione della connessione ed invio email, per alert e recupero dati
- [ ] assegnare tutti i cantieri ai nuovi veicoli
- [ ] utilizzare un canale realtime message tramite redis per gli eventi
- [ ] capire cosa fare con le posizioni in tempo real con lat 0 e lon 0 per mappa frontend
