import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from 'classes/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity, 'mainConnection')
    private readonly userEntity: Repository<UserEntity>,
  ) {}
  async getUserByUsername(username: string): Promise<any> {
    const user = await this.userEntity.findOne({
      where: { username: username },
      relations: {
        user_role: { role: true },
      },
    });
    return user;
  }
}
