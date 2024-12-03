import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'classes/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity, 'readOnlyConnection')
    private readonly userEntity: Repository<UserEntity>,
  ) {}

  /**
   * Ritorna tutti gli utenti
   * @returns Utenti no password
   */
  async getAllUsers(): Promise<any> {
    const users = await this.userEntity.find({
      select: {
        username: true,
        name: true,
        surname: true,
        email: true,
      },
    });
    return users;
  }
  /**
   * Ritorna un utente in base all'username, se esiste
   * @param username username dell'utente
   * @returns ritorna oggetto utente
   */
  async getUserByUsername(username: string): Promise<any> {
    const user = await this.userEntity.findOne({
      where: { username: username },
    });
    return user;
  }

  /**
   * Ritorna utente in base all'id
   * @param id id utente
   * @returns oggetto utente
   */
  async getUserById(id: number): Promise<any> {
    const user = await this.userEntity.findOne({
      where: { id: id },
      relations: {
        role: true,
      },
    });
    return user;
  }
}
