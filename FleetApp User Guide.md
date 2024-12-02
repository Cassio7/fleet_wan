# Fleet App - Guida Utente
## Indice
1. [Introduzione](#introduzione)
2. [Accesso al Sistema](#accesso-al-sistema)
3. [Gestione dei Ruoli](#gestione-dei-ruoli)
4. [Funzionalità Principali](#funzionalità-principali)
5. [Esempi d'Uso](#esempi-duso)

---

## Introduzione
Fleet App è uno strumento per visualizzare in modo rapido i veicoli aziendali e monitorare e controllare il funzionamento di lettori RFID e antenne.

---
## Accesso al Sistema
1. Apri l'applicazione dal browser.
2. Inserisci le tue credenziali.
3. A seconda del ruolo, vedrai funzionalità specifiche.
---
## Gestione dei Ruoli
### Ruoli Disponibili
- **Admin**: Gestisce utenti e configurazioni, visualizza tutti i dati.
- **Responsabile**: Visualizza i dati di tutti i cantieri e di tutte le società, può modificare le assegnazioni dei veicoli.
- **Capo Cantiere**: Visualizza e analizza i propri dati, relativi ai cantieri assegnati.

### Assegnazione cantieri
I cantieri vengono assegnati in questo modo:

```mermaid
graph LR

Società --> Comune --> Cantiere
```
#### Esempio
```mermaid
graph LR

Gesenu --> Perugia --> Pallotta
```


---
## Funzionalità Principali
### Tutti
- **Dashboard**: Panoramica dei veicoli con i controlli eseguiti.
- **Storico Dati**: Accesso a sessioni e dati registrati.
- **Elenco mezzi**: Avere un report dettagliato con tutte le informazioni di ogni mezzo.

### Admin
- **Amministrazione**:  Gestione di tutti i mezzi e tutti gli utenti.
---
## Utilizzo
TODO