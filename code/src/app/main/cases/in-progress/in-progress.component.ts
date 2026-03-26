import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
// Angular Material modules
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
// Custom standalone components (if already converted)
import { NavbarComponent } from '../../../shared/navbar/navbar.component';

@Component({
  selector: 'app-in-progress',
  imports: [CommonModule,
    RouterModule,MatIconModule,
    MatButtonModule,NavbarComponent],
  templateUrl: './in-progress.component.html',
  styleUrl: './in-progress.component.scss'
})
export class InProgressComponent {

}
