import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name) private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.trim().toLowerCase();

    try {
      const pokemon = await this.pokemonModel.create(createPokemonDto);
      return pokemon;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async findAll(limit: number = 10, offset: number = 0) {
    return await this.pokemonModel
      .find()
      .limit(limit)
      .skip(offset)
      .select('-__v')
      .sort({ no: 1 });
  }

  async findOne(term: string) {
    let pokemon: Pokemon | null = null;

    if (!isNaN(+term) && /^\d+$/.test(term)) {
      pokemon = await this.pokemonModel.findOne({ no: +term });
    }

    if (!pokemon && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById(term);
    }

    if (!pokemon) {
      pokemon = await this.pokemonModel.findOne({
        name: term.toLowerCase().trim(),
      });
    }

    if (!pokemon) {
      throw new NotFoundException(`Pokemon not found with term: "${term}"`);
    }

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);

    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase().trim();
    }

    try {
      const updated = await this.pokemonModel.findByIdAndUpdate(
        pokemon._id,
        updatePokemonDto,
        { new: true },
      );
      return updated;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async remove(id: string) {
    try {
      const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });

      if (deletedCount === 0) {
        throw new NotFoundException(`Pokemon with id "${id}" not found`);
      }
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async removeAll() {
    try {
      const { deletedCount } = await this.pokemonModel.deleteMany({});

      if (deletedCount === 0) {
        throw new NotFoundException(`Pokemon not found`);
      }
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async createAll(pokemons: CreatePokemonDto[]) {
    try {
      const created = await this.pokemonModel.create(pokemons);
      return created;
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  private handleExceptions(error: any): never {
    if (error.code === 11000) {
      throw new BadRequestException(
        `Duplicate key error: ${JSON.stringify(error.keyValue)}`,
      );
    }

    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    console.error('Unhandled error:', error);

    throw new InternalServerErrorException(
      'Unexpected error occurred. Please check server logs.',
    );
  }
}
