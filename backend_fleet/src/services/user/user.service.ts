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
   * Ritorna un utente in base all'username, se esiste
   * @param username username dell'utente
   * @returns ritorna oggetto utente
   */
  async getUserByUsername(username: string): Promise<any> {
    const user = await this.userEntity.findOne({
      where: { username: username },
      relations: {
        user_role: { role: true },
      },
    });
    return user;
  }

  /**
   * Ritorna tutti gli utenti
   * @returns Utenti no password
   */
  async getAllUsers(): Promise<any> {
    const users = await this.userEntity.find({
      select: {
        username: true,
        email: true,
        user_role: {
          id: true,
          role: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      relations: {
        user_role: {
          role: true,
        },
      },
    });
    return users;
  }
}
