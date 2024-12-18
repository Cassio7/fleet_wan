import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { CompanyService } from 'src/services/company/company.service';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}
  /**
   * Recupera tutte le società salvate
   * @param res
   */
  @Get()
  async getAllCompany(@Res() res: Response) {
    try {
      const company = await this.companyService.getAllCompany();
      res.status(200).json(company);
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
    }
  }

  /**
   * Ritorna la società dove è presente il Veicolo cercato
   * @param res VeId identificativo veicolo
   * @param params
   */
  @Get('/:veId')
  async getCompanyByVeId(@Res() res: Response, @Param() params: any) {
    try {
      const company = await this.companyService.getCompanyByVeId(params.veId);
      res.status(200).json(company);
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
    }
  }
}
