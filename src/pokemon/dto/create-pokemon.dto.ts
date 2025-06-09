import { IsInt, IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreatePokemonDto {
  @IsInt()
  @IsNumber()
  @Min(1)
  no: number;

  @IsString()
  @MinLength(1)
  name: string;
}
