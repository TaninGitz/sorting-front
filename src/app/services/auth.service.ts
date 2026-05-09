import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import config from '../../config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private authStatus = new BehaviorSubject<boolean>(false);
  authStatus$ = this.authStatus.asObservable();

  // เพิ่ม BehaviorSubject สำหรับแจ้ง component refresh
  private refreshComponents = new BehaviorSubject<boolean>(false);
  refreshComponents$ = this.refreshComponents.asObservable();

  private authStateChange = new BehaviorSubject<boolean>(false);

  // เพิ่ม Subject สำหรับ auth state
  private authState = new BehaviorSubject<{
    isAuthenticated: boolean;
    token: string | null;
    empNo: string | null;
  }>({
    isAuthenticated: false,
    token: null,
    empNo: null,
  });
  authState$ = this.authState.asObservable();
  
  constructor(private router: Router, private http: HttpClient) {}

  login(userData: any) {
    localStorage.setItem('sorting_token', userData.token);
    localStorage.setItem('sorting_name', userData.name);
    localStorage.setItem('sorting_id', userData.id);
    localStorage.setItem('sorting_empNo', userData.empNo);
    this.authStatus.next(true);
    this.refreshComponents.next(true);
  }

  logout() {
    localStorage.removeItem('sorting_token');
    localStorage.removeItem('sorting_name');
    localStorage.removeItem('sorting_id');
    localStorage.removeItem('sorting_empNo'); 
    this.authStatus.next(false);
    window.location.href = '/SortingPress';
    // this.refreshComponents.next(true); // แจ้ง components ให้ refresh
    // this.router.navigate(['/']);
  }

  getUserLevel() {
    const token = localStorage.getItem('sorting_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get(config.apiServer + '/api/user/getLevelFromToken', {
      headers,
    });
  }

  updateAuthStatus(status: boolean) {
    this.authStatus.next(status);
  }

  notifyLogin() {
    this.authStateChange.next(true);
  }
}
