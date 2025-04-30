import { IsOptional, IsString } from 'class-validator';
import { CommonDTO } from 'src/classes/dtos/common.dto';
export class RentalDTO extends CommonDTO {
  @IsOptional()
  @IsString()
  name?: string | null;
}
