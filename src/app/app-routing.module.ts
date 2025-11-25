import { AuthenticatedInGuard, RemultModule, } from '@remult/angular';
import { NgModule, ErrorHandler } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';


import { UsersComponent } from './users/users.component';
import { Roles } from './users/roles';
import { ShowDialogOnErrorErrorHandler } from './common/dialog';
import { ManageComponent } from './manage/manage.component';
import { BottlesComponent } from './bottles/bottles.component';
import { AdminGuard } from './users/AdminGuard';
import { NewListComponent } from './new-list/new-list.component';
import { LandingComponent } from './landing/landing.component';


const routes: Routes = [
  { path: 'home', component: LandingComponent },
  { path: '', component: NewListComponent },
  { path: 'bottles', component: BottlesComponent, canActivate: [AuthenticatedInGuard] },
  { path: 'Settings', component: ManageComponent, canActivate: [AdminGuard] },
  { path: 'Users', component: UsersComponent, canActivate: [AdminGuard] },
    { path: '**', redirectTo: '/', pathMatch: 'full' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes), RemultModule],
  providers: [AdminGuard, { provide: ErrorHandler, useClass: ShowDialogOnErrorErrorHandler }],
  exports: [RouterModule]
})
export class AppRoutingModule { }

