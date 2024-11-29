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
      if (company) res.status(200).json(company);
      else res.status(404).json({ message: 'Nessuna società trovata' });
    } catch (error) {
      console.error('Errore nel recupero delle società: ', error);
      res.status(500).json({ message: 'Errore nel recupero delle società.' });
    }
  }

  /**
   * Ritorna la società dove è presente il Veicolo cercato
   * @param res
   * @param params VeId identificativo veicolo
   */
  @Get('vehicle/:veId')
  async getCompanyByVeId(@Res() res: Response, @Param() params: any) {
    try {
      const company = await this.companyService.getCompanyByVeId(params.veId);
      if (company) res.status(200).json(company);
      else
        res.status(404).json({
          message: 'Nessuna società trovata con veId veicolo: ' + params.veId,
        });
    } catch (error) {
      console.error('Errore nel recupero della società:', error);
      res.status(500).json({ message: 'Errore nel recupero della società.' });
    }
  }
  /**
   * Ritorna la società dove è presente il gruppo cercato
   * @param res
   * @param params VgId identificativo del gruppo
   */
  @Get('group/:vgId')
  async getCompanyByVgId(@Res() res: Response, @Param() params: any) {
    try {
      const company = await this.companyService.getCompanyByVgId(params.vgId);
      if (company) res.status(200).json(company);
      else
        res.status(404).json({
          message: 'Nessuna società trovata con vgId comune: ' + params.vgId,
        });
    } catch (error) {
      console.error('Errore nel recupero della società:', error);
      res.status(500).json({ message: 'Errore nel recupero della società.' });
    }
  }
}
