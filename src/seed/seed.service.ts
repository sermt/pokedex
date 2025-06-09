import { AxiosResponse } from './../../node_modules/axios/index.d';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

import { catchError, firstValueFrom, tap } from 'rxjs';
import { AxiosError } from 'axios';
import { PokeResponse, Result } from './intefaces.ts/poke-response';
import { PokemonService } from 'src/pokemon/pokemon.service';

@Injectable()
export class SeedService {
  private readonly baseURL = 'https://pokeapi.co/api/v2/pokemon?limit=650';
  constructor(
    private readonly http: HttpService,
    private readonly pokemonService: PokemonService,
  ) {}
  async populateDB(): Promise<void> {
    const { data } = await firstValueFrom(
      this.http.get<PokeResponse>(this.baseURL).pipe(
        catchError((error: AxiosError) => {
          console.error('Error fetching data from PokeAPI:', error.message);
          throw 'An error happened!';
        }),
      ),
    );

    const pokemonsList = data.results.map((result: Result) => {
      const no = this.extractPokemonNumber(result.url);
      const { name } = result;

      if (no) return { name, no };
      return { name: '', no: 0 };
    });

    await this.pokemonService.createAll(pokemonsList);
  }

  private extractPokemonNumber(url: string): number | null {
    try {
      const parts = url.split('/');
      const meaningfulParts = parts.filter((part) => part !== '');
      const numberString = meaningfulParts[meaningfulParts.length - 1];

      if (numberString === undefined || numberString === null) {
        throw new InternalServerErrorException(
          'No se pudo extraer el número de Pokemon',
        );
      }

      const pokemonNumber = parseInt(numberString, 10);

      if (isNaN(pokemonNumber)) {
        throw new InternalServerErrorException(
          'No se pudo extraer el número de Pokemon',
        );
      }

      return pokemonNumber;
    } catch (error) {
      return null;
    }
  }

  cleanDB(): void {
    this.pokemonService.removeAll();
  }
}
