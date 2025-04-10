import { MatSnackBar } from "@angular/material/snack-bar";
import { SnackbarComponent } from "../Common-components/snackbar/snackbar.component";

export function openSnackbar(snackBar: MatSnackBar, content: string): void {
  snackBar.openFromComponent(SnackbarComponent, {
    duration: 2000,
    data: { content },
  });
}
