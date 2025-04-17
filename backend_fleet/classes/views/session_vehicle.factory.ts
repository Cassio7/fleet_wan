// session-vehicle-schema.factory.ts
import { EntitySchema } from 'typeorm';
import { SessionVehicleBase } from './session_vehicle_base.entity';

// ora ci sono piu viste divise per anno, per evitare di aggiornare sempre la stessa con dati fermi
export function createSessionVehicleSchema(viewName: string): EntitySchema {
  return new EntitySchema<SessionVehicleBase>({
    name: viewName,
    tableName: viewName,
    columns: {
      sessionId: {
        type: Number,
        name: 'session_id',
        primary: true,
      },
      sequenceId: {
        type: Number,
        name: 'sequence_id',
      },
      veId: {
        type: Number,
        name: 'veid',
      },
    },
  });
}
