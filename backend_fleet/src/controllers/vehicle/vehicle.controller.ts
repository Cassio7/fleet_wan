import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { VehicleService } from 'src/services/vehicle/vehicle.service';

@Controller('vehicles')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get()
  async getAllVehicles(@Res() res: Response) {
    try {
      const groups = await this.vehicleService.getAllVehicles();
      res.status(200).json(groups);
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
    }
  }

  @Get('reader')
  async getVehiclesByReader(@Res() res: Response) {
    try {
      const groups = await this.vehicleService.getVehiclesByReader();
      res.status(200).json(groups);
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
    }
  }

  /**
   * Ritorna tutti i veicoli dove l'RFID reader non è stato montato
   * @param res 
   */
  @Get('noreader')
  async getVehiclesWithNoReader(@Res() res: Response){
    try {
      const vehicles = await this.vehicleService.getVehiclesWithNoReader();
      res.status(200).json(vehicles);
    } catch(error) {
      res.status(500).send("Errore durante il recupero dei veicoli");
    }
  }  

  /**
   * Ritorna tutti i veicoli "can", ovvero con l'antenna collegata al contachilometri
   * @param res 
   */
  @Get("can")
  async getCanVehicles(@Res() res: Response){
    try{
      const vehicles = await this.vehicleService.getCanVehicles();
      vehicles.length > 0 ? res.status(200).send(vehicles) : res.status(404).send("Nessun veicolo 'can' trovato.");
    }catch(error){
      res.status(500).send("Errore durante il recupero dei veicoli");
    }
  }

  /**
 * Ritorna tutti i veicoli non "can", ovvero con l'antenna non collegata al contachilometri
 * @param res 
  */
  @Get("nocan")
  async getNonCanVehicles(@Res() res: Response){
    try{
      const vehicles = await this.vehicleService.getNonCanVehicles();
      vehicles.length > 0 ? res.status(200).send(vehicles) : res.status(404).send("Nessun veicolo non 'can' trovato.");
    }catch(error){
      res.status(500).send("Errore durante il recupero dei veicoli");
    }
  }

  @Get('/:id')
  async getVehicleById(@Res() res: Response, @Param() params: any) {
    try {
      const group = await this.vehicleService.getVehicleById(params.id);
      res.status(200).json(group);
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
    }
  }

  @Get('group/:id')
  async getVehiclesByGroup(@Res() res: Response, @Param() params: any) {
    try {
      const vehicles = await this.vehicleService.getVehiclesByGroup(params.id);
      res.status(200).json(vehicles);
    } catch (error) {
      console.error('Errore nel recupero dei veicoli:', error);
      res.status(500).send('Errore durante il recupero dei veicoli');
    }
  }

  @Get('/update/:id')
  async getVehicleList(@Res() res: Response, @Param() params: any) {
    try {
      const data = await this.vehicleService.getVehicleList(params.id);

      if (data.length > 0) {
        let resultMessage: string = `Gruppo di aggiornamento id: ${params.id}\n\n`;
        for (const item of data) {
          resultMessage += `Aggiornati Veicolo id: ${item.veId}\n `;
        }
        res.status(200).send(resultMessage);
      } else if (data === false) {
        res
          .status(200)
          .send(`Nessun veicolo trovato per gruppo id: ${params.id}\n`);
      } else res.status(200).send('Nessun aggiornamento');
    } catch (error) {
      console.error('Errore nella richiesta SOAP:', error);
      res.status(500).send('Errore durante la richiesta al servizio SOAP');
    }
  }

  /**
   * API che restituisce il veicolo che ha la targa presa in input 
   * @param res 
   * @param params plate number
   */
  @Get("fetchplate/:plate")
  async getVehicleByPlate(@Res() res: Response, @Param() params: any) {
    const plateNumber = params.plate;
    const vehicle = await this.vehicleService.getVehicleByPlate(plateNumber);

    if(vehicle){
      res.status(200).send(vehicle);
    }else{
      res.status(404).send(`Vehicle with plate number: ${plateNumber} not found.`)
    }
  }
  
}
