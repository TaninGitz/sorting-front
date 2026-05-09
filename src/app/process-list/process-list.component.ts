import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { MyModalComponent } from '../my-modal/my-modal.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import config from '../../config';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-process-list',
  standalone: true,
  imports: [MyModalComponent, FormsModule, CommonModule],
  templateUrl: './process-list.component.html',
  styleUrl: './process-list.component.css',
})
export class ProcessListComponent implements AfterViewInit {
  @ViewChild('prcNameInput') nameInput!: ElementRef;

  constructor(private http: HttpClient) {}

  id: number = 0;
  prcName: string = '';
  processes: any[] = [];
  file: File | undefined = undefined;
  searchPrcName: string = '';

  ngOnInit() {
    this.fetchData();
  }

  ngAfterViewInit() {
    const modalElement = document.getElementById('modalProcess');
    if (modalElement) {
      modalElement.addEventListener('shown.bs.modal', () => {
        this.nameInput.nativeElement.focus();
      });
    }
  }

  fetchData() {
    this.http.get(config.apiServer + '/api/process/list').subscribe({
      next: (res: any) => {
        this.processes = res.results;
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
    this.prcName = '';

    setTimeout(() => {
      this.nameInput.nativeElement.focus();
    }, 100);
  }

  save() {
    const payload = {
      prcName: this.prcName,
      id: this.id,
    };

    if (this.id > 0) {
      this.http
        .put(config.apiServer + '/api/process/update', payload)
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
                document.getElementById('modalProcess_btnClose')?.click();
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
        .post(config.apiServer + '/api/process/create', payload)
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
                document.getElementById('modalProcess_btnClose')?.click();
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
    this.prcName = item.prcName;
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
          .delete(config.apiServer + '/api/process/remove/' + item.id)
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
            config.apiServer + '/api/process/uploadFormExcel',
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
      .get(config.apiServer + '/api/process/downloadExcel', {
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
          const fileName = `ProcessList(${timestamp}).xlsx`;

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

  filterPrcName() {
    if (this.searchPrcName.trim() === '') {
      this.fetchData();
      return;
    }

    const payload = {
      prcName: this.searchPrcName,
    };

    this.http
      .post(config.apiServer + '/api/process/filterPrcName', payload)
      .subscribe({
        next: (res: any) => {
          if (res.results.length > 0) {
            this.processes = res.results;
          } else {
            this.processes = [
              { prcName: 'No data' },
            ];
          }
        },
        error: (err) => {
          this.processes = [
            { prcName: 'No data' },
          ];
        },
      });
  }
}