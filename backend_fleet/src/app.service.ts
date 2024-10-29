import { Injectable, OnModuleInit } from '@nestjs/common';
import { GroupService } from './services/group/group.service';
import { VehicleService } from './services/vehicle/vehicle.service';
import { SessionService } from './services/session/session.service';
import { Cron } from '@nestjs/schedule';
import { TagService } from './services/tag/tag.service';
@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly groupService: GroupService,
    private readonly vehicleService: VehicleService,
    private readonly sessionService: SessionService,
    private readonly tagService: TagService,
  ) {}

  // popolo database all'avvio
  async onModuleInit() {
    await this.putDbData();
  }

  async putDbData() {
    await this.groupService.getGroupList();
    const groups = await this.groupService.getAllGroups();
    for (const group of groups) {
      await this.vehicleService.getVehicleList(group.vgId);
    }
    // const vehicles = await this.vehicleService.getAllVehicles();
    // for (const vehicle of vehicles) {
    //   console.log(`${vehicle.veId} con targa: ${vehicle.plate} - ${vehicle.id}`);
    //   await this.sessionService.getSessionist(
    //     vehicle.veId,
    //     '2024-10-28T00:00:00.000Z',
    //     '2024-10-29T00:00:00.000Z',
    //   );
    // }
    await this.tagService.putTagHistory(
      3677,
      '2024-10-20T00:00:00.000Z',
      '2024-10-27T00:00:00.000Z',
    );
  }

  @Cron('0 0 * * *')
  async putDbDataDaily() {
    const startDate = new Date(
      new Date().getTime() - 24 * 60 * 60 * 1000,
    ).toISOString();
    const endDate = new Date().toISOString();

    await this.groupService.getGroupList();
    const groups = await this.groupService.getAllGroups();
    for (const group of groups) {
      await this.vehicleService.getVehicleList(group.vgId);
    }
    const vehicles = await this.vehicleService.getAllVehicles();
    for (const vehicle of vehicles) {
      console.log(`${vehicle.veId} - ${vehicle.id}`);
      await this.sessionService.getSessionist(vehicle.veId, startDate, endDate);
    }
  }
}
