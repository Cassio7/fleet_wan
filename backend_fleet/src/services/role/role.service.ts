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
   * Recupera tutti i ruoli presenti
   * @returns
   */
  async getAllRoles(): Promise<any> {
    const roles = await this.roleRepository.find();
    return roles;
  }
  /**
   * Recupera un ruolo in base al nome associato
   * @param name
   * @returns
   */
  async getRoleByName(name: string): Promise<any> {
    const role = await this.roleRepository.findOne({
      where: {
        name: name,
      },
    });
    return role;
  }
}
