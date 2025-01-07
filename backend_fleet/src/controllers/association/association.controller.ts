import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Res,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { UserDTO } from 'classes/dtos/user.dto';
import { Role } from 'classes/enum/role.enum';
import { Response } from 'express';
import { Roles } from 'src/decorators/roles.decorator';
import { AuthGuard } from 'src/guard/auth.guard';
import { RolesGuard } from 'src/guard/roles.guard';
import { AssociationService } from 'src/services/association/association.service';
import { CompanyService } from 'src/services/company/company.service';
import { UserService } from 'src/services/user/user.service';
import { WorksiteService } from 'src/services/worksite/worksite.service';

@UseGuards(AuthGuard, RolesGuard)
@Controller('association')
export class AssociationController {
  constructor(
    private readonly associationService: AssociationService,
    private readonly userService: UserService,
    private readonly companyService: CompanyService,
    private readonly worksiteService: WorksiteService,
  ) {}

  /**
   * Recupera tutti le associazioni di ogni utente registrato
   * @param res
   * @returns
   */
  @Roles(Role.Admin)
  @Get()
  async getAllAssociation(@Res() res: Response) {
    try {
      const association = await this.associationService.getAllAssociation();
      if (!association)
        return res
          .status(404)
          .json({ message: 'Nessuna associazione trovata' });
      return res.status(200).json(association);
    } catch (error) {
      console.error('Errore nel recupero delle associazioni:', error);
      res
        .status(500)
        .json({ message: 'Errore nel recupero delle associazioni.' });
    }
  }

  /**
   * API per inserire una nuova associazione tra un cantiere/società ed un utente,
   * rispettando il ruolo associato e la visualizzazione corretta
   * @param res
   * @param userDTO id utente
   * @param body worksiteId oppure companyId
   * @returns
   */
  @Roles(Role.Admin)
  @Post()
  async createAssociation(
    @Res() res: Response,
    @Body() userDTO: UserDTO,
    @Body() body: any,
  ) {
    try {
      let association = null;
      // controllo utente inserito
      const user = await this.userService.getUserById(userDTO.id);
      if (!user) return res.status(404).json({ message: 'Utente non trovato' });
      // controllo il ruolo dell'utente per stabilire se assegnare un cantiere o una societa
      if (user.role === 'Admin' || user.role === 'Responsabile') {
        // se viene selezionato un cantiere errore
        if (body.worksiteId)
          return res.status(403).json({
            message: 'Non puoi inserire il cantiere per questo utente',
          });
        // se la societa è stata seleziona ed esiste allora mando la creazione
        if (body.companyId) {
          const company = await this.companyService.getCompanyById(
            body.companyId,
          );
          if (!company)
            return res.status(404).json({ message: 'Societa non trovata' });
          association = await this.associationService.createAssociation(
            user,
            company,
            null,
          );
        } else
          return res.status(404).json({ message: 'Seleziona una societa' });
      }
      // utente capo cantiere sicuro
      else {
        // se viene selezionato una società errore
        if (body.companyId)
          return res.status(403).json({
            message: 'Non puoi inserire una societa per questo utente',
          });
        // se il cantiere è stato seleziono ed esiste allora mando la creazione
        if (body.worksiteId) {
          const worksite = await this.worksiteService.getWorksiteById(
            body.worksiteId,
          );
          if (!worksite)
            return res.status(404).json({ message: 'Cantiere non trovato' });
          association = await this.associationService.createAssociation(
            user,
            null,
            worksite,
          );
        } else
          return res.status(404).json({ message: 'Seleziona un cantiere' });
      }
      // se il ritorno è true, successo, se ritorna null allora il cantiere/società è duplicato
      if (association)
        return res
          .status(200)
          .json({ message: 'Associazione inserita con successo!' });
      else
        return res.status(409).json({
          message:
            'Il cantiere o la società inserita è già associata all utente',
        });
    } catch (error) {
      console.error(
        'Errore nella registrazione della nuova associazione:',
        error,
      );
      res.status(500).json({
        message: 'Errore nella registrazione della nuova associazione',
      });
    }
  }

  /**
   * API per eliminare una associazione in base all id inserito
   * @param res
   * @param id identificativo del associazione
   * @returns
   */
  @Roles(Role.Admin)
  @Delete(':id')
  @UsePipes(ParseIntPipe)
  async deleteAssociation(@Res() res: Response, @Param('id') id: number) {
    try {
      if (!(await this.associationService.deleteAssociation(id)))
        return res.status(404).json({ message: 'Associazione non trovata' });
      return res
        .status(200)
        .json({ message: 'Associazione eliminata con successo!' });
    } catch (error) {
      console.error('Errore nella eliminazione della associazione:', error);
      res.status(500).json({
        message: 'Errore nella eliminazione della associazione',
      });
    }
  }
}
