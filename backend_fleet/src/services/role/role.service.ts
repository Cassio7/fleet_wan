import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleEntity } from 'classes/entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(RoleEntity, 'readOnlyConnection')
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}
  /**
   * Recupera un ruolo in base al nome associato soltanto dentro server
   * @param name nome del ruolo
   * @returns
   */
  async getRoleByName(name: string): Promise<RoleEntity> {
    const role = await this.roleRepository.findOne({
      where: {
        name: name,
      },
    });
    return role;
  }
}
