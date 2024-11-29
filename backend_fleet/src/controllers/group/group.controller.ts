import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { GroupService } from 'src/services/group/group.service';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  /**
   * API per tornare tutti i gruppi presenti nel db
   * @param res
   */
  @Get()
  async getAllGroups(@Res() res: Response) {
    try {
      const groups = await this.groupService.getAllGroups();
      res.status(200).json(groups);
    } catch (error) {
      console.error('Errore nel recupero dei gruppi:', error);
      res.status(500).send('Errore durante il recupero dei gruppi');
    }
  }

  /**
   * API per tornare il gruppo in base all id passato
   * @param res
   * @param params id identificativo del gruppo
   */
  @Get('/:id')
  async getGroupById(@Res() res: Response, @Param() params: any) {
    try {
      const group = await this.groupService.getGroupById(params.id);
      res.status(200).json(group);
    } catch (error) {
      console.error('Errore nel recupero del gruppo:', error);
      res.status(500).send('Errore durante il recupero del gruppo');
    }
  }
}
