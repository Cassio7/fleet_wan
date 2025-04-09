import { InjectRepository } from '@nestjs/typeorm';
import { Get, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { WorkzoneEntity } from 'classes/entities/workzone.entity';

@Injectable()
export class WorkzoneService {
    constructor(
        @InjectRepository(WorkzoneEntity, 'readOnlyConnection')
        private readonly workzoneRepository: Repository<WorkzoneEntity>
    ){}

    async getAllWorkzone(){
        try{
            return await this.workzoneRepository.find({
                select: {
                    id: true,
                    name: true
                }
            });
        }catch(error){
            throw new HttpException(
            `Errore durante il recupero delle workzone`,
            HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}
