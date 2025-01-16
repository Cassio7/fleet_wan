export class Note{

  constructor(
    public content: string,
    public id: number,
    public user: {
      id: number,
      username: string
    },
    public vehicle: {
      id: number,
      veId: number
    },
  ){}
}
