import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  AfterViewInit,
} from '@angular/core';
import { MyModalComponent } from '../my-modal/my-modal.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import config from '../../config';
import { ChangeDetectorRef } from '@angular/core';

// Import Bootstrap (ถ้าใช้ Modal แบบ JS)
declare var bootstrap: any;

@Component({
  selector: 'app-sorting-input',
  standalone: true,
  imports: [MyModalComponent, FormsModule, CommonModule],
  templateUrl: './input-sorting.component.html',
  styleUrl: './input-sorting.component.css',
})
export class InputSortingComponent implements OnInit, AfterViewInit {
  @ViewChild('itemNoInput') itemNoInput!: ElementRef;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  // --- Header Data ---
  headTempId: number = 0;
  userId: number = 0;

  // Header Inputs
  groupSortId: any = null;
  sortingCase: string = '';
  rejectNo: string = '';
  toolId: any = null;
  // sortingDate: string = new Date().toISOString().split('T')[0];
  sortingDate: string = '';
  shift: string = '';
  remark: string = '';

  // Item Inputs (Context)
  itemNo: string = '';
  itemName: string = '';
  wosNo: string = '';
  dieNo: string = '';
  lotNo: string = '';
  drwNo: string = '';
  lastCheckedItemNo: string = '';

  // Master Data Lists
  groupSorts: any[] = [];
  tools: any[] = [];
  defects: any[] = [];
  processes: any[] = [];

  // Saved Data
  savedDetails: any[] = [];

  // Dropdown Options
  boxLetters: string[] = 'ABC'.split('');
  // boxNumbers: number[] = Array.from({ length: 700 }, (_, i) => i + 1);
  // boxNumbers: number[] = [];

  // Current Box Data
  currentBox: any = {
    id: null, // ✅ ถ้ามีค่า = Edit, ถ้า null = Create
    boxLetter: 'A',
    boxNumber: 1,
    boxNo: '',
    inputQty: 0,
    okQty: 0,
    ngQty: 0,
    ngList: [],
    pdList: [],
  };

  // ✅ ตัวแปรสำหรับแก้ไข Reject No
  newRejectNo: string = '';
  editRejectModal: any;

  // ✅ ตัวแปรสำหรับแก้ไข Remark
  newRemark: string = '';
  editRemarkModal: any;

  detailModal: any;

  // เพิ่มตัวแปรสำหรับแก้ไข Header
  editHeadData: any = {};
  editHeaderModalInstance: any;

  ngOnInit() {
    this.fetchMasters();
    const storedUserId = localStorage.getItem('sorting_id');
    if (storedUserId) {
      this.userId = parseInt(storedUserId);
      this.checkSession();
    }

    this.setDefaultDate();
    this.setDefaultShift();

    // ✅ สร้าง Array 700 ตัวตอนที่หน้าจอเริ่ม Init
    // this.generateBoxNumbers();
  }

  // ✅ เพิ่มฟังก์ชันสร้าง Array
  // generateBoxNumbers() {
  //   const nums = [];
  //   for (let i = 1; i <= 700; i++) {
  //     nums.push(i);
  //   }
  //   this.boxNumbers = nums;
  // }

  ngAfterViewInit() {
    this.focusItemInput();
  }

  focusItemInput() {
    // หน่วงเวลาเล็กน้อยเพื่อให้ DOM พร้อมก่อน Focus
    setTimeout(() => {
      if (this.itemNoInput) {
        this.itemNoInput.nativeElement.value = ''; // เคลียร์ค่าใน Element โดยตรงเพื่อความชัวร์
        this.itemNoInput.nativeElement.focus();
      }
    }, 300);
  }

  // --- API Functions ---
  fetchMasters() {
    this.http
      .get(config.apiServer + '/api/groupSort/list')
      .subscribe((res: any) => (this.groupSorts = res.results));
    this.http
      .get(config.apiServer + '/api/tool/list')
      .subscribe((res: any) => (this.tools = res.results));
    this.http
      .get(config.apiServer + '/api/defect/list')
      .subscribe((res: any) => (this.defects = res.results));
    this.http
      .get(config.apiServer + '/api/process/list')
      .subscribe((res: any) => (this.processes = res.results));
  }

  fetchPartInfo() {
    const currentInput = this.itemNo?.trim() || '';

    // 1. ถ้าช่องว่างเปล่า ไม่ต้องทำอะไร
    if (!currentInput) {
      this.itemName = '';
      this.lastCheckedItemNo = '';
      return;
    }

    // 2. ถ้าค่าที่แสกนมาเหมือนเดิมเป๊ะ ไม่ต้องยิง API ซ้ำ
    if (currentInput === this.lastCheckedItemNo) return;

    // ✅ 3. ยิง API เส้นใหม่สำหรับเช็ค Exact Match
    this.http
      .post(config.apiServer + '/api/part/checkExactItemNo', {
        itemNo: currentInput,
      })
      .subscribe({
        next: (res: any) => {
          // ถ้า Backend หาเจอเป๊ะๆ จะส่ง results ที่เป็น Object กลับมา (ไม่ใช่ null)
          if (res.results && res.results.itemName) {
            // ✅ เจอข้อมูลเป๊ะ: อัปเดตค่าและจำไว้
            this.itemNo = currentInput;
            // this.itemName = res.results.itemName;
            this.lastCheckedItemNo = currentInput;
          } else {
            // ❌ ไม่เจอ หรือพิมพ์ตกหล่น: ให้เด้ง Error ทันที
            this.handleItemNotFound();
          }
        },
        error: () => {
          // เผื่อเกิด Error จาก Server ฝั่งนู้น
          this.handleItemNotFound();
        },
      });
  }

  // ✅ ฟังก์ชันจัดการตอนหา Item ไม่เจอ (เด้ง Swal)
  handleItemNotFound() {
    // this.itemName = ''; // ไม่ fill ข้อมูลเข้าช่อง ItemName
    this.lastCheckedItemNo = ''; // ล้างค่าที่จำไว้

    Swal.fire({
      title: 'Item No ไม่ถูกต้อง!',
      text: 'ไม่พบ Item No นี้ในระบบ Master กรุณาแสกนหรือตรวจสอบให้ถูกต้อง',
      icon: 'error',
      confirmButtonText: 'ตกลง',
      allowOutsideClick: false, // บังคับให้กดปุ่มตกลงก่อนถึงจะแสกนใหม่ได้
    }).then(() => {
      // this.itemNo = ''; // ล้างช่อง Item No ทิ้ง
      this.itemNo = '';
      this.itemName = '';
      this.wosNo = '';
      this.dieNo = '';
      this.lotNo = '';
      this.drwNo = '';
      this.focusItemInput(); // ดึงเคอร์เซอร์กลับมาให้พร้อมแสกนใหม่ทันที
    });
  }

  checkSession() {
    this.http
      .post(config.apiServer + '/api/sorting/checkUserHead', {
        userId: this.userId,
      })
      .subscribe((res: any) => {
        if (res.headTemp) {
          const h = res.headTemp;
          this.headTempId = h.id;
          this.groupSortId = h.groupSortId;
          this.sortingCase = h.sortingCase;
          this.rejectNo = h.rejectNo;
          this.toolId = h.toolId;
          this.sortingDate = h.sortingDate ? h.sortingDate.split('T')[0] : '';
          this.shift = h.shift;
          this.remark = h.remark;
          this.fetchDetails();
        }
      });
  }

  // fetchDetails() {
  //   this.http
  //     .get(config.apiServer + '/api/sorting/getDetails/' + this.headTempId)
  //     .subscribe((res: any) => {
  //       this.savedDetails = res.results || []; // กันไว้เผื่อเป็น null

  //       // ✅ สั่งให้ Angular วาดหน้าจอใหม่ทันทีที่มีข้อมูลมา
  //       this.cdr.detectChanges();
  //     });
  // }

  fetchDetails() {
    // 1. เช็คก่อนว่ามี Head ID ไหม ถ้าไม่มีไม่ต้องยิง
    if (!this.headTempId || this.headTempId <= 0) {
      console.warn('No HeadTempId, skip fetching details.');
      this.savedDetails = [];
      return;
    }

    // 2. ✅ เพิ่มตัวแปรเวลา (Timestamp) เพื่อแก้ปัญหา Browser Cache
    const timestamp = new Date().getTime();

    this.http
      .get(
        `${config.apiServer}/api/sorting/getDetails/${this.headTempId}?t=${timestamp}`
      )
      .subscribe({
        next: (res: any) => {
          console.log('Fetched Details:', res.results); // ดู Log ว่าข้อมูลมาจริงไหม
          this.savedDetails = res.results || [];

          // 3. บังคับอัปเดตหน้าจอ
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching details:', err);
          // Optional: แจ้งเตือนถ้าโหลดข้อมูลไม่สำเร็จ
        },
      });
  }

  createHead() {
    if (!this.groupSortId || !this.toolId || !this.shift || !this.sortingDate) {
      Swal.fire('Warning', 'กรุณากรอกข้อมูล Header ให้ครบ', 'warning');
      return;
    }

    const payload = {
      userId: this.userId,
      groupSortId: this.groupSortId,
      sortingCase: this.sortingCase,
      rejectNo: this.rejectNo,
      toolId: this.toolId,
      sortingDate: this.sortingDate,
      shift: this.shift,
      remark: this.remark,
    };

    this.http
      .post(config.apiServer + '/api/sorting/createHead', payload)
      .subscribe((res: any) => {
        this.headTempId = res.headTemp.id;
        Swal.fire({
          icon: 'success',
          title: 'Start Session',
          timer: 1000,
          showConfirmButton: false,
        });
        this.focusItemInput();
      });
  }

  // ✅ ฟังก์ชันเคลียร์ค่า (Clear Input) ที่แก้ไขแล้ว
  // ใช้สำหรับปุ่ม "ล้างข้อมูล" และ "หลังจากบันทึกเสร็จ"
  clearInput() {
    // 1. เคลียร์ Context Inputs
    this.itemNo = '';
    this.itemName = '';
    this.wosNo = '';
    this.dieNo = '';
    this.lotNo = '';
    this.drwNo = '';

    // 2. เคลียร์ Current Box Data (Reset กลับเป็นค่า Default)
    // ไม่มีการ Auto Increment แล้ว
    this.currentBox = {
      boxLetter: 'A', // กลับไปค่าเริ่มต้น
      boxNumber: 1, // กลับไปค่าเริ่มต้น
      boxNo: '',
      inputQty: 0,
      okQty: 0,
      ngQty: 0,
      ngList: [],
      pdList: [],
    };

    // 3. พา Cursor กลับไปช่องแรก
    this.focusItemInput();
  }

  // ✅ แก้ไข: ตรวจสอบ Input ให้ครบถ้วนก่อนเปิด Modal
  openDetailModal() {
    // 1. ตรวจสอบว่ามีข้อมูลครบหรือไม่
    if (
      !this.itemNo ||
      !this.itemName || // ถ้าสแกนผิด itemName จะว่าง ทำให้ไม่ผ่านด่านนี้อยู่แล้ว
      !this.wosNo ||
      !this.lotNo ||
      !this.dieNo ||
      !this.currentBox.inputQty
    ) {
      Swal.fire({
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณากรอกข้อมูล Item No, WOS No, Die No, Lot No และ Input Qty ให้ครบ',
        icon: 'warning',
        confirmButtonText: 'ตกลง',
      }).then(() => {
        // ถ้าข้อมูลไม่ครบเวลาเด้งเตือน ไม่ควรไปเคลียร์ Input ทิ้งทั้งหมด
        // เปลี่ยนเป็นแค่ดึงเคอร์เซอร์กลับมาให้กรอกต่อก็พอครับ
        this.focusItemInput();
      });
      return;
    }

    // Reset เป็น Mode Create
    this.currentBox.id = null;
    this.currentBox.ngList = [];
    this.currentBox.pdList = [];
    this.calculateStats(); // คำนวณเริ่มต้น

    this.openModalDirectly();
  }
  calcNG() {
    this.currentBox.ngQty = this.currentBox.inputQty - this.currentBox.okQty;
    if (this.currentBox.ngQty < 0) this.currentBox.ngQty = 0;
  }

  calculateStats() {
    // 1. หาผลรวม NG จากรายการในตาราง (Sum NG List)
    const totalNg = this.currentBox.ngList.reduce((sum: number, item: any) => {
      return sum + (Number(item.qtyNg) || 0);
    }, 0);

    this.currentBox.ngQty = totalNg;

    // 2. คำนวณ OK = Input - NG Total
    // (ใส่ Logic ป้องกัน OK ติดลบ ถ้า NG เยอะกว่า Input)
    const calculatedOK = this.currentBox.inputQty - totalNg;
    this.currentBox.okQty = calculatedOK < 0 ? 0 : calculatedOK;
  }

  addDefect() {
    this.currentBox.ngList.push({ defectId: null, qtyNg: 0 });
    // ยังไม่ต้องคำนวณ เพราะ qtyNg เป็น 0
  }
  removeDefect(index: number) {
    this.currentBox.ngList.splice(index, 1);
    this.calculateStats();
  }
  addProdDate() {
    this.currentBox.pdList.push({ processId: null, productionDate: '' });
  }
  removeProdDate(index: number) {
    this.currentBox.pdList.splice(index, 1);
  }

  saveDetail() {
    // 1. ตรวจสอบ Input Qty
    if (this.currentBox.inputQty <= 0) {
      Swal.fire('Error', 'Input Qty ต้องมากกว่า 0', 'error');
      return;
    }

    // 2. ตรวจสอบ NG List
    if (this.currentBox.ngList.length > 0) {
      const incompleteDefect = this.currentBox.ngList.some(
        (ng: any) => !ng.defectId || !ng.qtyNg || ng.qtyNg <= 0
      );
      if (incompleteDefect) {
        Swal.fire({
          title: 'ข้อมูลไม่ครบถ้วน',
          text: 'กรุณาเลือก Defect และระบุจำนวนให้ครบทุกรายการ',
          icon: 'warning',
        });
        return;
      }
    }

    // ✅ 3. ตรวจสอบ Process List (ปรับใหม่ให้บังคับกรอก)
    // 3.1 ตรวจสอบว่ามีรายการอย่างน้อย 1 รายการหรือไม่
    if (this.currentBox.pdList.length === 0) {
      Swal.fire({
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณาเพิ่ม "วันที่การผลิต (Production Date)" อย่างน้อย 1 รายการ',
        icon: 'warning',
      });
      return;
    }

    // 3.2 ตรวจสอบว่าในรายการที่เพิ่มมา เลือก Process และ Date ครบไหม
    const incompletePd = this.currentBox.pdList.some(
      (pd: any) =>
        !pd.processId || !pd.productionDate || pd.productionDate.trim() === ''
    );

    if (incompletePd) {
      Swal.fire({
        title: 'ข้อมูลไม่ครบถ้วน',
        text: 'กรุณาเลือก Process และวันที่ผลิตให้ครบทุกรายการ',
        icon: 'warning',
      });
      return;
    }

    // 4. ตรวจสอบยอดรวม NG
    const sumNg = this.currentBox.ngList.reduce(
      (s: number, n: any) => s + (Number(n.qtyNg) || 0),
      0
    );
    const currentNgQty = Number(this.currentBox.ngQty) || 0;

    if (currentNgQty > 0 && sumNg !== currentNgQty) {
      Swal.fire(
        'Error',
        `ผลรวม NG Defect (${sumNg}) ไม่ตรงกับยอด NG (${currentNgQty})`,
        'error'
      );
      return;
    }
    // 5. เตรียม Payload
    const fullBoxNo = `${this.currentBox.boxLetter}${this.currentBox.boxNumber}`;
    const payload = {
      id: this.currentBox.id, // ส่ง ID ไปด้วยเสมอ (ถ้ามี)
      headTempId: this.headTempId,
      itemNo: this.itemNo,
      wosNo: this.wosNo,
      lotNo: this.lotNo,
      dieNo: this.dieNo,
      boxNo: fullBoxNo,
      inputQty: this.currentBox.inputQty,
      okQty: this.currentBox.okQty,
      ngQty: this.currentBox.ngQty,
      ngList: this.currentBox.ngList,
      pdList: this.currentBox.pdList,
    };

    const url = this.currentBox.id
      ? '/api/sorting/updateDetail'
      : '/api/sorting/createDetail';

    // 6. ยิง API
    this.http.post(config.apiServer + url, payload).subscribe({
      next: () => {
        // ปิด Modal ก่อน
        if (this.detailModal) this.detailModal.hide();

        Swal.fire({
          icon: 'success',
          title: this.currentBox.id ? 'Updated' : 'Saved',
          timer: 1000,
          showConfirmButton: false,
        }).then(() => {
          // ✅ ทำงานหลังจาก Alert ปิด (มั่นใจว่า DB update เสร็จ)
          this.fetchDetails();

          // เคลียร์ค่า
          if (!this.currentBox.id) {
            // กรณี Create: ล้าง Input เพื่อเตรียมยิงกล่องต่อไป
            this.clearInput();
          } else {
            // กรณี Edit: ต้องเคลียร์ ID ออก เพื่อไม่ให้ค้างเป็นโหมด Edit
            this.currentBox.id = null;
            // อาจจะเคลียร์ input อื่นๆ ด้วยถ้าต้องการ หรือจะปล่อยไว้ก็ได้
            this.clearInput();
          }
        });
      },
      error: (err) => Swal.fire('Error', err.error.error, 'error'),
    });
  }

  removeDetail(id: number) {
    Swal.fire({
      title: 'ลบรายการ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    }).then((r) => {
      if (r.isConfirmed) {
        this.http
          .delete(config.apiServer + '/api/sorting/removeDetail/' + id)
          .subscribe({
            next: () => {
              // ✅ ใช้ Swal เล็กๆ เพื่อถ่วงเวลาให้ DB ทำงานเสร็จ
              Swal.fire({
                icon: 'success',
                title: 'Deleted',
                timer: 700,
                showConfirmButton: false,
              }).then(() => {
                this.fetchDetails();
              });
            },
            error: (err) => {
              Swal.fire('Error', 'ลบไม่สำเร็จ', 'error');
            },
          });
      }
    });
  }

  endSession() {
    // 1. คำนวณสรุปข้อมูล (เหมือนเดิม)
    const summaryMap = new Map<string, any>();
    let grandTotalBox = 0;
    let grandTotalInput = 0;
    let grandTotalOK = 0;
    let grandTotalNG = 0;

    this.savedDetails.forEach((detail) => {
      grandTotalBox++;
      grandTotalInput += Number(detail.inputQty) || 0;
      grandTotalOK += Number(detail.okQty) || 0;
      grandTotalNG += Number(detail.ngQty) || 0;

      if (!summaryMap.has(detail.itemNo)) {
        summaryMap.set(detail.itemNo, {
          count: 0,
          input: 0,
          ok: 0,
          ng: 0,
        });
      }

      const itemStat = summaryMap.get(detail.itemNo);
      itemStat.count++;
      itemStat.input += Number(detail.inputQty) || 0;
      itemStat.ok += Number(detail.okQty) || 0;
      itemStat.ng += Number(detail.ngQty) || 0;
    });

    // 2. สร้าง HTML Table
    let tableHtml = `
      <div class="text-start mb-2">
        <b>สรุปภาพรวม:</b> <br>
        จำนวนกล่องรวม: ${grandTotalBox} | Input: ${grandTotalInput.toLocaleString()} | OK: ${grandTotalOK.toLocaleString()} | NG: ${grandTotalNG.toLocaleString()}
      </div>
      <div style="max-height: 300px; overflow-y: auto;">
      <table class="table table-bordered table-sm" style="font-size: 0.9rem;">
        <thead class="table-light" style="position: sticky; top: 0;">
          <tr>
            <th>Item No</th>
            <th class="text-end">Box</th>
            <th class="text-end">Input</th>
            <th class="text-end text-success">OK</th>
            <th class="text-end text-danger">NG</th>
          </tr>
        </thead>
        <tbody>
    `;

    summaryMap.forEach((val, key) => {
      tableHtml += `
        <tr>
          <td class="text-start">${key}</td>
          <td class="text-end">${val.count}</td>
          <td class="text-end">${val.input.toLocaleString()}</td>
          <td class="text-end text-success fw-bold">${val.ok.toLocaleString()}</td>
          <td class="text-end text-danger fw-bold">${val.ng.toLocaleString()}</td>
        </tr>
      `;
    });

    tableHtml += `
        </tbody>
      </table>
      </div>
      <div class="mt-2 text-center text-muted small">ต้องการบันทึกข้อมูลเข้าระบบหรือไม่?</div>
    `;

    // 3. แสดง Swal ยืนยัน
    Swal.fire({
      title: 'ยืนยันจบงาน',
      html: tableHtml,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      width: '600px',
    }).then((r) => {
      if (r.isConfirmed) {
        // ✅ 4. แสดง Loading ก่อนยิง API
        Swal.fire({
          title: 'กำลังบันทึกข้อมูล...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        this.http
          .post(config.apiServer + '/api/sorting/endSession', {
            headTempId: this.headTempId,
          })
          .subscribe({
            next: () => {
              // ✅ Success Case
              Swal.fire({
                title: 'Success',
                text: 'บันทึกข้อมูลและจบงานเรียบร้อย',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
              }).then(() => {
                this.resetAll();
              });
            },
            error: (err) => {
              // ✅ Error Handling Case
              console.error('End Session Error:', err);
              Swal.fire({
                title: 'Error',
                text:
                  err.error.error ||
                  'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง',
                icon: 'error',
                confirmButtonText: 'ตกลง',
              });
            },
          });
      }
    });
  }

  cancelSession() {
    Swal.fire({
      title: 'ยกเลิกงาน',
      text: 'ข้อมูลทั้งหมดจะหายไป',
      icon: 'error',
      showCancelButton: true,
    }).then((r) => {
      if (r.isConfirmed) {
        this.http
          .delete(
            config.apiServer + '/api/sorting/cancelSession/' + this.headTempId
          )
          .subscribe(() => this.resetAll());
      }
    });
  }

  resetAll() {
    this.headTempId = 0;
    this.clearInput();

    this.groupSortId = null;
    this.toolId = null;

    this.sortingCase = '';
    this.rejectNo = '';
    this.remark = '';
    this.savedDetails = [];

    // ✅ เรียกฟังก์ชันเดิมเพื่อให้ Logic เหมือนตอนเข้าโปรแกรม
    this.setDefaultDate();
    this.setDefaultShift();
  }
  setDefaultDate() {
    const now = new Date();

    // ถ้าเวลาปัจจุบัน น้อยกว่า 7 โมงเช้า (00:00 - 06:59)
    if (now.getHours() < 7) {
      now.setDate(now.getDate() - 1); // ย้อนหลังไป 1 วัน
    }

    // แปลงเป็น String YYYY-MM-DD (ใช้ Local Time เพื่อความชัวร์เรื่อง Timezone)
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    this.sortingDate = `${year}-${month}-${day}`;
  }

  setDefaultShift() {
    // รับเวลาปัจจุบัน
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    // แปลงเป็นนาทีเพื่อง่ายต่อการเปรียบเทียบ
    const currentTimeInMinutes = hours * 60 + minutes;

    // กำหนดช่วงเวลาแต่ละกะ
    const shiftRanges = [
      {
        shift: 'A',
        start: 7 * 60, // 7:00
        end: 14 * 60 + 59, // 14:59
      },
      {
        shift: 'B',
        start: 15 * 60, // 15:00
        end: 22 * 60 + 59, // 22:59
      },
      {
        shift: 'C',
        start: 23 * 60, // 23:00
        end: 6 * 60 + 39, // 6:39 ของวันถัดไป
      },
    ];

    // ตรวจสอบกะ C พิเศษเพราะคาบเกี่ยวข้ามวัน
    if (
      currentTimeInMinutes >= 23 * 60 || // ตั้งแต่ 23:00 ถึงเที่ยงคืน
      currentTimeInMinutes <= 6 * 60 + 39 // หรือ 00:00 ถึง 6:39
    ) {
      this.shift = 'C';
      return;
    }

    // ตรวจสอบกะ A และ B
    for (const range of shiftRanges) {
      if (
        currentTimeInMinutes >= range.start &&
        currentTimeInMinutes <= range.end
      ) {
        this.shift = range.shift;
        break;
      }
    }

    console.log('Current shift:', this.shift);
  }

  // ✅ ฟังก์ชันกดปุ่ม Edit
  editDetail(item: any) {
    // 1. แยก Box No
    const match = item.boxNo.match(/([A-Z]+)(\d+)/);
    const letter = match ? match[1] : 'A';
    const number = match ? parseInt(match[2]) : 1;

    // 2. Map ข้อมูลใส่ currentBox
    this.currentBox = {
      id: item.id, // ✅ สำคัญมาก: ต้องมีบรรทัดนี้ ไม่งั้นตอน Save จะกลายเป็น Create ใหม่
      boxLetter: letter,
      boxNumber: number,
      boxNo: item.boxNo,
      inputQty: item.inputQty,
      okQty: item.okQty,
      ngQty: item.ngQty,

      // Map NG List
      ngList: item.NgListTemps
        ? item.NgListTemps.map((ng: any) => ({
            defectId: ng.defectId,
            qtyNg: ng.qtyNg,
          }))
        : [],

      // Map Prod Date
      pdList: item.PdDateTemps
        ? item.PdDateTemps.map((pd: any) => ({
            processId: pd.processId,
            productionDate: pd.productionDate
              ? pd.productionDate.split('T')[0]
              : '',
          }))
        : [],
    };

    // 3. เปิด Modal
    this.openModalDirectly();
  }

  showModal() {
    const el = document.getElementById('modalDetail');
    if (el) {
      this.detailModal = new bootstrap.Modal(el);
      this.detailModal.show();
    }
  }

  // ฟังก์ชันเปิด Modal (แยกออกมาเพื่อให้เรียกใช้ได้ทั้งจากปุ่ม Add และ Edit)
  openModalDirectly() {
    const el = document.getElementById('modalDetail');
    if (el) {
      this.detailModal = new bootstrap.Modal(el);
      this.detailModal.show();
    }
  }

  openEditHeaderModal() {
    this.editHeadData = {
      groupSortId: this.groupSortId,
      sortingCase: this.sortingCase,
      rejectNo: this.rejectNo,
      toolId: this.toolId,
      sortingDate: this.sortingDate,
      shift: this.shift,
      remark: this.remark,
    };

    const el = document.getElementById('modalEditHeader');
    if (el) {
      this.editHeaderModalInstance = new bootstrap.Modal(el);
      this.editHeaderModalInstance.show();
    }
  }

  saveHeader() {
    // เช็คค่าบังคับ (Required)
    if (
      !this.editHeadData.groupSortId ||
      !this.editHeadData.toolId ||
      !this.editHeadData.shift ||
      !this.editHeadData.sortingDate
    ) {
      Swal.fire('Warning', 'กรุณากรอกข้อมูล Header ที่จำเป็นให้ครบ', 'warning');
      return;
    }

    const payload = {
      headTempId: this.headTempId,
      ...this.editHeadData,
    };

    this.http
      .post(config.apiServer + '/api/sorting/updateHead', payload)
      .subscribe({
        next: (res: any) => {
          // อัปเดตค่ากลับไปที่หน้าจอหลัก
          this.groupSortId = this.editHeadData.groupSortId;
          this.sortingCase = this.editHeadData.sortingCase;
          this.rejectNo = this.editHeadData.rejectNo;
          this.toolId = this.editHeadData.toolId;
          this.sortingDate = this.editHeadData.sortingDate;
          this.shift = this.editHeadData.shift;
          this.remark = this.editHeadData.remark;

          if (this.editHeaderModalInstance) this.editHeaderModalInstance.hide();

          Swal.fire({
            icon: 'success',
            title: 'Success',
            text: 'แก้ไข Header เรียบร้อยแล้ว',
            timer: 1500,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          Swal.fire('Error', err.error.error || 'ไม่สามารถแก้ไขได้', 'error');
        },
      });
  }
}
