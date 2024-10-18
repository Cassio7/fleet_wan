import { Controller, Get, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { GroupService } from 'src/services/group/group.service';

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

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

  @Get('update')
  async getGroupList(@Res() res: Response) {
    try {
      const data = await this.groupService.getGroupList();

      if (data.length > 0) {
        let resultMessage: string = '';
        for (const item of data) {
          resultMessage += `Aggiornato gruppo con id: ${item.vgId}\n`;
        }
        res.status(200).send(resultMessage);
      } else {
        res.status(200).send('Nessun aggiornamento');
      }
    } catch (error) {
      console.error('Errore nella richiesta SOAP:', error);
      res.status(500).send('Errore durante la richiesta al servizio SOAP');
    }
  }
  @Get('/:id')
  async getGroupById(@Res() res: Response, @Param() params: any) {
    try {
      const group = await this.groupService.getGroupById(params.id);
      res.status(200).json(group);
    } catch (error) {
      console.error('Errore nel recupero dei gruppi:', error);
      res.status(500).send('Errore durante il recupero dei gruppi');
    }
  }
}
