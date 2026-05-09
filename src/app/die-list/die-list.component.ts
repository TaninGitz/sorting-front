import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { MyModalComponent } from '../my-modal/my-modal.component';
import { RouterLink } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AsyncPipe, CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import config from '../../config';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';

@Component({
  selector: 'app-die-list',
  standalone: true,
  imports: [
    MyModalComponent,
    FormsModule,
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    ReactiveFormsModule,
    AsyncPipe,
  ],
  templateUrl: './die-list.component.html',
  styleUrl: './die-list.component.css',
})
export class DieListComponent implements AfterViewInit {
  @ViewChild('nameInput') nameInput!: ElementRef;
  constructor(private http: HttpClient) {}

  id: number = 0;
  itemNo: string = '';
  dieNo: string = '';
  parts: any[] = [];
  dies: any[] = [];
  file: File | undefined = undefined;
  searchItemNo: string = '';

  isEditing: boolean = false;

  partControl = new FormControl();
  filteredPart!: Observable<{ itemNo: string; itemName: string }[]>;

  ngOnInit() {
    this.fetchItemNo();
    this.fetchDataDie();
  }

  ngAfterViewInit() {
    // const modalElement = document.getElementById('modalDie');
    // if (modalElement) {
    //   modalElement.addEventListener('shown.bs.modal', () => {
    //     this.nameInput.nativeElement.focus();
    //   });
    // }
  }

  fetchItemNo() {
    this.http.get(config.apiServer + '/api/part/list').subscribe({
      next: (res: any) => {
        this.parts = res.results; // อัพเดทรายการ part
        this.setUpFilter();
      },
      error: (err) => {
        // แสดงข้อความ error เมื่อมีปัญหา
        Swal.fire({
          title: 'Error',
          text: err.message,
          icon: 'error',
        });
      },
    });
  }

  private setUpFilter() {
    this.filteredPart = this.partControl.valueChanges.pipe(
      startWith(''),
      map((value) => (typeof value === 'string' ? value : value.itemNo)),
      map((name) => this.filterParts(name))
    );
  }

  private filterParts(name: string) {
    const filterValue = name.toLowerCase();
    return this.parts.filter((part) =>
      part.itemNo.toLowerCase().includes(filterValue)
    );
  }

  clearForm() {
    this.itemNo = '';
    this.dieNo = '';
    this.id = 0;
    this.isEditing = false;

    //     setTimeout(() => {
    //   this.nameInput.nativeElement.focus();
    // }, 100);
  }

  fetchDataDie() {
    this.http.get(config.apiServer + '/api/die/list').subscribe({
      next: (res: any) => {
        this.dies = res.results; // อัพเดทรายการ die
      },
      error: (err) => {
        // แสดงข้อความ error เมื่อมีปัญหา
        Swal.fire({
          title: 'Error',
          text: err.message,
          icon: 'error',
        });
      },
    });
  }

  save() {
    const payload = {
      itemNo: this.itemNo,
      dieNo: this.dieNo,
      id: this.id,
    };

    if (this.id > 0) {
      // กรณีอัพเดท Die ที่มีอยู่
      this.http.put(config.apiServer + '/api/die/update', payload).subscribe({
        next: (res: any) => {
          if (res.message === 'success') {
            Swal.fire({
              title: 'สำเร็จ',
              text: 'อัพเดทเรียบร้อย',
              icon: 'success',
              timer: 3000,
            }).then(() => {
              this.fetchDataDie(); // อัพเดทข้อมูล Die ใหม่
              document.getElementById('modalDie_btnClose')?.click(); // ปิด modal
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
      // กรณีเพิ่ม Die ใหม่
      this.http.post(config.apiServer + '/api/die/create', payload).subscribe({
        next: (res: any) => {
          if (res.message === 'success') {
            Swal.fire({
              title: 'สำเร็จ',
              text: 'บันทึกข้อมูลเรียบร้อย',
              icon: 'success',
              timer: 3000,
            }).then(() => {
              this.fetchDataDie(); // อัพเดทรายการ Die
              document.getElementById('modalDie_btnClose')?.click(); // ปิด modal
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
    this.itemNo = item.itemNo;
    this.dieNo = item.dieNo;
    this.id = item.id;

    this.isEditing = true;
    // โฟกัสไปที่ input ฟิลด์หลังจาก delay เล็กน้อย
    // setTimeout(() => {
    //   this.nameInput.nativeElement.focus();
    // }, 100);
  }

  async remove(item: any) {
    try {
      // ยืนยันการลบด้วย SweetAlert
      const button = await Swal.fire({
        title: 'ลบรายการ',
        text: 'คุณต้องการลบรายการใช่หรือไม่',
        icon: 'question',
        showCancelButton: true,
        showConfirmButton: true,
      });

      if (button.isConfirmed) {
        // ส่งคำร้องขอไปยัง server
        this.http
          .delete(config.apiServer + '/api/die/remove/' + item.id)
          .subscribe({
            next: (res: any) => {
              this.fetchDataDie(); // อัพเดทข้อมูลหลังจากลบสำเร็จ
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
      this.file = file.files[0]; // เก็บไฟล์ที่เลือกไว้ในตัวแปร
    }
  }

  // ฟังก์ชันอัพโหลดไฟล์
  async uploadFile() {
    if (this.file !== undefined) {
      const formData = new FormData();
      formData.append('fileExcel', this.file); // เตรียมฟอร์มข้อมูลสำหรับส่งไฟล์

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
        // อัพโหลดไฟล์ไปยัง server
        const res: any = await firstValueFrom(
          this.http.post(
            config.apiServer + '/api/die/uploadFormExcel',
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
            this.fetchDataDie(); // อัพเดทรายการ die ใหม่
            document.getElementById('modalExcel_btnClose')?.click(); // ปิด modal
          });
        }
      } catch (err: any) {
        Swal.fire({
          title: 'Error',
          text: err.message,
          icon: 'error',
        });
      }
    }
  }

  // ฟังก์ชันดาวน์โหลดไฟล์ Excel
  downloadExcel() {
    this.http
      .get(config.apiServer + '/api/die/downloadExcel', {
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

          // กำหนดชื่อไฟล์ตามเวลาปัจจุบัน
          const currentDate = new Date();
          const timestamp = currentDate
            .toISOString()
            .replace(/[-T:.Z]/g, '')
            .slice(0, 14);
          const fileName = `DieList(${timestamp}).xlsx`;

          link.download = fileName;
          link.click();
          window.URL.revokeObjectURL(url); // ทำความสะอาด URL หลังจากใช้งาน

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
  filterItemNo() {
    // ตรวจสอบว่าช่องค้นหาไม่ว่างเปล่าก่อน
    if (this.searchItemNo.trim() === '') {
      this.fetchDataDie(); // ถ้าว่าง ให้ดึงข้อมูลทั้งหมด
      return;
    }

    const payload = {
      itemNo: this.searchItemNo, // ชื่อ itemNo ที่ผู้ใช้พิมพ์
    };

    // ส่งคำร้องขอเพื่อค้นหาชื่อ defect
    this.http
      .post(config.apiServer + '/api/die/filterItemNo', payload)
      .subscribe({
        next: (res: any) => {
          if (res.results.length > 0) {
            this.dies = res.results; // ถ้าพบข้อมูล
          } else {
            this.dies = [
              {
                itemNo: 'No data',
                dieNo: 'No data',
              },
            ]; // ถ้าไม่พบข้อมูล
          }
        },
        error: (err) => {
          this.dies = [
            {
              itemNo: 'No data',
              dieNo: 'No data',
            },
          ]; // กรณีเกิดข้อผิดพลาด
        },
      });
  }
}
