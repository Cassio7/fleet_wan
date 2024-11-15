import { CompanyFactoryService } from './factory/company.factory';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { GroupService } from './services/group/group.service';
import { VehicleService } from './services/vehicle/vehicle.service';
import { SessionService } from './services/session/session.service';
import { Cron } from '@nestjs/schedule';
import { TagService } from './services/tag/tag.service';
import { UserFactoryService } from './factory/user.factory';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly groupService: GroupService,
    private readonly vehicleService: VehicleService,
    private readonly sessionService: SessionService,
    private readonly tagService: TagService,
    private readonly userFactoryService: UserFactoryService,
    private readonly companyFactoryService: CompanyFactoryService,
  ) {}

  // popolo database all'avvio
  async onModuleInit() {
    //await this.putDefaultData();
    //await this.putDbData();
    //await this.putDbData5min();
  }

  async putDefaultData() {
    await this.userFactoryService.createDefaultUser();
    await this.userFactoryService.createDefaultRoles();
    await this.userFactoryService.createDefaultUserRoles();
    await this.companyFactoryService.createDefaultCompanies();
  }

  async putDbData() {
    const startDate = '2024-10-28T00:00:00.000Z';
    const endDate = '2024-10-31T00:00:00.000Z';
    //const endDate = new Date().toISOString();
    await this.groupService.setGroupList(254);
    const groups = await this.groupService.getAllGroups();
    for (const group of groups) {
      await this.vehicleService.getVehicleList(group.vgId);
    }
    const vehicles = await this.vehicleService.getAllVehicles();
    for (const vehicle of vehicles) {
      console.log(
        `${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
      );
      await this.sessionService.getSessionist(vehicle.veId, startDate, endDate);
    }
    for (const vehicle of vehicles) {
      console.log(
        `${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
      );
      await this.tagService.putTagHistory(vehicle.veId, startDate, endDate);
    }
  }

  // @Cron('0 0 * * *')
  // async putDbDataDaily() {
  //   const startDate = new Date(
  //     new Date().getTime() - 24 * 60 * 60 * 1000,
  //   ).toISOString();
  //   const endDate = new Date().toISOString();

  //   await this.groupService.getGroupList();
  //   const groups = await this.groupService.getAllGroups();
  //   for (const group of groups) {
  //     await this.vehicleService.getVehicleList(group.vgId);
  //   }
  //   const vehicles = await this.vehicleService.getAllVehicles();
  //   for (const vehicle of vehicles) {
  //     console.log(`${vehicle.veId} - ${vehicle.id}`);
  //     await this.sessionService.getSessionist(vehicle.veId, startDate, endDate);
  //   }
  // }

  //@Cron('*/5 * * * *')
  async putDbData5min() {
    const startDate = new Date(
      new Date().getTime() - 5 * 60 * 1000, // 5 minuti
    ).toISOString();
    const endDate = new Date().toISOString();

    await this.groupService.setGroupList(254);
    const groups = await this.groupService.getAllGroups();
    for (const group of groups) {
      await this.vehicleService.getVehicleList(group.vgId);
    }
    const vehicles = await this.vehicleService.getAllVehicles();
    for (const vehicle of vehicles) {
      console.log(
        `${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
      );
      await this.sessionService.getSessionist(vehicle.veId, startDate, endDate);
    }
    for (const vehicle of vehicles) {
      console.log(
        `${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`,
      );
      await this.tagService.putTagHistory(vehicle.veId, startDate, endDate);
    }
  }
}
