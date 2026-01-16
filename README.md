## Document Manager (React + TypeScript + Vite)

เว็บแอปสำหรับจัดการเอกสารภายในองค์กร พัฒนาด้วย **React + TypeScript + Vite** และใช้ **Firebase Firestore** เป็นฐานข้อมูลแบบเรียลไทม์

### ฟีเจอร์หลัก

- สร้างเอกสารใหม่ พร้อมเลขที่เอกสารไม่ซ้ำกัน
- หน้ารวม **Dashboard** แสดงรายการเอกสารทั้งหมด
  - ค้นหาด้วยเลขที่เอกสารหรือคำอธิบาย
  - กรองตามสถานะ (Draft, Review, Approval, Accounting, Payment, Completed, Rejected, Paid ฯลฯ)
  - การ์ดสรุป: ทั้งหมด, กำลังดำเนินการ, สำเร็จแล้ว, ตีกลับ, ใกล้ครบ 3 วัน, เกิน 3 วันแล้ว
  - คลิกการ์ดเพื่อแสดงเฉพาะเอกสารกลุ่มนั้น
  - แสดงคำเตือนเอกสารที่ใกล้ครบ/เกิน 3 วันจากวันที่สร้าง
- หน้า **รายละเอียดเอกสาร** (Detail)
  - ดูข้อมูลเอกสารทั้งหมดและประวัติการเปลี่ยนสถานะ (workflow history)
  - เปลี่ยนสถานะเอกสารตามลำดับขั้น พร้อมบันทึกประวัติลง Firestore
- หน้าจัดการอื่น ๆ
  - จัดการประเภทเอกสาร (Type Management) พร้อมตรวจชื่อซ้ำ
  - Admin สามารถลบเอกสารจากหน้า Dashboard ได้

> หมายเหตุ: ไฟล์ `src/firebase.ts` จะไม่ถูกรวมใน Git (อยู่ใน `.gitignore`) ผู้ใช้งานต้องสร้างไฟล์นี้และใส่ค่า config ของ Firebase เอง

ตัวอย่างโครงสร้างไฟล์ `src/firebase.ts` (ให้ใส่ค่า config ของโปรเจกต์จริงเอง):

```ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "...",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

### การติดตั้งและรันโปรเจกต์

1. ติดตั้ง dependencies

```bash
npm install
```

2. สร้างไฟล์ `src/firebase.ts` ตามตัวอย่างด้านบน แล้วใส่ config ของ Firebase โปรเจกต์ของคุณ

3. รันโหมดพัฒนา

```bash
npm run dev
```

จากนั้นเปิดเบราว์เซอร์ที่ URL ที่ Vite แสดง (เช่น `http://localhost:5173`)

4. สร้างไฟล์ build สำหรับ deploy

```bash
npm run build
```

โฟลเดอร์ build จะอยู่ใน `dist/`
