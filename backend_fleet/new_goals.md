# Obiettivi

- [ ] segnare la posizione dei cantieri con circonferenza, layer comunali
- [ ] risoluzione posizione con openstreetmap [reverse](https://nominatim.org/release-docs/develop/api/Reverse/)
- [x] cambiare entità per groups e integrare il discorso dei cantieri, sede e comune
- [x] note come tabella connessa a veicolo per diversificare chi scrive note
- [x] realizzare la parte di login con autenticazione, bycrypt e jwtToken
- [ ] succede che vengono letti anche i tag di oggetti che non sono contenitori, tipo capi della Decathlon, 3 opzioni
	1. funzione che valida gli epc,
	2. recupero i tag validi da un altra parte, come tabella da kevin,
	3. salvo comunque tutto comunque
- [x] inserire il campo mezzi dismessi di tipo date
- [x] recuperare i veicoli da file csv
- [ ] ottimizzazione inserimento dati
- [x] altra connessione al database per gli inserimenti per evitare attese e peso aggiuntivo.
- [x] entità per role_company
- [ ] i veicoli che hanno salvato bene l'ultima sessione e lettura ma smette di funzionare di botto non viene gestito, fare un controllo incrociato tra lastEvent e lastSessionEvent e controllore la differenza di giorni tra i 2, creare una pagina dove viene stampata sta differenza.