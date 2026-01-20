import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, Route, ActivatedRoute } from '@angular/router';
import { MatSidenav } from '@angular/material/sidenav';
import { Remult } from 'remult';
import { DialogService } from './common/dialog';
import { InputField, openDialog, RouteHelperService } from '@remult/angular';
import { Users } from './users/users';
import { PasswordControl } from "./users/PasswordControl";
import { InputAreaComponent } from './common/input-area/input-area.component';
import { AuthService } from './auth.service';
import { terms } from './terms';
import { Roles } from './users/roles';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {


  constructor(
    public router: Router,
    public activeRoute: ActivatedRoute,
    private routeHelper: RouteHelperService,
    public dialogService: DialogService,
    public remult: Remult,
    public auth: AuthService) {


  }
  terms = terms;

  async signIn() {
    this.auth.showSignIn();
  }

  ngOnInit(): void {

  }
  isHome() {
    return this.currentTitle()=="";
  }

  signOut() {
    this.auth.signOut();
    this.router.navigate(['/']);
  }
  signUp() {
    let user = this.remult.repo(Users).create();
    let password = new PasswordControl();
    let confirmPassword = new PasswordControl(terms.confirmPassword);
    openDialog(InputAreaComponent, i => i.args = {
      title: terms.signUp,
      fields: () => [
        user.$.name,
        password,
        confirmPassword
      ],
      ok: async () => {
        if (password.value != confirmPassword.value) {
          confirmPassword.error = terms.doesNotMatchPassword;
          throw new Error(confirmPassword.metadata.caption + " " + confirmPassword.error);
        }
        await user.create(password.value);
        this.auth.signIn(user.name, password.value);

      }
    });
  }

  async updateInfo() {
    let user = await this.remult.repo(Users).findId(this.remult.user.id);
    openDialog(InputAreaComponent, i => i.args = {
      title: terms.updateInfo,
      fields: () => [
        user.$.name
      ],
      ok: async () => {
        await user._.save();
      }
    });
  }
  async changePassword() {
    let user = await this.remult.repo(Users).findId(this.remult.user.id);
    let password = new PasswordControl();
    let confirmPassword = new PasswordControl(terms.confirmPassword);
    openDialog(InputAreaComponent, i => i.args = {
      title: terms.changePassword,
      fields: () => [
        password,
        confirmPassword
      ],
      ok: async () => {
        if (password.value != confirmPassword.value) {
          confirmPassword.error = terms.doesNotMatchPassword;
          throw new Error(confirmPassword.metadata.caption + " " + confirmPassword.error);
        }
        await user.updatePassword(password.value);
        await user._.save();
      }
    });

  }

  routeName(route: Route) {
    // Use the name from route data if available, otherwise use the path (or 'Home' for root)
    if (route.data && route.data['name'])
      return route.data['name'];
    if (route.path === '' || route.path === '/')
      return 'Home';
    return route.path || 'Home';
  }

  currentTitle() {
    if (this.activeRoute!.snapshot && this.activeRoute!.firstChild)
      if (this.activeRoute.snapshot.firstChild!.data!['name']) {
        return this.activeRoute.snapshot.firstChild!.data['name'];
      }
      else {
        if (this.activeRoute.firstChild.routeConfig)
          return this.activeRoute.firstChild.routeConfig.path;
      }
    return 'men-collection';
  }

  shouldDisplayRoute(route: Route) {
    // Allow empty path (root route) and filter out routes with : or **
    if (route.path === undefined || route.path === null)
      return false;
    if (route.path.indexOf(':') >= 0 || route.path.indexOf('**') >= 0)
      return false;
    if (route.path === 'my-collection')
      return false;
    
    // Explicitly handle known admin routes
    const adminRoutes = ['HomeConfig', 'Settings', 'Users'];
    if (route.path && adminRoutes.includes(route.path)) {
      const isAdmin = this.remult.isAllowed(Roles.admin);
      // Temporary debug to help diagnose
      if (route.path === 'HomeConfig') {
        console.log('HomeConfig route check - isAdmin:', isAdmin, 'user:', this.remult.user);
      }
      return isAdmin;
    }
    
    return this.routeHelper.canNavigateToRoute(route);
  }
  //@ts-ignore ignoring this to match angular 7 and 8
  @ViewChild('sidenav') sidenav: MatSidenav;
  routeClicked() {
    if (this.dialogService.isScreenSmall())
      this.sidenav.close();

  }

  isAdmin(): boolean {
    return this.remult.isAllowed(Roles.admin);
  }


}
