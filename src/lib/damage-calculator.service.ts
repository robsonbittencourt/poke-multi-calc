import { Injectable } from '@angular/core';
import { calculate, Field, Generations, Move, Result } from '@smogon/calc';
import { StatIDExceptHP } from '@smogon/calc/dist/data/interface';
import { DamageResult } from './damage-result';
import { Pokemon } from './pokemon';

@Injectable({
  providedIn: 'root'
})
export class DamageCalculatorService {

  calcDamage(attacker: Pokemon, target: Pokemon, move: string, field: Field, criticalHit: boolean = false): DamageResult {
    const gen = Generations.get(9)
    const moveSmogon = new Move(gen, move)
    moveSmogon.isCrit = criticalHit

    attacker = this.adjustCommander(attacker)
    target = this.adjustCommander(target)

    this.adjustParadoxAbility(attacker)

    const result = calculate(gen, attacker.pokemonSmogon, target.pokemonSmogon, moveSmogon, field)

    return new DamageResult(result.moveDesc(), this.koChance(result), this.maxPercentageDamage(result))
  }

  private koChance(result: Result): string {
    try {
      return result.kochance().text
    } catch (ex) {
      return "Does not cause any damage"
    }
  }

  private maxPercentageDamage(result: Result): number {
    return +result.moveDesc().substring(result.moveDesc().indexOf("- ") + 1, result.moveDesc().lastIndexOf("%"))
  }

  private adjustCommander(pokemon: Pokemon): Pokemon {
    let adjustedPokemon = pokemon
    
    if(pokemon.commanderActivated) {
      adjustedPokemon = pokemon.clone()
      adjustedPokemon.incrementBoostsPlusTwo()
    }

    return adjustedPokemon
  }

  private adjustParadoxAbility(pokemon: Pokemon) {
    if (pokemon.paradoxAbilityActivated) {
      pokemon.pokemonSmogon.boostedStat = this.higherStat(pokemon)
    } else {
      pokemon.pokemonSmogon.boostedStat = undefined
    }
  }

  private higherStat(pokemon: Pokemon): StatIDExceptHP {
    let bestStat = this.getModifiedStat(pokemon, "atk")
    let bestStatDescription: StatIDExceptHP = "atk"

    const def = this.getModifiedStat(pokemon, "def")    
    if (def > bestStat) {
      bestStat = def
      bestStatDescription = "def"
    }

    const spa = this.getModifiedStat(pokemon, "spa")    
    if (spa > bestStat) {
      bestStat = spa
      bestStatDescription = "spa"
    }

    const spd = this.getModifiedStat(pokemon, "spd")    
    if (spd > bestStat) {
      bestStat = spd
      bestStatDescription = "spd"
    }

    const spe = this.getModifiedStat(pokemon, "spe")    
    if (spe > bestStat) {
      bestStat = spe
      bestStatDescription = "spe"
    }

    return bestStatDescription
  }


  private getModifiedStat(pokemon: Pokemon, stat: StatIDExceptHP): number {
    return this.getModifiedStatFromBoosters(pokemon.pokemonSmogon.rawStats[stat], pokemon.pokemonSmogon.boosts[stat])
  }

  //smogon/damage-calc/calc/src/mechanics/util.ts
  private getModifiedStatFromBoosters(stat: number, mod: number): number {
    const numerator = 0
    const denominator = 1
    const modernGenBoostTable = [
      [2, 8],
      [2, 7],
      [2, 6],
      [2, 5],
      [2, 4],
      [2, 3],
      [2, 2],
      [3, 2],
      [4, 2],
      [5, 2],
      [6, 2],
      [7, 2],
      [8, 2],
    ];
    stat = this.OF16(stat * modernGenBoostTable[6 + mod][numerator])
    stat = Math.floor(stat / modernGenBoostTable[6 + mod][denominator])

    return stat;
  }

  private OF16(n: number) {
    return n > 65535 ? n % 65536 : n;
  }

}
