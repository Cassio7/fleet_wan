<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

## Description

Backend Fleet App

## Project setup

Installare tutte le dipendenze necessarie tramite il comando.

```bash
$ npm install
```

Per il corretto funzionamento creare il file `.env`, ed inserire i seguenti dati, cambiando con i propri:

```env
PORT=3000

# Connection DB
DB_HOST=localhost
DB_PORT=1234
DB_USERNAME=user
DB_PASSWORD=psw
DB_DATABASE=database

#JWT
SECRET_TOKEN = insane_password_fleet_baited

REDIS_URL = redis://:psw@localhost:1234
REDIS_PASSWORD = password
REDIS_DB = 0

# User factory data
USER_PASSWORD = psw
ADMIN_EMAIL = admin@nomail.com

# Utente Prova principale
USER1_NAME= Carlo
USER1_SURNMAE= Verdi
USER1_USERNAME= c.verdi
USER1_EMAIL = c.verdi@mail.it
USER1_PASSWORD= PasswordSegreta1

# ogni quanto recupero le posizioni in una sessione, tempo espresso in millisecondi
# OGNI POSIZIONE RAPPRESENTA 30 SECONDI
# con 30000 = 30 secondi
SPAN_POSIZIONI = 30000

# CONTROLLO GPS
# Posizioni minime da controllare (controllo GPS) per una giornata, minimo 15 minuti di viaggio
# MIN_POSITIONS_GPS * SPAN_POSIZIONI in minuti = 15 min
MIN_POSITIONS_GPS = 30
# massima distanza che può fare una sessione
MAX_DISTANCE = 250

# CONTROLLO ANTENNNA
# posizioni minime da controllare per far si che il mezzo venga considerato come sessione valida
# MIN_POSITIONS_ANTENNA SPAN_POSIZIONI in minuti = 3 min
MIN_POSITIONS_ANTENNA = 6



```

Inserire anche la cartella `files` con dentro i file CVS per popolare il database.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

```

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
