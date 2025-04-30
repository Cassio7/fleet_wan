import { IsNotEmpty, IsString } from 'class-validator';
import { CommonDTO } from 'src/classes/dtos/common.dto';

export class NoteDto extends CommonDTO {
  @IsString()
  @IsNotEmpty()
  author: string;
  @IsString()
  @IsNotEmpty()
  content: string;
}
