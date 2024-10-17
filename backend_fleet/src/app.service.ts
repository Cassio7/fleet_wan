import { Injectable, OnModuleInit } from '@nestjs/common';
import { GroupService } from './services/group/group.service';
import { VehicleService } from './services/vehicle/vehicle.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly groupService: GroupService,
    private readonly vehicleService: VehicleService,
  ) {}
  
  // popolo database all'avvio
  async onModuleInit() {
    await this.groupService.getGroupList();
    //await this.vehicleService.getVehicleList(313);
  }
  getHome(): string {
    return 'Fleet App';
  }
}
