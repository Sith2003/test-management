import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SuiteOrderItem {
  @IsUUID()
  suiteId!: string;

  @IsInt()
  @Min(0)
  order!: number;
}

export class ReorderSuitesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SuiteOrderItem)
  orders!: SuiteOrderItem[];
}
