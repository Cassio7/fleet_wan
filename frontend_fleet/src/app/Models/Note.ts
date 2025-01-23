export class Note{

  constructor(
    public content: string,
    public id: number,
    public updatedAt: string,
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
