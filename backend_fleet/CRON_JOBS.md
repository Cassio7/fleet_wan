# Cron Jobs in NestJS

Questo file documenta i cron job configurati nell'applicazione NestJS. I cron job sono processi pianificati che vengono eseguiti automaticamente a intervalli definiti, come ad esempio ogni minuto, ora, o giorno.

Ogni job è associato a una funzione che viene eseguita periodicamente, ed è utile per compiti come la gestione di dati, la sincronizzazione con servizi esterni, o l'esecuzione di attività di manutenzione.

## Convenzioni di Documentazione

Ogni cron job viene descritto nel seguente formato:

- **Nome del Job:** Il nome identificativo del cron job
- **Frequenza:** La programmazione dell'esecuzione del job (in formato cron)
- **Descrizione:** Una breve spiegazione di cosa fa il job
- **Nome del Cron (NestJS):** Il nome definito nel decoratore `@Cron()`
- **File:** Il percorso del file in cui è implementato il cron job
- **Note:** Eventuali informazioni aggiuntive o dipendenze

Questa documentazione è utile per chiunque debba gestire, monitorare, o aggiornare i cron job all'interno dell'applicazione.

---

## Elenco dei Cron Jobs

A seguire troverai l'elenco completo di tutti i cron job configurati, con dettagli su ciascuno.

### putDbDataCronOne

- **Frequenza:** Ogni 10 minuti (`*/10 * * * *`)
- **Descrizione:** Inserisce dati nel database dal WSDL.
- **Nome del Cron (NestJS):** `putDbDataCronOne`
- **File:** `src/app.service.ts`
- **Note:**

### putDbDataCronOne

- **Frequenza:** Ogni Lunedi alle 01:22 notte (`22 1 * * 1`)
- **Descrizione:** Inserisce dati nel database e controlla le anomalie, recupera dati bloccati
- **Nome del Cron (NestJS):** `cronDataWeekly`
- **File:** `src/app.service.ts`
- **Note:**

### dailyAnomalyCheck

- **Frequenza:** Ogni giorno prima delle 00 (`59 23 * * *`)
- **Descrizione:** Controlla le anomalie del giorno, fa un ricalcolo
- **Nome del Cron (NestJS):** `dailyAnomalyCheck`
- **File:** `src/app.service.ts`
- **Note:**

### dailyAnomalyCheckCron

- **Frequenza:** Ogni 5 ore e 5 minuti (`5 */5 * * *`)
- **Descrizione:** Controlla le anomalie del giorno, fa un ricalcolo
- **Nome del Cron (NestJS):** `dailyAnomalyCheckCron`
- **File:** `src/app.service.ts`
- **Note:**

### setAnomaly

- **Frequenza:** Ogni 5 ore e 8 minuti (`8 */5 * * *`)
- **Descrizione:** Imposta le anomalie di oggi e last su redis
- **Nome del Cron (NestJS):** `setAnomaly`
- **File:** `src/app.service.ts`
- **Note:**

### setStats

- **Frequenza:** Ogni giorno alle 02:09 di notte (`9 2 * * *`)
- **Descrizione:** Imposta le statische di ogni veicolo su redis
- **Nome del Cron (NestJS):** `setStats`
- **File:** `src/app.service.ts`
- **Note:**

### refreshMaterializedView

- **Frequenza:** Ogni giorno alle 2:05 notte (`5 2 * * *`)
- **Descrizione:** Fa il refresh della vista materializzata dell anno corrente
- **Nome del Cron (NestJS):** `refreshMaterializedView`
- **File:** `src/services/session-vehicle/session-vehicle.service.ts`
- **Note:**
