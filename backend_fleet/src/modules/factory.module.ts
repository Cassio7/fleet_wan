import { Module } from '@nestjs/common';
import { AssociationFactoryService } from 'src/factory/association.factory';
import { BannedVehicleFactoryService } from 'src/factory/bannedVehicle.factory';
import { CompanyFactoryService } from 'src/factory/company.factory';
import { EquipmentFacotoryService } from 'src/factory/equipment.factory';
import { GroupFactoryService } from 'src/factory/group.factory';
import { RentalFactoryService } from 'src/factory/rental.factory';
import { ServiceFactoryService } from 'src/factory/service.factory';
import { UserFactoryService } from 'src/factory/user.factory';
import { WorksiteFactoryService } from 'src/factory/worksite.factory';
import { WorkzoneFactoryService } from 'src/factory/workzone.factory';

@Module({
  providers: [
    AssociationFactoryService,
    BannedVehicleFactoryService,
    CompanyFactoryService,
    EquipmentFacotoryService,
    GroupFactoryService,
    RentalFactoryService,
    ServiceFactoryService,
    UserFactoryService,
    WorksiteFactoryService,
    WorkzoneFactoryService,
  ],
  exports: [
    AssociationFactoryService,
    BannedVehicleFactoryService,
    CompanyFactoryService,
    EquipmentFacotoryService,
    GroupFactoryService,
    RentalFactoryService,
    ServiceFactoryService,
    UserFactoryService,
    WorksiteFactoryService,
    WorkzoneFactoryService,
  ],
})
export class FactoryModule {}
