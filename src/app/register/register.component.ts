import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { MyModalComponent } from '../my-modal/my-modal.component';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import config from '../../config';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [MyModalComponent, FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements AfterViewInit {
  @ViewChild('nameInput') nameInput!: ElementRef; // เพิ่ม ViewChild เพื่อให้สามารถใช้งาน focus

  constructor(private http: HttpClient) {}

  id: number = 0;
  name: string = '';
  empNo: string = '';
  rfid: string = '';
  level: string = '';
  section: string = '';
  password: string = '';
  users: any[] = [];
  file: File | undefined = undefined;
  searchEmpNo: string = '';

  ngOnInit() {
    this.fetchData();
  }

  ngAfterViewInit() {
    const modalElement = document.getElementById('modalRegister');
    if (modalElement) {
      modalElement.addEventListener('shown.bs.modal', () => {
        this.nameInput.nativeElement.focus();
      });
    }
  }


  fetchData() {
    this.http.get(config.apiServer + '/api/user/list').subscribe({
      next: (res: any) => {
        this.users = res.results;
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
    this.name = '';
    this.empNo = '';
    this.password = '';
    this.rfid = '';
    this.level = '';
    this.section = '';
    this.id = 0;

    // Clear form and wait until modal is shown, then focus on name input
    setTimeout(() => {
      this.nameInput.nativeElement.focus();
    }, 100);
  }

  // save() {
  //   try {
  //     const payload = {
  //       name: this.name,
  //       empNo: this.empNo,
  //       rfid: this.rfid,
  //       password: this.password,
  //       level: this.level,
  //       section: this.section,
  //       id: this.id,
  //     };

  //     if (this.id > 0) {
  //       this.http
  //         .put(config.apiServer + '/api/user/update', payload)
  //         .subscribe((res: any) => {
  //           this.fetchData();
  //           this.id = 0;
  //         });
  //     } else {
  //       this.http
  //         .post(config.apiServer + '/api/user/create', payload)
  //         .subscribe((res: any) => {
  //           this.fetchData();
  //         });
  //     }

  //     document.getElementById('modalRegister_btnClose')?.click();
  //   } catch (e: any) {
  //     Swal.fire({
  //       title: 'error',
  //       text: e.message,
  //       icon: 'error',
  //     });
  //   }
  // }

  save() {
    const payload = {
      name: this.name,
      empNo: this.empNo,
      rfid: this.rfid,
      password: this.password,
      level: this.level,
      section: this.section,
      id: this.id,
    };

    if (this.id > 0) {
      this.http.put(config.apiServer + '/api/user/update', payload).subscribe({
        next: (res: any) => {
          if (res.message === 'success') {
            Swal.fire({
              title: 'success',
              text: 'Update Completed',
              icon: 'success',
              timer: 3000,
            }).then(() => {
              this.fetchData();
              document.getElementById('modalRegister_btnClose')?.click(); // ปิด modal ที่นี่
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
      this.http.post(config.apiServer + '/api/user/create', payload).subscribe({
        next: (res: any) => {
          if (res.message === 'success') {
            Swal.fire({
              title: 'success',
              text: 'Update Completed',
              icon: 'success',
              timer: 3000,
            }).then(() => {
              this.fetchData();
              document.getElementById('modalRegister_btnClose')?.click();
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
    this.name = item.name;
    this.empNo = item.empNo;
    this.password = item.password;
    this.rfid = item.rfid;
    this.level = item.level;
    this.section = item.section;
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
          .delete(config.apiServer + '/api/user/remove/' + item.id)
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
  //   async remove(item: any) {
  //     try {
  //       const button = await Swal.fire({
  //         title: 'ลบรายการ',
  //         text: 'คุณต้องการลบรายการใช่หรือไม่',
  //         icon: 'question',
  //         showCancelButton: true,
  //         showConfirmButton: true,
  //       });

  //       if (button.isConfirmed) {
  //         this.http
  //           .delete(config.apiServer + '/api/user/remove/' + item.id)
  //           .subscribe((res: any) => {
  //             this.fetchData();
  //           });
  //       }
  //     } catch (e: any) {
  //       Swal.fire({
  //         title: 'error',
  //         text: e.message,
  //         icon: 'error',
  //       });
  //     }
  //   }

  fileSelected(file: any) {
    if (file.files != undefined) {
      if (file.files.length > 0) {
        this.file = file.files[0];
      }
    }
  }
  // async uploadFile() {
  //   if (this.file !== undefined) {
  //     const formData = new FormData();
  //     formData.append('fileExcel', this.file);

  //     const res: any = await firstValueFrom(
  //       this.http.post(config.apiServer + '/api/user/uploadFormExcel', formData)
  //     );

  //     return res.fileName;
  //   }
  // }

  async uploadFile() {
    if (this.file !== undefined) {
      const formData = new FormData();
      formData.append('fileExcel', this.file);

      // แสดง loading state
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
        // ส่งไฟล์ไปยัง server
        const res: any = await firstValueFrom(
          this.http.post(
            config.apiServer + '/api/user/uploadFormExcel',
            formData
          )
        );

        // เมื่อสำเร็จให้แสดง Swal และเรียก fetchData()
        if (res.message === 'success') {
          Swal.fire({
            title: 'Success',
            text: 'File uploaded and processed successfully!',
            icon: 'success',
            timer: 3000,
          }).then(() => {
            // เรียก fetchData() เพื่ออัปเดตข้อมูล
            this.fetchData();
            document.getElementById('modalExcel_btnClose')?.click();
          });
        }
      } catch (err: any) {
        // แสดง error message เมื่อเกิดข้อผิดพลาด
        Swal.fire({
          title: 'Error',
          text: err.message,
          icon: 'error',
        });
      }
    }
  }

  downloadExcel() {
    this.http
      .get(config.apiServer + '/api/user/downloadExcel', {
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

          // ให้ชื่อไฟล์ตามที่เซิร์ฟเวอร์กำหนด
          const currentDate = new Date();
          const timestamp = currentDate
            .toISOString()
            .replace(/[-T:.Z]/g, '')
            .slice(0, 14);
          const fileName = `UserList(${timestamp}).xlsx`;

          link.download = fileName;
          link.click();

          // ทำความสะอาด URL ที่สร้างขึ้น
          window.URL.revokeObjectURL(url);

          // แสดง Swal หลังจากดาวน์โหลดสำเร็จ
          Swal.fire({
            title: 'Download Completed',
            text: `The file ${fileName} has been downloaded successfully.`,
            icon: 'success',
            timer: 3000, // กำหนดเวลาปิดอัตโนมัติ 3 วินาที
            showConfirmButton: false,
          });
        },
        (error) => {
          // จัดการข้อผิดพลาดถ้ามี
          console.error('Error downloading file', error);
          Swal.fire({
            title: 'Download Failed',
            text: 'There was an error downloading the file. Please try again.',
            icon: 'error',
          });
        }
      );
  }

  filterEmpNo() {
    // ตรวจสอบว่า input ไม่เป็นค่าว่างก่อนส่งไปหา server
    if (this.searchEmpNo.trim() === '') {
      // this.users = []; // ล้างข้อมูลถ้าไม่มีการพิมพ์ค่าใด ๆ
      this.fetchData();
      return;
    }

    const payload = {
      empNo: this.searchEmpNo, // ข้อมูลที่ผู้ใช้กำลังพิมพ์
    };

    // ส่งคำร้องขอไปยัง server เพื่อค้นหา
    this.http
      .post(config.apiServer + '/api/user/filterEmpNo', payload)
      .subscribe({
        next: (res: any) => {
          // อัปเดตตารางข้อมูลตามผลลัพธ์ที่ค้นหาได้
          if (res.results.length > 0) {
            this.users = res.results; // มีข้อมูล
          } else {
            this.users = [
              { name: '', empNo: 'No data', rfid: '', level: '', section: '' },
            ]; // ไม่มีข้อมูล
          }
        },
        error: (err) => {
          this.users = [
            { name: '', empNo: 'No data', rfid: '', level: '', section: '' },
          ];
        },
      });
  }
}
