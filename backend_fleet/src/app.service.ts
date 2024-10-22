import { Injectable, OnModuleInit } from '@nestjs/common';
import { GroupService } from './services/group/group.service';
import { VehicleService } from './services/vehicle/vehicle.service';
import { SessionService } from './services/session/session.service';
@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    private readonly groupService: GroupService,
    private readonly vehicleService: VehicleService,
    private readonly sessionService: SessionService,
  ) {}

  // popolo database all'avvio
  async onModuleInit() {
    //await this.putDbData();
  }
  getHome(): string {
    return 'Fleet App';
  }

  async putDbData() {
    await this.groupService.getGroupList();
    await this.vehicleService.getVehicleList(313);
    const vehicles = await this.vehicleService.getAllVehicles();
    for (const vehicle of vehicles) {
      console.log(vehicle.veId);
      await this.sessionService.getSessionist(
        vehicle.veId,
        '2024-10-20T00:00:00.000Z',
        '2024-10-21T00:00:00.000Z',
      );
      await this.sleep(1000);
    }
  }
  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
