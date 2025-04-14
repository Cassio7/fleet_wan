export class Notifica{
  constructor(
    public key: string,
    public author: string,
    public title: string,
    public message: string,
    public isRead: boolean,
    public isButtonDisabled?: boolean //attributo per il timeout del bottone corrispondente alla notifica
  ){}
}
