import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { GroupDTO } from 'classes/dtos/group.dto';
import { GroupEntity } from 'classes/entities/group.entity';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupEntity, 'readOnlyConnection')
    private readonly groupRepository: Repository<GroupEntity>,
    @InjectDataSource('mainConnection')
    private readonly connection: DataSource,
  ) {}

  /**
   * Recupera tutti i comuni
   * @returns oggetto DTO
   */
  async getAllGroups(): Promise<GroupDTO[]> {
    try {
      const groups = await this.groupRepository.find({
        order: {
          id: 'ASC',
        },
        relations: {
          worksite: true,
        },
      });
      return groups.map((group) => this.toDTO(group));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero dei comuni per admin`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Recupera il comune passato con id
   * @param id id del comune
   * @returns
   */
  async getGroupById(id: number): Promise<GroupDTO | null> {
    try {
      const group = await this.groupRepository.findOne({
        where: { id: id },
        relations: {
          worksite: true,
        },
      });
      return group ? this.toDTO(group) : null;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Errore durante recupero del comune`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Crea il DTO da inviare 
   * @param group oggetto entità
   * @returns DTO
   */
  private toDTO(group: GroupEntity): GroupDTO {
    const groupDTO = new GroupDTO();
    groupDTO.id = group.id;
    groupDTO.createdAt = group.createdAt;
    groupDTO.updatedAt = group.updatedAt;
    groupDTO.name = group.name;
    groupDTO.vgId = group.vgId;
    groupDTO.worksiteCount = group.worksite.length;
    return groupDTO;
  }
}
