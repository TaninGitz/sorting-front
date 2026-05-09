import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { MyModalComponent } from '../my-modal/my-modal.component';
import { FormsModule } from '@angular/forms';
import config from '../../config';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-defect-list',
  standalone: true,
  imports: [MyModalComponent, FormsModule],
  templateUrl: './defect-list.component.html',
  styleUrl: './defect-list.component.css',
})
export class DefectListComponent implements AfterViewInit {
  // Inject HttpClient เพื่อใช้ในการทำงานกับ API
  constructor(private http: HttpClient) {}

  // ใช้ ViewChild เพื่อเข้าถึง input ฟิลด์ใน template โดยตรง
  @ViewChild('defectInput') nameInput!: ElementRef;

  // ตัวแปรสำหรับเก็บข้อมูลของ defect
  id = 0;
  // defectNo: string = ''; // ❌ ลบออก
  defectName: string = ''; // เก็บชื่อ defect
  remark: string = ''; // เก็บหมายเหตุ
  defects: any[] = []; // เก็บรายการ defects ทั้งหมด
  file: File | undefined = undefined; // ไฟล์ที่เลือกเพื่ออัพโหลด
  searchDefectName: string = ''; // เก็บชื่อ defect สำหรับการค้นหา

  // ฟังก์ชันที่ถูกเรียกเมื่อ component ถูกสร้างขึ้นมา
  ngOnInit() {
    this.fetchData(); // ดึงข้อมูล defect จาก server
  }

  // ฟังก์ชันที่ถูกเรียกเมื่อ view ของ component ถูกแสดงผลเสร็จสิ้น
  ngAfterViewInit() {
    const modalElement = document.getElementById('modalDefect');

    // โฟกัสไปที่ input ฟิลด์เมื่อ modal ถูกเปิด
    if (modalElement) {
      modalElement.addEventListener('shown.bs.modal', () => {
        this.nameInput.nativeElement.focus();
      });
    }
  }

  // ฟังก์ชันสำหรับดึงข้อมูล defects จาก server
  fetchData() {
    this.http.get(config.apiServer + '/api/defect/list').subscribe({
      next: (res: any) => {
        this.defects = res.results; // อัพเดทรายการ defects
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

  // ฟังก์ชันเคลียร์ข้อมูลในฟอร์มและตั้งค่าให้ focus ที่ input ฟิลด์
  clearForm() {
    this.id = 0;
    // this.defectNo = ''; // ❌ ลบออก
    this.defectName = '';
    this.remark = '';

    // ตั้งเวลาเพื่อให้ modal เปิดแล้วค่อย focus ที่ input ฟิลด์
    setTimeout(() => {
      this.nameInput.nativeElement.focus();
    }, 100);
  }

  // ฟังก์ชันบันทึก defect (เพิ่มหรืออัพเดท)
  save() {
    const payload = {
      // defectNo: this.defectNo, // ❌ ลบออก
      defectName: this.defectName,
      remark: this.remark,
      id: this.id,
    };

    if (this.id > 0) {
      // กรณีอัพเดท defect ที่มีอยู่
      this.http
        .put(config.apiServer + '/api/defect/update', payload)
        .subscribe({
          next: (res: any) => {
            if (res.message === 'success') {
              Swal.fire({
                title: 'สำเร็จ',
                text: 'อัพเดทเรียบร้อย',
                icon: 'success',
                timer: 3000,
              }).then(() => {
                this.fetchData(); // อัพเดทข้อมูล defect ใหม่
                document.getElementById('modalDefect_btnClose')?.click(); // ปิด modal
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
      // กรณีเพิ่ม defect ใหม่
      this.http
        .post(config.apiServer + '/api/defect/create', payload)
        .subscribe({
          next: (res: any) => {
            if (res.message === 'success') {
              Swal.fire({
                title: 'สำเร็จ',
                text: 'บันทึกข้อมูลเรียบร้อย',
                icon: 'success',
                timer: 3000,
              }).then(() => {
                this.fetchData(); // อัพเดทรายการ defect
                document.getElementById('modalDefect_btnClose')?.click(); // ปิด modal
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

  // ฟังก์ชันแก้ไข defect
  edit(item: any) {
    // this.defectNo = item.defectNo; // ❌ ลบออก
    this.defectName = item.defectName;
    this.remark = item.remark;
    this.id = item.id;

    // โฟกัสไปที่ input ฟิลด์หลังจาก delay เล็กน้อย
    setTimeout(() => {
      this.nameInput.nativeElement.focus();
    }, 100);
  }

  // ฟังก์ชันลบ defect
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
        // ลบ defect โดยส่งคำร้องขอไปยัง server
        this.http
          .delete(config.apiServer + '/api/defect/remove/' + item.id)
          .subscribe({
            next: (res: any) => {
              this.fetchData(); // อัพเดทข้อมูลหลังจากลบสำเร็จ
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

  // ฟังก์ชันเมื่อมีการเลือกไฟล์
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
            config.apiServer + '/api/defect/uploadFormExcel',
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
            this.fetchData(); // อัพเดทรายการ defect ใหม่
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
      .get(config.apiServer + '/api/defect/downloadExcel', {
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
          const fileName = `DefectList(${timestamp}).xlsx`;

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

  // ฟังก์ชันกรองรายการ defect ตามชื่อ
  filterDefectName() {
    // ตรวจสอบว่าช่องค้นหาไม่ว่างเปล่าก่อน
    if (this.searchDefectName.trim() === '') {
      this.fetchData(); // ถ้าว่าง ให้ดึงข้อมูลทั้งหมด
      return;
    }

    const payload = {
      defectName: this.searchDefectName, // ชื่อ defect ที่ผู้ใช้พิมพ์
    };

    // ส่งคำร้องขอเพื่อค้นหาชื่อ defect
    this.http
      .post(config.apiServer + '/api/defect/filterDefectName', payload)
      .subscribe({
        next: (res: any) => {
          if (res.results.length > 0) {
            this.defects = res.results; // ถ้าพบข้อมูล
          } else {
            this.defects = [
              { defectName: 'No data', remark: '' }, // ❌ เอา defectNo ออกจาก placeholder
            ]; // ถ้าไม่พบข้อมูล
          }
        },
        error: (err) => {
          this.defects = [
            { defectName: 'No data', remark: '' }, // ❌ เอา defectNo ออกจาก placeholder
          ]; // กรณีเกิดข้อผิดพลาด
        },
      });
  }
}