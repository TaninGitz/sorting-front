import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import config from '../../config';
import { MyModalComponent } from '../my-modal/my-modal.component';
declare var bootstrap: any;

Chart.register(...registerables);

@Component({
  selector: 'app-employee-report',
  standalone: true,
  imports: [FormsModule, CommonModule ,MyModalComponent],
  templateUrl: './employee-report.component.html',
  styleUrls: ['./employee-report.component.css']
})
export class EmployeeReportComponent implements OnInit {
  // Filters
  startDate: string = '';
  endDate: string = '';
  selectedSection: string = '';
  selectedEmpNo: string = '';
  selectedItemNo: string = '';
  selectedEmpDetails: any = null;
  detailModalInstance: any;

  // Dropdown Lists
  sectionList: string[] = [];
  empList: any[] = [];
  itemList: any[] = [];

  // Table Data
  reportData: any[] = [];

  // Chart
  empChart: Chart | null = null;

  constructor(private http: HttpClient) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    this.startDate = yesterday.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    // ✅ เรียกฟังก์ชันแยกทีละตัวแทน loadDropdowns()
    this.fetchSectionList();
    this.fetchEmpList();
    this.fetchItemList();
    this.fetchReport();
  }

  // ✅ 1. ดึง Section (กรองตาม Date และ Item ---> ❌ ไม่กรองตาม Emp)
  fetchSectionList() {
    if (!this.startDate || !this.endDate) return;
    
    let url = `/api/dashboard/getSectionList?startDate=${this.startDate}&endDate=${this.endDate}`;
    
    if (this.selectedItemNo) {
      url += `&itemNo=${encodeURIComponent(this.selectedItemNo)}`;
    }
    
    this.http.get(config.apiServer + url).subscribe((res: any) => {
      this.sectionList = res.results;
    });
  }

  // ✅ 2. ดึง Emp (กรองตาม Date, Section และ Item)
  fetchEmpList() {
    if (!this.startDate || !this.endDate) return;

    let url = `/api/dashboard/getEmpList?startDate=${this.startDate}&endDate=${this.endDate}`;
    
    if (this.selectedSection) {
      url += `&section=${encodeURIComponent(this.selectedSection)}`;
    }
    if (this.selectedItemNo) {
      url += `&itemNo=${encodeURIComponent(this.selectedItemNo)}`;
    }
        
    this.http.get(config.apiServer + url).subscribe((res: any) => {
      this.empList = res.results;
    });
  }

  // ✅ 3. ดึง Item (กรองตาม Date, Section และ Emp)
  fetchItemList() {
    if (!this.startDate || !this.endDate) return;

    let url = `/api/dashboard/getItemList?startDate=${this.startDate}&endDate=${this.endDate}`;
    
    if (this.selectedSection) {
      url += `&section=${encodeURIComponent(this.selectedSection)}`;
    }
    if (this.selectedEmpNo) {
      url += `&empNo=${encodeURIComponent(this.selectedEmpNo)}`;
    }

    this.http.get(config.apiServer + url).subscribe((res: any) => {
      this.itemList = res.results;
    });
  }

  // ✅ 4. เมื่อมีการเปลี่ยน Filter
  onFilterChange() {
    // ดึง Dropdown ใหม่ทุกครั้งที่มีการเปลี่ยนค่า
    this.fetchSectionList();
    this.fetchEmpList();
    this.fetchItemList();
    
    // โหลดข้อมูล Report และ Chart
    this.fetchReport();
  }

  clearFilters() {
    this.selectedSection = '';
    this.selectedEmpNo = '';
    this.selectedItemNo = '';

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    this.startDate = yesterday.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
    
    this.onFilterChange();
  }

  fetchReport() {
    const payload = {
      startDate: this.startDate,
      endDate: this.endDate,
      section: this.selectedSection,
      empNo: this.selectedEmpNo,
      itemNo: this.selectedItemNo
    };

    this.http.post(config.apiServer + '/api/report/getEmployeeReport', payload)
      .subscribe((res: any) => {
        this.reportData = res.results;
        this.updateChart();
      });
  }

  updateChart() {
    const ctx = document.getElementById('empChart') as HTMLCanvasElement;
    if (this.empChart) this.empChart.destroy();

    // ดึง 10 อันดับแรกมาแสดงในกราฟ
    const top10 = this.reportData.slice(0, 10);
    const labels = top10.map(d => d.name);
    const dataOK = top10.map(d => d.totalOK);
    const dataNG = top10.map(d => d.totalNG);

    if (ctx) {
      this.empChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            { label: 'OK Qty', data: dataOK, backgroundColor: '#1cc88a' },
            { label: 'NG Qty', data: dataNG, backgroundColor: '#e74a3b' }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Top 10 Employees Output (OK vs NG)' },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true }
          }
        }
      });
    }
  }

  openEmpDetail(empRow: any) {
    this.selectedEmpDetails = empRow;
    
    const el = document.getElementById('modalEmpDetail');
    if (el) {
      this.detailModalInstance = new bootstrap.Modal(el);
      this.detailModalInstance.show();
    }
  }
}