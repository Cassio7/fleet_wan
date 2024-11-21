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
DB_PASSWORD=password
DB_DATABASE=database


#JWT
SECRET_TOKEN = insane_password_fleet_baited
```

Inserire anche la cartella `files` con dentro i file CVS per popolare il database.

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).


## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
