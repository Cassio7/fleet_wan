import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'session_vehicle_view',
  comment:
    'Mette in correlazione ogni sessione con il corrispettivo veicolo, saltando le posizioni',
})
export class SessionVehicleView {
  @PrimaryColumn({ name: 'session_id' })
  sessionId: number;

  @Column({ name: 'sequence_id' })
  sequenceId: number;

  @Column({ name: 'veid' })
  veId: number;
}
