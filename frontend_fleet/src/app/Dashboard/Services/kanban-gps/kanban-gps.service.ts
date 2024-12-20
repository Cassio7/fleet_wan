import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KanbanGpsService {
  private _loadKanbanGps$: BehaviorSubject<string> = new BehaviorSubject<string>("");
  workingItems: string[] = [];
  warningItems: string[] = [];
  errorItems: string[] = [];

  newWorkingItem: string = '';
  newWarningItem: string = '';
  newErrorItem: string = '';

  constructor() { }

  /**
   * Aggiunge un item ad una colonna del kanban GPS
   * @param column colonna sulla quale aggiungere
   */
  addItem(column: 'working' | 'warning' | 'error') {
    switch (column) {
      case 'working':
        if (this.newWorkingItem.trim()) {
          this.workingItems.push(this.newWorkingItem.trim());
          this.newWorkingItem = '';
        }
        break;
      case 'warning':
        if (this.newWarningItem.trim()) {
          this.warningItems.push(this.newWarningItem.trim());
          this.newWarningItem = '';
        }
        break;
      case 'error':
        if (this.newErrorItem.trim()) {
          this.errorItems.push(this.newErrorItem.trim());
          this.newErrorItem = '';
        }
        break;
    }
  }

  /**
   * Rimuove un item da una colonna del kanban GPS
   * @param column colonna dalla quale rimuovere
   * @param item item da rimuovere
   */
  removeItem(column: 'working' | 'warning' | 'error', item: string) {
    switch (column) {
      case 'working':
        this.workingItems = this.workingItems.filter(i => i !== item);
        break;
      case 'warning':
        this.warningItems = this.warningItems.filter(i => i !== item);
        break;
      case 'error':
        this.errorItems = this.errorItems.filter(i => i !== item);
        break;
    }
  }



  public get loadKanbanGps$(): BehaviorSubject<string> {
    return this._loadKanbanGps$;
  }
  public set loadKanbanGps$(value: BehaviorSubject<string>) {
    this._loadKanbanGps$ = value;
  }
}
