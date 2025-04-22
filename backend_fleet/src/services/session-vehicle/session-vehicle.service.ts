import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class SessionVehicleService {
  constructor(
    @InjectDataSource('viewConnection') private readonly connection: DataSource,
  ) {}

  /**
   * Fa il refresh della vista per sessioni associate ad un veicolo
   */
  @Cron('5 2 * * *', { name: 'refreshMaterializedView' })
  async refreshMaterializedView(): Promise<void> {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const currentYear = today.getFullYear();
    const yesterdayYear = yesterday.getFullYear();
    const yearNext = currentYear + 1;
    const viewName = `session_vehicle_${currentYear}`;

    const queryRunner = this.connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      // se è cambiato l'anno creo una nuova vista e aggiorno quella vecchia
      if (yesterdayYear < currentYear) {
        const viewOld = `session_vehicle_${yesterdayYear}`;

        await queryRunner.query(`CREATE MATERIALIZED VIEW ${viewName} as  
        SELECT DISTINCT ON (s.id) s.id AS session_id,
        s.sequence_id,
        v."veId" AS veid
        FROM session s
          JOIN history h ON h."sessionId" = s.id
          JOIN vehicles v ON v.id = h."vehicleId"
        WHERE s.sequence_id <> 0 AND 
        h."timestamp" >= '${currentYear}-01-01 00:00:00+00'::timestamp with time zone AND
        h."timestamp" < '${yearNext}-01-01 00:00:00+00'::timestamp with time zone;`);
        await queryRunner.query(`REFRESH MATERIALIZED VIEW ${viewOld}`);
      } else await queryRunner.query(`REFRESH MATERIALIZED VIEW ${viewName}`);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error(
        'Errore durante il refresh della vista materializzata:',
        error,
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Recupera da tutte le viste il totale dei dettagli calcolati
   * @param veId idenfiticativo veicolo
   * @returns
   */
  async getTotalSessionDetails(
    veId: number,
  ): Promise<{ num_sessions: number; max_sessions: number }> {
    const viewNames = this.generateViewNames(); // Otteniamo i nomi delle viste
    let totalSessions = 0;
    let maxSequence = 0;
    try {
      for (const viewName of viewNames) {
        // Eseguiamo la query per ciascuna vista materializzata
        const result = await this.connection.query(
          `SELECT COUNT(session_id) AS count, MAX(sequence_id) AS max_sequence 
           FROM ${viewName} 
           WHERE veid = ${veId}`,
        );
        // Sommiamo il risultato per ogni vista
        totalSessions += parseInt(result[0].count, 10);
        maxSequence = Math.max(maxSequence, result[0].max_sequence ?? 0);
      }

      return {
        num_sessions: totalSessions,
        max_sessions: maxSequence,
      };
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Genera il nome delle viste partendo dal 2024 fino all'anno odierno +1
   * @returns
   */
  private generateViewNames(): string[] {
    const currentYear = new Date().getFullYear();
    const viewNames: string[] = [];

    // Creiamo le viste per l'anno corrente e l'anno successivo
    for (let year = 2024; year < currentYear + 1; year++) {
      viewNames.push(`session_vehicle_${year}`);
    }

    return viewNames;
  }
}
