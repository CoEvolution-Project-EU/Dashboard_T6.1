import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';
import { NgxSpinnerModule } from "ngx-spinner";
import { NgxMatDatetimePickerModule } from '@angular-material-components/datetime-picker';
import { NgxMatNativeDateModule } from '@angular-material-components/datetime-picker';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ResizableModule } from 'angular-resizable-element';


//------- Angular Material Imports -------- //
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatMenuModule } from "@angular/material/menu";
import { MatButtonModule } from "@angular/material/button";
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';

//------- End of Angular Material Imports -------- //


@NgModule({
  declarations: [
    NavbarComponent,
  ],
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    FlexLayoutModule,
    FormsModule,
    MatCheckboxModule,
    MatSelectModule,
    MatSliderModule
  ],
  exports: [
    NavbarComponent,
    NgxSpinnerModule,
    MatIconModule,
    MatSidenavModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    NgxMatDatetimePickerModule,
    MatDatepickerModule,
    MatButtonModule,
    MatDividerModule,
    FlexLayoutModule,
    MatTooltipModule,
    NgSelectModule,
    FormsModule,
    MatCheckboxModule,
    MatSelectModule,
    NgxMatNativeDateModule,
    MatSlideToggleModule,
    MatRadioModule,
    ResizableModule,
    MatSliderModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },

  ]
})
export class SharedModule { }
