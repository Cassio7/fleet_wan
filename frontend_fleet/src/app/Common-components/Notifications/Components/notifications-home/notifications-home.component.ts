import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { firstValueFrom, skip, Subject, takeUntil } from 'rxjs';
import { NavigationService } from '../../../../Common-services/navigation/navigation.service';
import { NotificationService } from '../../../../Common-services/notification/notification.service';
import { SessionStorageService } from '../../../../Common-services/sessionStorage/session-storage.service';
import { Notifica } from '../../../../Models/Notifica';
import { NotificationsFiltersComponent } from "../notifications-filters/notifications-filters.component";
import { NotificationsTableComponent } from "../notifications-table/notifications-table.component";
import { openSnackbar } from '../../../../Utils/snackbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-notifications-home',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    NotificationsTableComponent,
    NotificationsFiltersComponent
],
  templateUrl: './notifications-home.component.html',
  styleUrl: './notifications-home.component.css'
})
export class NotificationsHomeComponent implements OnInit{
  private readonly destroy$: Subject<void> = new Subject<void>();

  snackbar: MatSnackBar = inject(MatSnackBar);

  notifiche: Notifica[] = [];
  displayedNotifiche: Notifica[] = [];

  isAllRead: boolean = false;
  isAllUnread: boolean = false;

  loading: boolean = false; //variabile flag per impostare la visibilità del caricamento tramite lo spinner

  newNotifications: Notifica[] = [];

  goBack_text: string = "";
  previous_url: string = "/dashboard";


  constructor(
    private notificationService: NotificationService,
    private navigationService: NavigationService,
    private sessionStorageService: SessionStorageService,
    private cd: ChangeDetectorRef,
    private router: Router
  ){}

  async ngOnInit() {
    this.previous_url = this.navigationService.getPreviousUrl() || "";

    if (this.previous_url) {
      this.sessionStorageService.setItem('navbar_previous_url', this.previous_url);
    } else if (this.sessionStorageService.getItem('navbar_previous_url')) {
      this.previous_url = this.sessionStorageService.getItem('navbar_previous_url');
    }

    this.goBack_text = this.navigationService.getGoBackTextByUrl(this.previous_url);

    this.notifiche = await this.getAllNotifications();
    this.displayedNotifiche = this.notifiche;

    this.isAllRead = this.checkIsAllRead();
    this.isAllUnread = this.checkIsAllUnread();

    this.handleNewNotification();
    this.handleUpdatedNotification();
    this.handleNotificationDelete();
  }

  /**
   * Gestisce l'ottenimento di tutte le notifiche, le salva e le visualizza nella tabella
   */
  handleGetAllNotifications(){
    this.displayedNotifiche = [];
    this.newNotifications = [];
    this.notificationService.getAllNotifications().pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (notifiche: Notifica[]) => {
        this.notifiche = notifiche;
        this.displayedNotifiche = notifiche;
        this.cd.detectChanges();
      },
      error: error => console.error("Errore nell'ottenimento di tutte le notifiche: ", error)
    });
  }

  /**
   * Imposta tutte le notifiche come "lette"
   */
  readAll(){
    this.loading = true;
    this.notificationService.toggleAllNotificationToRead(true).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: {message: string}) => {
        this.notifiche.forEach(notifica => {
          notifica.isRead = true;
          this.notificationService.updatedNotification$.next(notifica);
          this.isAllRead = true;
          this.isAllUnread = false;
          this.loading = false;
        });
        openSnackbar(this.snackbar, "Tutte le notifiche sono segnate come 'lette'");
      },
      error: error => console.error("Errore nell'impostare tutte le notifiche a 'letta'", error)
    });
  }

  /**
   * Imposta tutte le notifiche come "non lette"
   */
  unreadAll(){
    this.loading = true;
    this.notificationService.toggleAllNotificationToRead(false).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response: {message: string}) => {
        this.notifiche.forEach(notifica => {
          notifica.isRead = false;
          this.notificationService.updatedNotification$.next(notifica);
          this.isAllUnread = true;
          this.isAllRead = false;
          this.loading = false;
        });
        openSnackbar(this.snackbar, "Tutte le notifiche sono segnate come 'non lette'");
      },
      error: error => console.error("Errore nell'impostare tutte le notifiche a 'letta'", error)
    });
  }

  /**
   * Controlla se tutte le notifiche sono state lette
   * @returns true se sono state tutte lette
   * @returns false se non sono tutte lette
   */
  checkIsAllRead(): boolean{
    return this.notifiche.every(notifica => notifica.isRead);
  }

  /**
   * Controlla se tutte le notifiche sono da leggere
   * @returns true se sono tutte da leggere
   * @returns false se non sono tutte da leggere
   */
  checkIsAllUnread(): boolean{
    return this.notifiche.every(notifica => !notifica.isRead);
  }

  /**
   * Aggiorna le notifiche visualizzate
   */
  async updateNotifications(){
    this.isAllRead = this.checkIsAllRead();
    this.isAllUnread = this.checkIsAllUnread();

    this.displayedNotifiche = [];
    const updatedNotifications = await this.getAllNotifications();
    if(updatedNotifications){
      openSnackbar(this.snackbar, "Notifiche aggiornate con successo");
      this.notifiche = updatedNotifications;
      this.displayedNotifiche = updatedNotifications;
      this.newNotifications = [];
    }
  }

  /**
   * Aggiorna lo stato di lettura di una notifica
   * @param notification notifica da modificare
   */
  updateNotificationStatus(notification: Notifica) {
    this.notificationService.toggleNotificationReadStatus(notification.key)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { notification: Notifica, message: string }) => {
          const { notification: updatedNotification } = response;

          // Aggiorna l'array di notifiche con copia immutabile
          this.notifiche = this.notifiche.map(notifica => {
            if (notifica.key === updatedNotification.key) {
              return { ...updatedNotification };
            }
            return notifica;
          });

          // Aggiorna anche l'array visualizzato
          this.displayedNotifiche = [...this.notifiche];

          // Aggiorna gli stati
          this.isAllRead = this.checkIsAllRead();
          this.isAllUnread = this.checkIsAllUnread();

          // Forza il rilevamento delle modifiche
          this.cd.detectChanges();

          // Notifica gli altri componenti
          this.notificationService.updatedNotification$.next(updatedNotification);
        },
        error: error => {
          console.error("Errore nell'aggiornamento della notifica: ", error);
        }
      });
  }

  /**
   * Permette di ottenere tutte le notifiche
   * @returns Array di notifiche
   */
  private async getAllNotifications(): Promise<Notifica[]>{
    try {
      return firstValueFrom(this.notificationService.getAllNotifications().pipe(takeUntil(this.destroy$)));
    } catch (error) {
      console.error("Errore nell'ottenimento di tutte le notifiche");
    }
    return [];
  }

  /**
   * Gestisce l'arrivo di una nuova notifica
   */
  private handleNewNotification(){
    this.notificationService.newNotification$.pipe(takeUntil(this.destroy$), skip(1))
    .subscribe({
      next: (notifica: Notifica | null) => {
        if(notifica){
          this.newNotifications.unshift(notifica);
          this.cd.detectChanges();
        }
      },
      error: error => console.error("Errore nella ricezione della nuova notifica nella pagina delle notifiche: ", error)
    });
  }

  /**
   * Gestisce la reazione alla cancellazione di una notifica
   */
  private handleNotificationDelete(){
      this.notificationService.deletedNotification$.pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (response: { key: string }) => {
          this.notifiche = this.notifiche.filter(notifica => notifica.key != response.key);
          this.cd.detectChanges();
        },
        error: (error: any) => console.error("Errore nella ricezione della notifica letta dalla navbar: ", error)
      });
    }

  /**
   * Gestisce la reazione all'aggiornamento "letta/non letta" di una notifica
   */
    private handleUpdatedNotification(){
      this.notificationService.updatedNotification$.pipe(takeUntil(this.destroy$), skip(1))
      .subscribe({
        next: (notification: Notifica | null) => {
          if (notification) {
            this.notifiche = this.notifiche.map(notifica => {
              if (notifica.key === notification.key) {
                return { ...notifica, isRead: notification.isRead };
              }
              return { ...notifica };
            });

            this.displayedNotifiche = [...this.notifiche];

            this.cd.detectChanges();
          }
        },
        error: error => console.error("Errore nella ricezione della notifica letta dalla navbar: ", error)
      });
    }

  /**
   * Torna alla pagina precedente
   */
  goBack(){
    this.router.navigate([this.previous_url]);
  }
}
