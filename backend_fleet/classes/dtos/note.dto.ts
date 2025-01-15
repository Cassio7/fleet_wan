import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class NoteDto {
  @IsNumber()
  id: number;
  @IsString()
  @IsNotEmpty()
  content: string;
}
