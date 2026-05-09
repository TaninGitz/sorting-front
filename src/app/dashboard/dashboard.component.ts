import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartData, ChartOptions, registerables } from 'chart.js';
import config from '../../config';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MyModalComponent } from '../my-modal/my-modal.component'; // ✅ อย่าลืม Import Modal
declare var bootstrap: any;

Chart.register(...registerables);

@Component({
  selector: 'app-sorting-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule, MyModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Filters
  startDate: string = '';
  endDate: string = '';
  selectedEmpNo: string = '';
  selectedItemNo: string = '';
  selectedGroup: string = ''; // ✅ เพิ่ม Filter Group
  selectedSections: string[] = [];
  
  // Data Lists
  empList: any[] = [];
  itemList: any[] = [];
  sectionList: string[] = [];
  groupList: string[] = []; // ✅ ลิสต์ของ Group
  
  // Summary Data
  summary: any = { totalInput: 0, totalOK: 0, totalNG: 0 };
  groupTableData: any[] = []; // ✅ ข้อมูลสำหรับตาราง Group
  selectedGroupDetails: any = null; // ✅ ข้อมูลสำหรับส่งให้ Modal
  detailModalInstance: any;

  // Chart Instances
  sortingChart: Chart | null = null;
  groupChart: Chart | null = null; // ✅ Instance กราฟใหม่

  constructor(private http: HttpClient) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    this.startDate = yesterday.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.fetchGroupList();
    this.fetchSectionList();
    this.fetchEmpList();
    this.fetchItemList();
    this.fetchData();
  }

  // ✅ ดึงรายชื่อ Group
  fetchGroupList() {
    if (!this.startDate || !this.endDate) return;
    let url = `/api/dashboard/getGroupList?startDate=${this.startDate}&endDate=${this.endDate}`;
    this.http.get(config.apiServer + url).subscribe((res: any) => {
      this.groupList = res.results;
    });
  }

  fetchSectionList() {
    if (!this.startDate || !this.endDate) return;
    let url = `/api/dashboard/getSectionList?startDate=${this.startDate}&endDate=${this.endDate}`;
    if (this.selectedItemNo) url += `&itemNo=${encodeURIComponent(this.selectedItemNo)}`;
    if (this.selectedGroup) url += `&group=${encodeURIComponent(this.selectedGroup)}`; // ผูก Group
    
    this.http.get(config.apiServer + url).subscribe((res: any) => { this.sectionList = res.results; });
  }

  fetchEmpList() {
    if (!this.startDate || !this.endDate) return;
    let url = `/api/dashboard/getEmpList?startDate=${this.startDate}&endDate=${this.endDate}`;
    if (this.selectedSections && this.selectedSections.length > 0) url += `&section=${encodeURIComponent(this.selectedSections.join(','))}`;
    if (this.selectedItemNo) url += `&itemNo=${encodeURIComponent(this.selectedItemNo)}`;
    if (this.selectedGroup) url += `&group=${encodeURIComponent(this.selectedGroup)}`;
        
    this.http.get(config.apiServer + url).subscribe((res: any) => { this.empList = res.results; });
  }

  fetchItemList() {
    if (!this.startDate || !this.endDate) return;
    let url = `/api/dashboard/getItemList?startDate=${this.startDate}&endDate=${this.endDate}`;
    if (this.selectedSections && this.selectedSections.length > 0) url += `&section=${encodeURIComponent(this.selectedSections.join(','))}`;
    if (this.selectedEmpNo) url += `&empNo=${encodeURIComponent(this.selectedEmpNo)}`;
    if (this.selectedGroup) url += `&group=${encodeURIComponent(this.selectedGroup)}`;

    this.http.get(config.apiServer + url).subscribe((res: any) => { this.itemList = res.results; });
  }

  fetchData() {
    const payload = {
      startDate: this.startDate,
      endDate: this.endDate,
      empNo: this.selectedEmpNo,
      itemNo: this.selectedItemNo,
      section: this.selectedSections,
      group: this.selectedGroup // ✅ โยน Group ไปค้นหาด้วย
    };

    this.http.post(config.apiServer + '/api/dashboard/getSortingDashboard', payload)
      .subscribe((res: any) => {
        this.summary = res.summary;
        this.groupTableData = res.groupSummary; // ✅ รับข้อมูล Group
        this.updateChart(res.chartData);
        this.updateGroupChart(); // ✅ อัปเดตกราฟ Group
      });
  }

  updateChart(chartData: any) {
    const ctx = document.getElementById('sortingChart') as HTMLCanvasElement;
    if (this.sortingChart) this.sortingChart.destroy();

    if (ctx) {
      this.sortingChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            title: { display: true, text: 'Total Input Sorting by Item (Daily)' },
            // legend: { position: 'right' }, // ปรับให้ไว้ด้านขวาจะได้ไม่ล้นลงมา
            legend: { display: false },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            x: { stacked: true, title: { display: true, text: 'Sorting Date' } },
            y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Input Qty (pcs)' } }
          }
        }
      });
    }
  }

  // ✅ ฟังก์ชันวาดกราฟ Group
  // ✅ ฟังก์ชันวาดกราฟ Group (เปลี่ยนมาโชว์ OK / NG)
  updateGroupChart() {
    const ctx = document.getElementById('groupChart') as HTMLCanvasElement;
    if (this.groupChart) this.groupChart.destroy();

    // ดึงชื่อ Group มาเป็นแกน X
    const labels = this.groupTableData.map(g => g.groupName);
    
    // ดึงยอด OK และ NG แทน Input เดิม
    const dataOK = this.groupTableData.map(g => g.ok);
    const dataNG = this.groupTableData.map(g => g.ng);

    if (ctx) {
      this.groupChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'OK Qty',
              data: dataOK,
              backgroundColor: '#1cc88a', // สีเขียว Success
              borderRadius: 4
            },
            {
              label: 'NG Qty',
              data: dataNG,
              backgroundColor: '#e74a3b', // สีแดง Danger
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true, 
          maintainAspectRatio: false,
          plugins: { 
            // ✅ เปิด Legend ให้คนดูรู้ว่าสีไหนคือ OK / NG
            legend: { display: true, position: 'bottom' },
            // ✅ โชว์ Tooltip สรุปยอดรวมให้ดูง่ายๆ เวลากดชี้
            tooltip: { mode: 'index', intersect: false } 
          },
          scales: { 
            // ✅ สั่งให้กราฟต่อทับกัน (Stacked) เพื่อให้ความสูงรวมเท่ากับยอด Input
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true } 
          }
        }
      });
    }
  }

  openGroupDetail(groupRow: any) {
    this.selectedGroupDetails = groupRow;
    const el = document.getElementById('modalGroupDetail');
    if (el) {
      this.detailModalInstance = new bootstrap.Modal(el);
      this.detailModalInstance.show();
    }
  }

  clearFilters() {
    this.selectedItemNo = '';
    this.selectedSections = [];
    this.selectedEmpNo = '';
    this.selectedGroup = ''; // เคลียร์ Group ด้วย
    this.onFilterChange();
  }

  onFilterChange() {
    this.fetchGroupList();
    this.fetchSectionList();
    this.fetchEmpList();
    this.fetchItemList();
    this.fetchData();
  }

  onSectionCheckboxChange(event: any, section: string) {
    if (event.target.checked) { this.selectedSections.push(section); } 
    else { this.selectedSections = this.selectedSections.filter(s => s !== section); }
    this.onFilterChange();
  }

  getSelectedSectionText(): string {
    if (!this.selectedSections || this.selectedSections.length === 0) return '-- All Sections --';
    if (this.selectedSections.length === 1) return this.selectedSections[0];
    return `${this.selectedSections.length} Sections Selected`; 
  }
}