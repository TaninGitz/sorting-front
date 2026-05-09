import { Routes } from '@angular/router';
import { SignInComponent } from './sign-in/sign-in.component';
import { RegisterComponent } from './register/register.component';
import { DefectListComponent } from './defect-list/defect-list.component';
import { PartListComponent } from './part-list/part-list.component';
import { GroupListComponent } from './group-list/group-list.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { InputSortingComponent } from './input-sorting/input-sorting.component';
import { ToolListComponent } from './tool-list/tool-list.component';
import { ProcessListComponent } from './process-list/process-list.component';
import { SortingReportComponent } from './sorting-report/sorting-report.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { EmployeeReportComponent } from './employee-report/employee-report.component';
import { PartStandardComponent } from './part-standard/part-standard.component';
import { EarnedHoursComponent } from './earned-hours/earned-hours.component';


export const routes: Routes = [
  {
    path: '',
    component: SignInComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'defect-list',
    component: DefectListComponent,
  },
  {
    path: 'part-list',
    component: PartListComponent,
  },

  {
    path: 'group-list',
    component: GroupListComponent,
  },

  {
    path: 'input-sorting',
    component: InputSortingComponent,
  },

  {
    path: 'process-list',
    component: ProcessListComponent,
  },

  {
    path: 'tool-list',
    component: ToolListComponent,
  },

  {
    path: 'sorting-report',
    component: SortingReportComponent,
  },

  {
    path: 'dashboard',
    component: DashboardComponent,
  },

  {
    path: 'employee-report',
    component: EmployeeReportComponent,
  },

  {
    path: 'part-standard',
    component: PartStandardComponent,
  },
  {
    path: 'earned-hours',
    component: EarnedHoursComponent,
  },


  {
    path: '404',
    component: NotFoundComponent,
  },

  {
    path: '**',
    redirectTo: '404',
  },

  // {
  //   path: '**',
  //   redirectTo: '',
  // },
];
