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
# Connection DB
DB_HOST=localhost
DB_PORT=1234
DB_USERNAME=user
DB_PASSWORD=psw
DB_DATABASE=database

#JWT
SECRET_TOKEN = insane_password_fleet_baited

REDIS_URL = redis://:psw@localhost:1234

# User factory data
USER_PASSWORD = psw
ADMIN_EMAIL = admin@nomail.com

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
