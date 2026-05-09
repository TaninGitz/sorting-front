import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import config from '../../config';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MyModalComponent } from '../my-modal/my-modal.component';

// Declare Bootstrap Modal
declare var bootstrap: any;

@Component({
  selector: 'app-sorting-report',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    MyModalComponent // Import Modal Component
  ],
  templateUrl: './sorting-report.component.html',
  styleUrl: './sorting-report.component.css',
})
export class SortingReportComponent implements OnInit {
  id: number = 0;
  itemNo: string = '';
  docNo: string = ''; // ไม่ได้ใช้ใน Sorting แต่เก็บโครงไว้
  defectName: string = ''; // ไม่ได้ใช้ใน Sorting แต่เก็บโครงไว้
  toDate: string;
  fromDate: string;
  reports: any[] = []; // เปลี่ยนชื่อตัวแปรให้สื่อความหมาย (เดิม scrapReports)
  level: string = '';
  empNo: string = '';

  // Modal Data (เพิ่มใหม่)
  currentNgList: any[] = [];
  currentPdDates: any[] = [];
  selectedItemNo: string = '';
  selectedBoxNo: string = '';
  defects: any[] = []; // เก็บรายการ Defect Master Data
  processes: any[] = []; // เก็บรายการ Process Master Data

  constructor(private http: HttpClient) {
    this.fromDate = new Date(new Date().setDate(new Date().getDate() - 1))
      .toISOString()
      .split('T')[0]; // ตั้งค่าเป็นเมื่อวาน
    this.toDate = new Date().toISOString().split('T')[0]; // ตั้งค่าเป็นวันนี้
  }

  ngOnInit() {
    this.fetchDataReport();
    this.getLevelFromToken();
    this.fetchDefects(); // ดึง Master Data ของ Defect มาเก็บไว้สำหรับทำ Dropdown
    this.fetchProcesses(); // ดึง Master Data ของ Process มาเก็บไว้สำหรับทำ Dropdown
  }

  fetchDefects() {
    this.http.get(config.apiServer + '/api/defect/list').subscribe({
      next: (res: any) => {
        this.defects = res.results;
      },
      error: (err) => {
        console.error('Error fetching defects:', err);
      }
    });
  }

  fetchProcesses() {
    this.http.get(config.apiServer + '/api/process/list').subscribe({
      next: (res: any) => {
        this.processes = res.results;
      },
      error: (err) => {
        console.error('Error fetching processes:', err);
      }
    });
  }

  clearForm() {
    this.itemNo = '';
    this.empNo = '';
    this.fromDate = new Date(new Date().setDate(new Date().getDate() - 1))
      .toISOString()
      .split('T')[0];
    this.toDate = new Date().toISOString().split('T')[0];

    this.fetchDataReport();
  }

  // ปรับชื่อฟังก์ชันให้สื่อความหมาย (เดิม fetchDataScrap)
  fetchDataReport() {
    if (!this.fromDate || !this.toDate) {
      Swal.fire({
        title: 'Warning',
        text: 'Please select date range',
        icon: 'warning',
      });
      return;
    }

    const payload = {
      fromDate: this.fromDate,
      toDate: this.toDate,
      itemNo: this.itemNo,
      empNo: this.empNo
    };

    console.log('Sending payload:', payload);

    this.http
      .post(config.apiServer + '/api/report/getSortingReport', payload) // ยิงไป API Sorting
      .subscribe({
        next: (res: any) => {
          console.log('API Response:', res);
          this.reports = res.results;

          if (this.reports.length === 0) {
            let debugMessage = `ไม่พบข้อมูลที่ค้นหา.\n`;
            debugMessage += `Date range: ${new Date(this.fromDate).toLocaleDateString()} - ${new Date(this.toDate).toLocaleDateString()}`;

            Swal.fire({
              title: 'Info',
              text: debugMessage,
              icon: 'info',
            });
          }
        },
        error: (err) => {
          console.error('API Error:', err);
          Swal.fire({
            title: 'Error',
            text: err.message || 'An error occurred',
            icon: 'error',
          });
        },
      });
  }

  downloadExcel() {
    if (!this.fromDate || !this.toDate) {
      Swal.fire({
        title: 'Warning',
        text: 'Please select date range',
        icon: 'warning',
      });
      return;
    }

    // ใช้ window.open แบบ GET (ตามที่คุยกันล่าสุด)
    const params = `fromDate=${this.fromDate}&toDate=${this.toDate}&itemNo=${this.itemNo}&empNo=${this.empNo}`;
    const url = `${config.apiServer}/api/report/downloadExcel?${params}`;
    window.open(url, '_blank');
  }

  formatDate(dateStr: string) {
    if(!dateStr) return '-';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  
  //test
  getLevelFromToken() {
    const token = localStorage.getItem('sorting_token');
    if (token) {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        this.http
        .get(config.apiServer + '/api/user/getLevelFromToken', {
            headers: headers,
        })
        .subscribe((res: any) => {
            this.level = res.level;
        });
    }
  }

  async deleteReport(item: any) {
    try {
      const detailMessage = `
      คุณต้องการลบรายการ
        Item Name: ${item.itemNo}
        Box No: ${item.boxNo}
        จำนวน: ${item.inputQty} ชิ้น
      `;

      const button = await Swal.fire({
        title: 'ลบรายการ',
        html: detailMessage.split('\n').join('<br>'),
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'ลบรายการ',
        cancelButtonText: 'ยกเลิก',
        showConfirmButton: true,
        confirmButtonColor: '#d33'
      });

      if (button.isConfirmed) {
        // ใช้ API ลบของ SortingDetail
        this.http
          .delete(config.apiServer + '/api/report/removeDetail/' + item.id)
          .subscribe({
            next: (res: any) => {
              Swal.fire({
                title: 'สำเร็จ',
                text: 'ลบรายการเรียบร้อยแล้ว',
                icon: 'success',
                timer: 1500,
              });
              this.fetchDataReport(); 
            },
            error: (err) => {
              Swal.fire({
                title: 'Error',
                text: err.message,
                icon: 'error',
              });
            },
          });
      }
    } catch (e: any) {
      Swal.fire({
        title: 'Error',
        text: e.message,
        icon: 'error',
      });
    }
  }

  // --- Modal Functions (เพิ่มใหม่) ---
  showNgList(item: any) {
    this.selectedItemNo = item.itemNo;
    this.selectedBoxNo = item.boxNo;
    this.currentNgList = item.NgLists;
    
    const el = document.getElementById('modalNgList');
    if(el) {
      const modal = new bootstrap.Modal(el);
      modal.show();
    }
  }

  updateNgList(ng: any) {
    const payload = { id: ng.id, defectName: ng.defectName };
    this.http.put(config.apiServer + '/api/report/updateNgList', payload).subscribe({
      next: (res: any) => {
        Swal.fire({
          title: 'สำเร็จ',
          text: 'อัพเดท Defect Name เรียบร้อย',
          icon: 'success',
          timer: 1500,
        });
        this.fetchDataReport(); // Refresh data in background
      },
      error: (err) => {
        Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
      }
    });
  }

  showProdDate(item: any) {
    this.selectedItemNo = item.itemNo;
    this.selectedBoxNo = item.boxNo;
    // Map to include a temporary field for date input binding
    this.currentPdDates = item.PdDates.map((pd: any) => ({
      ...pd,
      _editDate: pd.productionDate ? new Date(pd.productionDate).toISOString().split('T')[0] : ''
    }));

    const el = document.getElementById('modalProdDate');
    if(el) {
      const modal = new bootstrap.Modal(el);
      modal.show();
    }
  }

  updatePdDate(pd: any) {
    const payload = { id: pd.id, productionDate: pd._editDate, prcName: pd.prcName };
    this.http.put(config.apiServer + '/api/report/updatePdDate', payload).subscribe({
      next: (res: any) => {
        Swal.fire({
          title: 'สำเร็จ',
          text: 'อัพเดทข้อมูลเรียบร้อย',
          icon: 'success',
          timer: 1500,
        });
        this.fetchDataReport(); // Refresh data in background
      },
      error: (err) => {
        Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
      }
    });
  }
}