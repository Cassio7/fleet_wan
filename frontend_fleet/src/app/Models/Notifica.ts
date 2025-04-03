export class Notifica{
  constructor(
    public key: string,
    public author: string,
    public title: string,
    public message: string,
    public isRead: boolean
  ){}
}
