import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { SessionVehicleView } from 'classes/views/session_vehicle.view';
import { Repository } from 'typeorm';

@Injectable()
export class SessionVehicleService {
  constructor(
    @InjectRepository(SessionVehicleView, 'viewConnection')
    private readonly sessionVehicleRepository: Repository<SessionVehicleView>,
  ) {}

  /**
   * Fa il refresh della vista per sessioni associate ad un veicolo
   */
  //@Cron('5 2 * * *')
  async refreshMaterializedView() {
    await this.sessionVehicleRepository.query(
      'REFRESH MATERIALIZED VIEW public.session_vehicle_view',
    );
  }

  /**
   * Recupera dalla vista le sessioni effettive salvate e quelle veritiere del mezzo
   * @param veId identificativo del mezzo
   * @returns
   */
  async getSessionDetails(
    veId: number,
  ): Promise<{ num_sessions: number; max_sessions: number }> {
    try {
      const result = await this.sessionVehicleRepository
        .createQueryBuilder('session')
        .select('COUNT(session.session_id)', 'count')
        .addSelect('MAX(session.sequence_id)', 'max_sequence')
        .where('session.veid = :veId', { veId })
        .getRawOne();

      return {
        num_sessions: parseInt(result.count, 10),
        max_sessions: result.max_sequence ?? 0,
      };
    } catch (error) {
      console.log(error);
    }
  }
}
