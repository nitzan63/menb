import { AfterViewInit, Component, OnInit, ViewChild, } from '@angular/core';
import { BusyService, DataControl, openDialog, RouteHelperService } from '@remult/angular';
import { Field, getFields, Paginator, Remult } from 'remult';
import { AuthService } from '../auth.service';
import { BottleInfoComponent } from '../bottle-info/bottle-info.component';
import { Bottles } from '../bottles/bottles';
import { BottlesComponent } from '../bottles/bottles.component';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { terms } from '../terms';
import { Roles } from '../users/roles';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-new-list',
  templateUrl: './new-list.component.html',
  styleUrls: ['./new-list.component.scss']
})
export class NewListComponent implements OnInit, AfterViewInit {

  constructor(public remult: Remult, private busy: BusyService, public auth: AuthService, private route: RouteHelperService, private activatedRoute: ActivatedRoute, private router: Router) {

  }

  @DataControl<NewListComponent>({
    valueChange: async (self) => {
      // the call to `this.busy.donotWait` causes the load products method to run without the "Busy" circle in the ui
      await await self.reloadData();
    }
  })
  @Field<NewListComponent>({
    caption: 'bottle search'
  })
  searchString: string = '';
  toBottles() {
    this.router.navigate(['/admin/bottles']);
  }
  isAdmin() {
    return this.remult.isAllowed(Roles.admin);
  }

  get $() { return getFields(this) }
  loading = false;
  ngAfterViewInit(): void {
    console.log(this.element);
    var observer = new IntersectionObserver(async (entries) => {
      // isIntersecting is true when element and viewport are overlapping
      // isIntersecting is false when element and viewport don't overlap
      if (entries[0].isIntersecting === true) {

        if (!this.loading && this.paginator?.hasNextPage) {
          this.busy.donotWait(async () => {
            this.loading = true;
            try {
              this.paginator = await this.paginator!.nextPage();
              this.bottles.push(...this.paginator.items);
            }
            finally {
              this.loading = false;
            }
          });
        }
      }
      else {
        console.log("out of view");
      }
    }, { threshold: [0] });
    observer.observe(this.element.nativeElement);
  }
  @ViewChild("my") element: any;
  bottles: Bottles[] = [];
  paginator?: Paginator<Bottles>;
  count = 0;
  async ngOnInit() {
    // Read query parameters for filtering
    this.activatedRoute.queryParams.subscribe(async params => {
      const category = params['category'];
      const country = params['country'];
      
      if (category) {
        this.searchString = 't:' + category;
        console.log('Filtering by category:', category, 'Search string:', this.searchString);
      } else if (country) {
        this.searchString = 'c:' + country;
        console.log('Filtering by country:', country, 'Search string:', this.searchString);
      } else {
        this.searchString = '';
        console.log('No filter, showing all bottles');
      }
      
      await this.reloadData();
    });
  }
  terms = terms;
  loadCount = 0;
  private async reloadData() {
    var myLoad = ++this.loadCount;
    this.bottles = [];
    this.loading = true;
    this.busy.donotWait(async () => {
      try {
        let newPaginator = await this.remult.repo(Bottles).query({
          pageSize: 20,
          where: Bottles.search(this.searchString)
        }).paginator();
        if (myLoad == this.loadCount) {
          this.paginator = newPaginator;
          this.bottles = this.paginator.items;
          this.count = await this.paginator.count();
        }
      } finally {
        if (myLoad == this.loadCount)
          this.loading = false;

      }
    })
  }
  advancedSearch() {
    new SearchParams().show((search) => {
      this.searchString = search;
      this.reloadData();
    });
  }


}

class SearchParams {
  @Field()
  hasTheWord = '';
  @Field()
  name = '';
  @Field()
  manufacturer = '';
  @Field()
  country = '';
  @Field()
  type = '';
  get $() { return getFields(this) }
  show(ok: (search: string) => void) {
    openDialog(InputAreaComponent, x => x.args = {
      title: "Advanced Search",
      fields: () => this.$.toArray(),
      ok: () => {
        let result: string[] = [];
        const push = (what: string, prefix?: string) => {
          if (what)
            if (prefix)
              result.push(prefix + ":" + what);
            else
              result.push(what);
        }
        push(this.hasTheWord);
        push(this.name, 'n');
        push(this.manufacturer, 'm');
        push(this.country, 'c');
        push(this.type, 't');
        ok(result.join(' '))
      }
    })
  }
}