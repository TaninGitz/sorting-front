# 📦 WebSorting - Sorting Management System

ระบบจัดการและบันทึกข้อมูลการคัดแยกชิ้นงาน (Sorting) สำหรับโรงงานอุตสาหกรรม รองรับการบันทึกข้อมูลการปฏิบัติงานแบบ Real-time, การจัดการเป้าหมายการผลิต (UPH), และการออกรายงานวิเคราะห์ประสิทธิภาพการทำงาน (Earned Hours)

---

## 🛠️ Tech Stack

**Frontend**
* **Framework:** Angular (Standalone Components)
* **Styling:** Bootstrap 5, Custom CSS
* **UI Components:** SweetAlert2 (สำหรับการแจ้งเตือนและ Loading)

**Backend**
* **Environment:** Node.js
* **Framework:** Express.js
* **ORM:** Prisma
* **Database:** Microsoft SQL Server
* **Key Libraries:** * `exceljs` (สร้าง/อ่านไฟล์ Excel พร้อมจัด Styling)
    * `express-fileupload` (จัดการ Upload ไฟล์)

---

## 🚀 Key Features & Functions

### 1. 📥 Input Sorting (ระบบบันทึกการคัดแยกชิ้นงาน)
* **Performance Optimization (Box No):** เปลี่ยนจากการใช้ `<select>` Dropdown ที่มี 700 ตัวเลือก มาเป็น `<input type="number">` เพื่อแก้ปัญหา Browser หน่วงและลดภาระการ Render ของ Angular (DOM Performance)
* **Exact Item Matching:** ยิง API `checkExactItemNo` เพื่อตรวจสอบรหัสชิ้นงานให้เป๊ะ 100% หากไม่พบข้อมูลจะแจ้งเตือนผ่าน SweetAlert2 ทันที และบังคับให้สแกนใหม่
* **Session Management:** * ทำงานผ่านระบบ Temp/Draft (ตาราง `HeadTemp`, `DetailTemp`) ป้องกันข้อมูลสูญหายระหว่างการคัดแยก
    * สรุปยอดรวม (Input, OK, NG) อัตโนมัติเมื่อกด `End Session` พร้อมย้ายข้อมูลเข้าสู่ตาราง History (`SortingHead`, `SortingDetail`)
* **Auto Shift & Date:** ฟังก์ชันคำนวณ "กะการทำงาน (Shift A, B, C)" และ "วันที่ทำงาน (Sorting Date)" อัตโนมัติตามเวลาปัจจุบัน (ตัดรอบกะที่ 07:00 น.)

### 2. 🗄️ Master Data (การจัดการข้อมูลหลัก)
* **Part & UPH Standard:** ระบบจัดการข้อมูล Part และเป้าหมาย Output/Hour (UPH) โดยแยกตามอุปกรณ์ที่ใช้ (Tool)
* **Component Architecture:** แยกฟังก์ชันการจัดการ UPH เป็น Child Component (`PartStandardComponent`) ฝังไว้ใน Modal ของหน้า Part List ลดความซับซ้อนของโค้ดหน้าหลัก
* **Excel Upload (Upsert Logic):** * อัปโหลดไฟล์ Excel ผ่าน `express-fileupload`
    * ตรวจสอบเงื่อนไข: หากมี Tool ID อยู่แล้วให้อัปเดตค่า (Update) หากไม่มีให้สร้างใหม่ (Create)
    * รองรับค่า Default Tool โดยการใส่เลข `0` ในไฟล์ Excel ซึ่งระบบจะแปลงเป็น `null` ให้อัตโนมัติ
* **Left-Join Excel Export:** ดึงข้อมูล Part ทั้งหมดออกมาลง Excel (แม้ยังไม่มีการตั้งค่า UPH) เพื่อให้ User เห็นรายการที่ตกหล่น เติมตัวเลข แล้วอัปโหลดกลับเข้าระบบได้ทันที

### 3. 📊 Reports & Analytics (ระบบรายงาน)
* **Earned Hours Dashboard (รายงานชั่วโมงการทำงานจริง):** * คำนวณ Performance พนักงานจากสูตร: `Total Input Qty / stdOutputPerHour`
    * Grouping ข้อมูลอัตโนมัติตาม: `วันที่ -> รหัสพนักงาน -> โมเดล(ItemNo) -> อุปกรณ์(Tool)`
* **Sorting Report Excel:** * Export ข้อมูลรายกล่องลง Excel ผ่าน `exceljs`
    * จัดการคอลัมน์ Pivot สำหรับ `Defect` และ `Process Date`
    * เพิ่มคอลัมน์ `Record Time` เพื่อแสดง Timestamp ณ เวลาที่คีย์งานรายกล่อง
* **Inline Report Editing (Admin Only):** * เพิ่มฟังก์ชันการแก้ไขข้อมูลย้อนหลังได้โดยตรงผ่านหน้า UI
    * ผู้ดูแลระบบ (Admin) สามารถกด View ที่ `NG Detail` เพื่อแก้ไข **Defect Name** (เลือกจาก Dropdown Master Data)
    * สามารถกด View ที่ `Prod Date` เพื่อเปลี่ยน **Process Name** และ **วันที่ผลิต (Production Date)** ใหม่ได้ทันทีผ่าน Modal ยืนยันการอัปเดตแยกรายบรรทัด
    * **Backend API Format (updatePdDate):**
      ```javascript
      updatePdDate: async (req, res) => {
        try {
          const { id, productionDate, prcName } = req.body;

          if (!id || !productionDate || !prcName) {
            return res.status(400).send({ error: "ข้อมูลไม่ครบถ้วน (ต้องการ id, productionDate และ prcName)" });
          }

          // ปรับ format วันที่ให้ตรงกับ Database DateTime
          const updatedDate = new Date(productionDate);

          await prisma.pdDate.update({
            where: { id: parseInt(id) },
            data: { 
              productionDate: updatedDate,
              prcName: prcName 
            }
          });

          return res.send({ message: 'success' });
        } catch (error) {
          return res.status(500).send({ error: error.message });
        }
      }
      ```
* **UI/UX Analytics:**
    * **Dynamic Filtering:** ช่องค้นหาที่สามารถพิมพ์ได้ทั้ง `Item No` หรือ `Item Name` ในช่องเดียว (ใช้ `whereClause.OR`)
    * **Sticky Header:** ตรึงหัวตารางรายงาน (`position: sticky; top: 0;`) ให้อ่านง่ายเมื่อเลื่อนดูข้อมูลจำนวนมากผ่าน Custom Scrollbar
    * **Clear Filter:** ปุ่มล้างค่าการค้นหาเพื่อ Reset การดึงข้อมูลกลับเป็นค่าเริ่มต้น (วันที่ปัจจุบัน)

---

## 🧠 Core Business Logic & Guidelines

1. **Timezone Handling (GMT+7):** ข้อมูลวันที่และเวลาทั้งหมดที่มีการ Query เพื่อจัดกลุ่มหรือ Export ลง Excel ต้องถูกปรับเวลาให้ตรงกับประเทศไทยเสมอ ตัวอย่างเช่น:
   `dateObj.setTime(dateObj.getTime() + 7 * 60 * 60 * 1000);`
2. **Backward Compatibility (UPH Fallback):**
   เพื่อรองรับข้อมูล Transaction เก่าที่ยังไม่มีการบันทึก Snapshot UPH (`stdOutputPerHour = null`) ระบบมี Logic การค้นหา UPH ดังนี้:
   * **ลำดับที่ 1:** ใช้ Snapshot ใน `SortingDetail` (ถ้ามี)
   * **ลำดับที่ 2:** ถ้าไม่มี ให้ดึง UPH อันเก่าที่สุด (`orderBy: id: 'asc'`) จากตาราง `PartStandard` ที่ตรงกับ `ItemNo` และ `Tool`
   * **ลำดับที่ 3:** ถ้า Tool ไม่ตรง ให้ดึง UPH ที่เป็น Default (`toolId = null`) ของ Item นั้นๆ
   * **ลำดับที่ 4:** ถ้าไม่มีการตั้งค่าใดๆ เลย ให้ประเมิน UPH = 0
3. **Data Snapshot:** เมื่อจบงาน (End Session) ระบบจะดึงชื่อ Tool (`toolName`), ชื่อ Process (`prcName`), และค่าเป้าหมาย (`stdOutputPerHour`) ณ เวลานั้น บันทึกฝังไว้ใน Transaction ทันที เพื่อป้องกันข้อมูลเพี้ยนหาก Master Data ถูกแก้ไขในอนาคต

---

## 🗃️ Database Schema (Prisma)

โครงสร้างฐานข้อมูลแบ่งออกเป็น 3 ส่วนหลัก: Master Data, Temp Data (ระหว่างทำงาน), และ History Data (ข้อมูลจริงที่ยืนยันแล้ว)

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

// ==========================================
// MASTER DATA
// ==========================================
model User {
  id       Int     @id() @default(autoincrement())
  empNo    String  @unique
  name     String
  password String
  rfid     String?
  level    String
  section  String
  status   String  @default("use")
  HeadTemps   HeadTemp[]
  sortingHeads SortingHead[]
}

model Part {
  id        Int     @id() @default(autoincrement())
  customer  String
  itemNo    String  @unique
  itemName  String
  spec      String?
  itemClass String
  status    String  @default("use")
  maxQty    Int?
  SortingDetails SortingDetail[]
  partStandards  PartStandard[]
}

model Defect {
  id         Int     @id() @default(autoincrement())
  defectName String
  remark     String?
  status     String  @default("use")
  NgListTemps NgListTemp[]
}

model GroupSort {
  id        Int     @id() @default(autoincrement())
  groupName String
  remark    String?
  status    String  @default("use")
  HeadTemps HeadTemp[]
}

model Tool {
  id        Int     @id @default(autoincrement())
  toolName  String
  status    String  @default("use")
  HeadTemps HeadTemp[]
  partStandards PartStandard[]
}

model Process {
  id        Int     @id @default(autoincrement())
  prcName   String
  status    String  @default("use")
  PdDateTemps PdDateTemp[]
}

model PartStandard {
  id               Int      @id @default(autoincrement())
  itemNo           String
  toolId           Int?     
  stdOutputPerHour Int      
  effectiveDate    DateTime @default(now()) 
  status           String   @default("use")
  part             Part  @relation(fields: [itemNo], references: [itemNo])
  tool             Tool? @relation(fields: [toolId], references: [id])
}

// ==========================================
// TRANSACTION (TEMP/DRAFT)
// ==========================================
model HeadTemp {
  id          Int       @id() @default(autoincrement())
  timeStamp   DateTime  @default(now())
  sortingDate DateTime? @db.Date
  shift       String?
  userId      Int
  groupSortId Int?
  toolId      Int?
  sortingCase String?
  rejectNo    String?
  remark      String?
  user        User       @relation(fields: [userId], references: [id])
  groupSort   GroupSort? @relation(fields: [groupSortId], references: [id])
  tool        Tool?      @relation(fields: [toolId], references: [id])
  DetailTemps DetailTemp[]
}

model DetailTemp {
  id         Int       @id() @default(autoincrement())
  headTempId Int
  itemNo     String
  wosNo      String
  lotNo      String
  boxNo      String?
  dieNo      String
  inputQty   Int       @default(0)
  okQty      Int       @default(0)
  ngQty      Int       @default(0)
  timeStamp  DateTime? @default(now())
  headTemp   HeadTemp   @relation(fields: [headTempId], references: [id], onDelete: Cascade)
  NgListTemps NgListTemp[]
  PdDateTemps PdDateTemp[]
}

model PdDateTemp {
  id             Int      @id @default(autoincrement())
  detailTempId   Int
  processId      Int
  productionDate DateTime @db.Date
  detailTemp     DetailTemp @relation(fields: [detailTempId], references: [id], onDelete: Cascade)
  process        Process    @relation(fields: [processId], references: [id])
}

model NgListTemp {
  id           Int @id @default(autoincrement())
  detailTempId Int
  defectId     Int
  qtyNg        Int
  detailTemp   DetailTemp @relation(fields: [detailTempId], references: [id], onDelete: Cascade)
  defect       Defect     @relation(fields: [defectId], references: [id])
}

// ==========================================
// TRANSACTION (REAL/HISTORY)
// ==========================================
model SortingHead {
  id          Int       @id() @default(autoincrement())
  timeStamp   DateTime  @default(now())
  sortingDate DateTime? @db.Date
  shift       String?
  userId      Int
  groupSort   String?
  toolName    String?
  sortingCase String?
  rejectNo    String?
  remark      String?
  user        User      @relation(fields: [userId], references: [id])
  SortingDetails SortingDetail[]
}

model SortingDetail {
  id               Int       @id() @default(autoincrement())
  sortingHeadId    Int
  itemNo           String
  wosNo            String
  lotNo            String
  boxNo            String?
  dieNo            String
  inputQty         Int       @default(0)
  okQty            Int       @default(0)
  ngQty            Int       @default(0)
  timeStamp        DateTime?
  stdOutputPerHour Int?      // Snapshot UPH ณ วันที่บันทึก
  part             Part        @relation(fields: [itemNo], references: [itemNo])
  sortingHead      SortingHead @relation(fields: [sortingHeadId], references: [id], onDelete: Cascade)
  NgLists          NgList[]
  PdDates          PdDate[]
}

model PdDate {
  id              Int      @id @default(autoincrement())
  sortingDetailId Int
  prcName         String
  productionDate  DateTime @db.Date
  sortingDetail   SortingDetail @relation(fields: [sortingDetailId], references: [id], onDelete: Cascade)
}

model NgList {
  id              Int    @id @default(autoincrement())
  sortingDetailId Int
  defectName      String
  qtyNg           Int
  sortingDetail   SortingDetail @relation(fields: [sortingDetailId], references: [id], onDelete: Cascade)
}