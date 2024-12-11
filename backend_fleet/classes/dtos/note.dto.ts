import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class NoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  vehicleId: number;

  @IsNumber()
  userId: number;
}
