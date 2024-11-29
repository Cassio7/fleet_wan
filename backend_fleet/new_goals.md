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
- [ ] restituire i detection quality in base al veicolo per creare una futuro grafico con media
- [ ] assegnare tutti i cantieri ai nuovi veicoli
- [ ] rimuovere codice non utilizzato
- [ ] dare un formato di risposta corretto a tutte le API
- [ ] pensare a tabella di appoggio per alloracare i controlli per tutti i veicoli con GPS, Antenna e Sessione
- [ ] segnare la posizione dei cantieri con circonferenza, layer comunali
- [ ] risoluzione posizione con openstreetmap [reverse](https://nominatim.org/release-docs/develop/api/Reverse/)
- [ ] succede che vengono letti anche i tag di oggetti che non sono contenitori, tipo capi della Decathlon, 3 opzioni
  1.  funzione che valida gli epc,
  2.  recupero i tag validi da un altra parte, come tabella da kevin,
  3.  salvo comunque tutto comunque
- [ ] tabella di appoggio con i dati degl'ultimi controlli, così da riprendere i dati da li invece che fare una request, per la dashboard principale.