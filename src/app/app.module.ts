import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule } from '@angular/forms';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RemultModule } from '@remult/angular';
import { UsersComponent } from './users/users.component';
import { HomeComponent, RunningNumberComponent } from './home/home.component';
import { YesNoQuestionComponent } from './common/yes-no-question/yes-no-question.component';
import { InputAreaComponent } from './common/input-area/input-area.component';
import { DialogService } from './common/dialog';
import { AdminGuard } from "./users/AdminGuard";
import { ManageComponent } from './manage/manage.component';
import { BottlesComponent } from './bottles/bottles.component';
import { BottleInfoComponent } from './bottle-info/bottle-info.component';
import { JwtModule } from '@auth0/angular-jwt';
import { AuthService } from './auth.service';
import { NewListComponent } from './new-list/new-list.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BottleCardComponent } from './bottle-card/bottle-card.component';
import { LandingComponent } from './landing/landing.component';
import { MyCollectionComponent } from './my-collection/my-collection.component';
import { BottleViewComponent } from './bottle-view/bottle-view.component';

@NgModule({
  declarations: [
    AppComponent,
    UsersComponent,
    HomeComponent,
    YesNoQuestionComponent,
    InputAreaComponent,
    ManageComponent,
    BottlesComponent,
    RunningNumberComponent,
    BottleInfoComponent,
    NewListComponent,
    BottleCardComponent,
    LandingComponent,
    MyCollectionComponent,
    BottleViewComponent
  ],
  imports: [
    MatProgressSpinnerModule,
    MatTooltipModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatCheckboxModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RemultModule,
    MatTabsModule,
    JwtModule.forRoot({
      config: {
        tokenGetter: () => AuthService.fromStorage()
      }
    })
  ],
  providers: [DialogService, AdminGuard],
  bootstrap: [AppComponent],
  entryComponents: [YesNoQuestionComponent, InputAreaComponent, BottleViewComponent]
})
export class AppModule { }
