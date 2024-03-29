import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PokePasteParserService } from 'src/lib/poke-paste-parser.service';
import { TeamMember } from 'src/lib/team-member';

@Component({
  selector: 'app-team',
  templateUrl: './team.component.html',
  styleUrls: ['./team.component.scss']
})
export class TeamComponent {

  constructor(private pokePasteService: PokePasteParserService) {}

  @Input() 
  team: TeamMember[]

  @Output() 
  teamChanged = new EventEmitter<TeamMember[]>()

  @Output()
  pokemonAddedToTeamEvent = new EventEmitter<any>()

  pokePaste = ""
  errorMessagePokePaste: string = ""

  pokemonActivated(position: number) {
    this.team.forEach(teamMember => {
      if (teamMember.position != position) {
        teamMember.active = false
      }
    })
  }

  pokemonRemoved(position: number) {
    const removedTeamMember = this.team.find(teamMember => teamMember.position == position)!
    this.team = this.team.filter(teamMember => teamMember.position != position)    
    
    if (removedTeamMember.active) {
      this.team[0].active = true
    }
    
    this.updatePositions()
    this.teamChanged.emit(this.team)
  }

  async addFromPokePaste() {
    try {
      this.errorMessagePokePaste = ""
      const pokemonList = await this.pokePasteService.parseFromPokePaste(this.pokePaste)
      this.team = []

      for (let index = 0; index < pokemonList.length; index++) {
        const pokemon = pokemonList[index]
        this.team.push(new TeamMember(pokemon, index))        
      }

      this.team[0].active = true
      this.teamChanged.emit(this.team)
    } catch(ex) {
      this.errorMessagePokePaste = "Invalid Poke paste. Check if it is the version with EVs"
    } finally {
      this.pokePaste = ""
    }
  }

  removeAll() {
    const remainingTeamMember = this.team[0]
    remainingTeamMember.active = true
    
    this.team = [remainingTeamMember]
    this.teamChanged.emit(this.team)
  }

  pokemonAddedToTeam() {
    this.updatePositions()
    this.pokemonAddedToTeamEvent.emit()
  }

  private updatePositions() {
    for (let index = 0; index < this.team.length; index++) {
      this.team[index].position = index      
    }
  }

}
