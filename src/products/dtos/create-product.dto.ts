import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateProductDto {
  @IsString()
  @MinLength(6)
  @MaxLength(32)
  readonly title: string;

  @IsString()
  @MinLength(32)
  @MaxLength(1024)
  readonly description: string;
}
