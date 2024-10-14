import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { GroupService } from 'src/services/group/group.service';


@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Get('update')
  async getGroupList(@Res() res: Response) {
    try {
      const data = await this.groupService.getGroupList();
      res.status(200).send("Group aggiornato");
    } catch (error) {
      console.error('Errore nella richiesta SOAP:', error);
      res.status(500).send('Errore durante la richiesta al servizio SOAP');
    }
  }
}
