import { MatSnackBar } from "@angular/material/snack-bar";
import { SnackbarComponent } from "../Common-components/snackbar/snackbar.component";

/**
 * Permette di aprire la snackbar
 * @param snackBar oggetto MatSnackBar del componente su cui aprire la snackbar
 * @param content contenuto della snackbar
 */
export function openSnackbar(snackBar: MatSnackBar, content: string): void {
  snackBar.openFromComponent(SnackbarComponent, {
    duration: 2000,
    data: { content },
  });
}
