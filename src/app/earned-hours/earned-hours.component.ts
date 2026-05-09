import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import config from '../../config';

@Component({
  selector: 'app-earned-hours',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './earned-hours.component.html',
  styleUrl: './earned-hours.component.css'
})
export class EarnedHoursComponent implements OnInit {
  // Filter parameters
  fromDate: string = '';
  toDate: string = '';
  empNo: string = '';
  searchItem: string = '';
  
  // Data
  reports: any[] = [];
  grandTotalHours: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.setDefaultDates();
    this.fetchData();
  }

  setDefaultDates() {
    const today = new Date();
    // Default: ดูข้อมูลของวันนี้
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    this.fromDate = `${year}-${month}-${day}`;
    this.toDate = `${year}-${month}-${day}`;
  }

  fetchData() {
    const payload = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      empNo: this.empNo,
      searchItem: this.searchItem
    };

    Swal.fire({
      title: 'กำลังโหลดข้อมูล...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.http.post(config.apiServer + '/api/report/earnedHours', payload).subscribe({
      next: (res: any) => {
        this.reports = res.results || [];
        this.calculateGrandTotal();
        Swal.close();
      },
      error: (err) => {
        Swal.fire('Error', err.error?.error || 'โหลดข้อมูลล้มเหลว', 'error');
      }
    });
  }

  calculateGrandTotal() {
    this.grandTotalHours = this.reports.reduce((sum, row) => sum + (Number(row.earnedHours) || 0), 0);
  }

  clearFilter() {
    this.setDefaultDates();
    this.empNo = '';
    this.searchItem = '';
    this.fetchData(); // สั่งดึงข้อมูลใหม่ทั้งหมด
  }
}