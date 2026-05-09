import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { MyModalComponent } from '../my-modal/my-modal.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import config from '../../config';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-group-list', // ✅ เปลี่ยนชื่อ selector
  standalone: true,
  imports: [MyModalComponent, FormsModule, CommonModule],
  templateUrl: './group-list.component.html', // ✅ อ้างอิงไฟล์ html ใหม่
  styleUrl: './group-list.component.css', // ✅ อ้างอิงไฟล์ css ใหม่
})
export class GroupListComponent implements AfterViewInit {
  @ViewChild('groupNameInput') nameInput!: ElementRef;

  constructor(private http: HttpClient) {}

  id: number = 0;
  groupName: string = '';
  remark: string = '';
  groups: any[] = []; // ✅ เปลี่ยนชื่อตัวแปรจาก groupSorts เป็น groups ให้สั้นลง
  file: File | undefined = undefined;
  searchGroupName: string = '';

  ngOnInit() {
    this.fetchData();
  }

  ngAfterViewInit() {
    // ✅ อ้างอิง ID modalGroup ตาม HTML
    const modalElement = document.getElementById('modalGroup');
    if (modalElement) {
      modalElement.addEventListener('shown.bs.modal', () => {
        this.nameInput.nativeElement.focus();
      });
    }
  }

  fetchData() {
    // API ยังคงใช้ groupSort ตาม Backend
    this.http.get(config.apiServer + '/api/groupSort/list').subscribe({
      next: (res: any) => {
        this.groups = res.results;
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
    this.id = 0;
    this.groupName = '';
    this.remark = '';

    setTimeout(() => {
      this.nameInput.nativeElement.focus();
    }, 100);
  }

  save() {
    const payload = {
      groupName: this.groupName,
      remark: this.remark,
      id: this.id,
    };

    if (this.id > 0) {
      this.http
        .put(config.apiServer + '/api/groupSort/update', payload)
        .subscribe({
          next: (res: any) => {
            if (res.message === 'success') {
              Swal.fire({
                title: 'สำเร็จ',
                text: 'อัพเดทเรียบร้อย',
                icon: 'success',
                timer: 3000,
              }).then(() => {
                this.fetchData();
                // ✅ ปิด Modal โดยอ้างอิง ID ใหม่
                document.getElementById('modalGroup_btnClose')?.click();
                this.id = 0;
              });
            }
          },
          error: (err) => {
            Swal.fire({
              title: 'Error',
              text: err.message,
              icon: 'error',
            });
          },
        });
    } else {
      this.http
        .post(config.apiServer + '/api/groupSort/create', payload)
        .subscribe({
          next: (res: any) => {
            if (res.message === 'success') {
              Swal.fire({
                title: 'สำเร็จ',
                text: 'บันทึกข้อมูลเรียบร้อย',
                icon: 'success',
                timer: 3000,
              }).then(() => {
                this.fetchData();
                document.getElementById('modalGroup_btnClose')?.click();
              });
            }
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
  }

  edit(item: any) {
    this.groupName = item.groupName;
    this.remark = item.remark;
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
          .delete(config.apiServer + '/api/groupSort/remove/' + item.id)
          .subscribe({
            next: (res: any) => {
              this.fetchData();
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
          this.http.post(
            config.apiServer + '/api/groupSort/uploadFormExcel',
            formData
          )
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
          title: 'Error',
          text: err.message,
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
      .get(config.apiServer + '/api/groupSort/downloadExcel', {
        responseType: 'blob',
      })
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
          const fileName = `GroupList(${timestamp}).xlsx`;

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

  filterGroupName() {
    if (this.searchGroupName.trim() === '') {
      this.fetchData();
      return;
    }

    const payload = {
      groupName: this.searchGroupName,
    };

    this.http
      .post(config.apiServer + '/api/groupSort/filterGroupName', payload)
      .subscribe({
        next: (res: any) => {
          if (res.results.length > 0) {
            this.groups = res.results;
          } else {
            this.groups = [
              { groupName: 'No data', remark: '' },
            ];
          }
        },
        error: (err) => {
          this.groups = [
            { groupName: 'No data', remark: '' },
          ];
        },
      });
  }
}