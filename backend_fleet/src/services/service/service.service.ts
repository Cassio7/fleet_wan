import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ServiceDTO } from 'classes/dtos/service.dto';
import { ServiceEntity } from 'classes/entities/service.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(ServiceEntity, 'readOnlyConnection')
    private readonly serviceRepository: Repository<ServiceEntity>,
  ) {}

  async getServices(): Promise<ServiceDTO[]> {
    const services = await this.serviceRepository.find();
    return services.map((service) => this.toDTO(service));
  }

  private toDTO(service: ServiceEntity): ServiceDTO {
    const serviceDTO = new ServiceDTO();
    serviceDTO.id = service.id;
    serviceDTO.createdAt = service.createdAt;
    serviceDTO.updatedAt = service.updatedAt;
    serviceDTO.name = service.name;
    return serviceDTO;
  }
}
