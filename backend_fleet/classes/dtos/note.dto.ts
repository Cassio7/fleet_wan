import { IsNotEmpty, IsString } from 'class-validator';
import { CommonDTO } from 'classes/dtos/common.dto';

export class NoteDto extends CommonDTO {
  @IsString()
  @IsNotEmpty()
  content: string;
}
