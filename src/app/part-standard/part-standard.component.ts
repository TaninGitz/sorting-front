import { Component, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import config from '../../config'; // อย่าลืมเช็ค path ของ config ให้ถูกต้องนะครับ

@Component({
  selector: 'app-part-standard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './part-standard.component.html',
  styleUrl: './part-standard.component.css'
})
export class PartStandardComponent implements OnInit, OnChanges {
  @Input() itemNo: string = ''; // ✅ รับค่า Item No มาจากหน้าหลัก

  tools: any[] = [];
  stdToolId: any = null;
  stdOutputPerHour: number | null = null;
  standards: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchTools(); // โหลด Master Tool มารอไว้ครั้งเดียว
  }

  // ✅ ทำงานทุกครั้งที่หน้าแม่ส่งค่า itemNo เปลี่ยนแปลงเข้ามา
  ngOnChanges(changes: SimpleChanges) {
    if (changes['itemNo'] && this.itemNo) {
      this.stdToolId = null;
      this.stdOutputPerHour = null;
      this.fetchStandards();
    }
  } 

  fetchTools() {
    this.http.get(config.apiServer + '/api/tool/list').subscribe({
      next: (res: any) => this.tools = res.results,
    });
  }

  fetchStandards() {
    this.http.post(config.apiServer + '/api/partStandard/listByItemNo', { itemNo: this.itemNo })
      .subscribe({
        next: (res: any) => this.standards = res.results,
        error: (err) => console.error('Error fetching standards', err)
      });
  }

  saveStandard() {
    if (!this.stdOutputPerHour || this.stdOutputPerHour <= 0) {
      Swal.fire('แจ้งเตือน', 'กรุณาระบุเป้าหมาย Output/Hour', 'warning');
      return;
    }
    
    const payload = {
      itemNo: this.itemNo,
      toolId: this.stdToolId,
      stdOutputPerHour: this.stdOutputPerHour
    };

    this.http.post(config.apiServer + '/api/partStandard/create', payload).subscribe({
      next: () => {
        this.stdToolId = null;
        this.stdOutputPerHour = null;
        this.fetchStandards(); // โหลดตารางใหม่
      },
      error: (err) => Swal.fire('Error', err.error?.error || 'เกิดข้อผิดพลาด', 'error')
    });
  }

  removeStandard(id: number) {
    this.http.delete(config.apiServer + '/api/partStandard/remove/' + id).subscribe({
      next: () => this.fetchStandards(),
      error: () => Swal.fire('Error', 'ไม่สามารถลบได้', 'error')
    });
  }
}