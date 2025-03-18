import { Injectable } from '@angular/core';
import { User } from '../../../Models/User';
import { BehaviorSubject } from 'rxjs';

export interface GestioneFilters {
  usernameResearch: string,
  selectedRoles: string[]
}
@Injectable({
  providedIn: 'root'
})
export class GestioneService {
  private readonly _filterUsers$: BehaviorSubject<GestioneFilters | null> = new BehaviorSubject<GestioneFilters | null>(null);

  constructor() { }

  /**
   * Filtra gli utenti passati per i ruoli selezionati
   * @param selectedRoles ruoli selezionati
   * @param users utenti da filtrare
   * @returns array di utenti filtrati
   */
  filterUsersByRoles(selectedRoles: string[], users: User[]): User[]{
    return users.filter(user => selectedRoles.includes(user.role));
  }

  /**
   * Filtra gli utenti passati per la ricerca per una ricerca di username su un campo di input di testo
   * @param usernameResearch ricerca di username
   * @param users utenti da filtrare
   * @returns array di utenti filtrati
   */
  filterUsersByUsernameResearch(usernameResearch: string, users: User[]): User[] {
    const search = usernameResearch.trim().toLowerCase();
    return users.filter(user =>
      user.username && user.username.toLowerCase().includes(search)
    );
  }


  /**
   * Filtra gli utenti per ricerca su username e ruoli selezionati
   * @param users utenti da filtrare
   * @param filters oggetto GestioneFilters contenente il valore dei filtri
   * @returns array di utenti filtrati per ricerca su username e ruoli selezionati
   */
  filterUsersByUsernameResearchAndRoles(users: User[], filters: GestioneFilters): User[] {
    const { usernameResearch, selectedRoles } = filters;

    if (!usernameResearch && (!selectedRoles || selectedRoles.length === 0)) {
      return [];
    }

    const usernameFilteredUsers = usernameResearch
      ? this.filterUsersByUsernameResearch(usernameResearch, users)
      : users;

    const rolesFilteredUsers = (selectedRoles && selectedRoles.length > 0)
      ? this.filterUsersByRoles(selectedRoles, users)
      : users;

    const rolesUserIds = new Set(rolesFilteredUsers.map(user => user.id));

    return usernameFilteredUsers.filter(user => rolesUserIds.has(user.id));
  }

  public get filterUsers$(): BehaviorSubject<GestioneFilters | null> {
    return this._filterUsers$;
  }
}
