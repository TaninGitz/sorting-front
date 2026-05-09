import { Component, AfterViewInit, ViewChild, ElementRef, OnInit } from '@angular/core';
import { MyModalComponent } from '../my-modal/my-modal.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import config from '../../config';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// ✅ Import Component ลูกเข้ามาใช้งาน
import { PartStandardComponent } from '../part-standard/part-standard.component';

@Component({
  selector: 'app-part-list',
  standalone: true,
  // ✅ อย่าลืมใส่ PartStandardComponent ใน imports
  imports: [MyModalComponent, FormsModule, CommonModule, PartStandardComponent],
  templateUrl: './part-list.component.html',
  styleUrl: './part-list.component.css',
})
export class PartListComponent implements OnInit, AfterViewInit {
  @ViewChild('nameInput') nameInput!: ElementRef;
  constructor(private http: HttpClient) {}

  id: number = 0;
  customer: string = '';
  itemNo: string = '';
  itemName: string = '';
  spec: string = '';
  itemClass: string = '';
  maxQty: number | null = null;
  parts: any[] = [];
  file: File | undefined = undefined;
  searchItemNo: string = '';

  // ✅ ตัวแปรสำหรับส่งให้ลูก (Part Standard)
  currentPartItemNo: string = '';

  ngOnInit() {
    this.fetchData();
  }

  ngAfterViewInit() {
    const modalElement = document.getElementById('modalPart');
    if (modalElement) {
      modalElement.addEventListener('shown.bs.modal', () => {
        this.nameInput.nativeElement.focus();
      });
    }
  }

  fetchData() {
    this.http.get(config.apiServer + '/api/part/list').subscribe({
      next: (res: any) => {
        this.parts = res.results;
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

  clearForm() {
    this.customer = '';
    this.itemNo = '';
    this.itemName = '';
    this.spec = '';
    this.itemClass = '';
    this.maxQty = null;
    this.id = 0;

    setTimeout(() => {
      this.nameInput.nativeElement.focus();
    }, 100);
  }

  save() {
    const payload = {
      customer: this.customer,
      itemNo: this.itemNo,
      itemName: this.itemName,
      spec: this.spec,
      itemClass: this.itemClass,
      maxQty: this.maxQty,
      id: this.id,
    };

    if (this.id > 0) {
      this.http.put(config.apiServer + '/api/part/update', payload).subscribe({
        next: (res: any) => {
          if (res.message === 'success') {
            Swal.fire({
              title: 'สำเร็จ',
              text: 'อัพเดทเรียบร้อย',
              icon: 'success',
              timer: 3000,
            }).then(() => {
              this.fetchData();
              document.getElementById('modalPart_btnClose')?.click();
              this.id = 0;
            });
          }
        },
        error: (err) => {
          Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
        },
      });
    } else {
      this.http.post(config.apiServer + '/api/part/create', payload).subscribe({
        next: (res: any) => {
          if (res.message === 'success') {
            Swal.fire({
              title: 'สำเร็จ',
              text: 'บันทึกข้อมูลเรียบร้อย',
              icon: 'success',
              timer: 3000,
            }).then(() => {
              this.fetchData();
              document.getElementById('modalPart_btnClose')?.click();
            });
          }
        },
        error: (err) => {
          Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
        },
      });
    }
  }

  edit(item: any) {
    this.customer = item.customer;
    this.itemNo = item.itemNo;
    this.itemName = item.itemName;
    this.spec = item.spec;
    this.itemClass = item.itemClass;
    this.maxQty = item.maxQty;
    this.id = item.id;

    setTimeout(() => {
      this.nameInput.nativeElement.focus();
    }, 100);
  }

  async remove(item: any) {
    try {
      const button = await Swal.fire({
        title: 'ลบรายการ',
        text: 'คุณต้องการลบรายการใช่หรือไม่',
        icon: 'question',
        showCancelButton: true,
        showConfirmButton: true,
      });

      if (button.isConfirmed) {
        this.http
          .delete(config.apiServer + '/api/part/remove/' + item.id)
          .subscribe({
            next: (res: any) => {
              this.fetchData();
            },
            error: (err) => {
              Swal.fire({ title: 'Error', text: err.message, icon: 'error' });
            },
          });
      }
    } catch (e: any) {
      Swal.fire({ title: 'Error', text: e.message, icon: 'error' });
    }
  }

  fileSelected(file: any) {
    if (file.files != undefined && file.files.length > 0) {
      this.file = file.files[0];
    }
  }

  async uploadFile() {
    if (this.file !== undefined) {
      const formData = new FormData();
      formData.append('fileExcel', this.file);

      Swal.fire({
        title: 'กำลังอัพโหลดไฟล์...',
        html: 'กรุณารอสักครู่',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const res: any = await firstValueFrom(
          this.http.post(config.apiServer + '/api/part/uploadFormExcel', formData)
        );

        if (res.message === 'success') {
          Swal.fire({
            title: 'สำเร็จ',
            text: 'ไฟล์อัพโหลดและประมวลผลสำเร็จ!',
            icon: 'success',
            timer: 3000,
          }).then(() => {
            this.fetchData();
            document.getElementById('modalExcel_btnClose')?.click();
          });
        }
      } catch (err: any) {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: err.message || 'ไม่สามารถอัพโหลดไฟล์ได้',
          icon: 'error',
        });
      }
    } else {
      Swal.fire({
        title: 'กรุณาเลือกไฟล์',
        text: 'โปรดเลือกไฟล์ Excel ที่ต้องการอัพโหลด',
        icon: 'warning',
      });
    }
  }

  downloadExcel() {
    this.http
      .get(config.apiServer + '/api/part/downloadExcel', { responseType: 'blob' })
      .subscribe(
        (res: Blob) => {
          const blob = new Blob([res], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;

          const currentDate = new Date();
          const timestamp = currentDate
            .toISOString()
            .replace(/[-T:.Z]/g, '')
            .slice(0, 14);
          const fileName = `PartList(${timestamp}).xlsx`;

          link.download = fileName;
          link.click();
          window.URL.revokeObjectURL(url);

          Swal.fire({
            title: 'ดาวน์โหลดเสร็จสิ้น',
            text: `ไฟล์ ${fileName} ถูกดาวน์โหลดสำเร็จ`,
            icon: 'success',
            timer: 3000,
            showConfirmButton: false,
          });
        },
        (error) => {
          Swal.fire({
            title: 'ดาวน์โหลดล้มเหลว',
            text: 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์ กรุณาลองใหม่อีกครั้ง',
            icon: 'error',
          });
        }
      );
  }

  filterItemtNo() {
    if (this.searchItemNo.trim() === '') {
      this.fetchData();
      return;
    }

    const payload = { itemNo: this.searchItemNo };

    this.http
      .post(config.apiServer + '/api/part/filterItemNo', payload)
      .subscribe({
        next: (res: any) => {
          if (res.results.length > 0) {
            this.parts = res.results;
          } else {
            this.parts = [
              {
                customer: 'No data',
                itemNo: 'No data',
                itemName: 'No data',
                spec: 'No data',
                itemClass: 'No data',
                maxQty: 0,
              },
            ];
          }
        },
        error: (err) => {
          this.parts = [
            {
              customer: 'No data',
              itemNo: 'No data',
              itemName: 'No data',
              spec: 'No data',
              itemClass: 'No data',
              maxQty: 0,
            },
          ];
        },
      });
  }

  // ✅ ฟังก์ชันสำหรับปุ่มจัดการ UPH ส่งแค่ Item No ไปให้ Modal ลูก
  manageStandard(item: any) {
    this.currentPartItemNo = item.itemNo;
  }

  async uploadStandardExcel() {
    if (this.file !== undefined) {
      const formData = new FormData();
      formData.append('fileExcel', this.file);

      Swal.fire({
        title: 'กำลังอัพโหลดไฟล์ UPH...',
        html: 'กรุณารอสักครู่ (อาจใช้เวลาสักครู่หากข้อมูลเยอะ)',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const res: any = await firstValueFrom(
          this.http.post(config.apiServer + '/api/partStandard/uploadExcel', formData)
        );

        if (res.message === 'success') {
          Swal.fire({
            title: 'สำเร็จ',
            text: `อัพโหลด UPH สำเร็จจำนวน ${res.count} รายการ!`,
            icon: 'success',
            timer: 3000,
          }).then(() => {
            document.getElementById('modalExcelStandard_btnClose')?.click();
            this.file = undefined; // เคลียร์ไฟล์ทิ้ง
          });
        }
      } catch (err: any) {
        Swal.fire({
          title: 'เกิดข้อผิดพลาด',
          text: err.message || 'ไม่สามารถอัพโหลดไฟล์ได้',
          icon: 'error',
        });
      }
    } else {
      Swal.fire('กรุณาเลือกไฟล์', 'โปรดเลือกไฟล์ Excel ที่ต้องการอัพโหลด', 'warning');
    }
  }

  downloadStandardExcel() {
    this.http
      .get(config.apiServer + '/api/partStandard/downloadExcel', { responseType: 'blob' })
      .subscribe({
        next: (res: Blob) => {
          const blob = new Blob([res], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;

          const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
          link.download = `PartStandard_UPH(${timestamp}).xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: () => Swal.fire('Error', 'ดาวน์โหลดล้มเหลว', 'error')
      });
  }
}