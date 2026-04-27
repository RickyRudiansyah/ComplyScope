# VeriTrace Lite Project Context

## Summary

VeriTrace Lite is an AI-assisted material verification system for regulated and pharma supply chains.

## Core Workflow

COA PDF + material label -> Azure Document Intelligence extracts text, layout, and tables -> parser extracts full COA and label schema -> SQLite master data defines material specs and approved suppliers -> deterministic validator checks issues -> risk engine decides APPROVED, NEEDS_REVIEW, or REJECTED -> Azure OpenAI generates summary and recommendation only -> result is saved to verification logs and shown in the React dashboard.

## Critical Rules

- Do not add auth, RAG, model training, or ERP integration.
- Final decisions must come from deterministic validation and risk logic.
- Azure OpenAI must not decide final status.
- Required tests come from `material_specs` per material.
- Do not hardcode Assay globally.
- Demo Paracetamol API tests are Appearance, Identification, Assay, and Moisture.
- Use generic `TEST_RESULT_OUT_OF_SPEC`, not `ASSAY_OUT_OF_SPEC`.
- Demo fallback may cache extracted fields only; final findings and decisions must be recomputed.

## Repo Structure

- `backend/`: FastAPI app, routes, services, seed data, and local storage.
- `frontend/`: Vite React dashboard skeleton.
- `datasets/`: synthetic demo documents and expected outputs.
- `archive/complyscope_legacy/`: preserved legacy ComplyScope files.

## Planned Endpoints

- `GET /api/health`
- `GET /api/materials`
- `GET /api/suppliers`
- `GET /api/demo/scenarios`
- `POST /api/verifications`
- `GET /api/verifications`
- `GET /api/verifications/{verification_id}`

## Response Contract Summary

Verification responses should include extracted COA fields, extracted label fields, field comparisons, validation findings, deterministic status, risk score or level, OpenAI-generated explanation, and persisted verification metadata.

## Validation Rule Summary

Validation checks should cover material mismatch, batch mismatch, supplier approval, expiry, missing required fields, missing required tests, and generic test results outside configured material specifications.

Nama Project
VeriTrace Lite
Azure-Powered Material Verification Copilot for Regulated Supply Chains
Ringkasan Produk

VeriTrace Lite adalah sistem AI-assisted untuk membantu tim QA/QC, warehouse, dan procurement memverifikasi dokumen material masuk di industri regulated, terutama pharma/health manufacturing.

Sistem menerima:

Certificate of Analysis / COA
Material Label

Lalu sistem:

membaca dokumen dengan Azure Document Intelligence,
mengekstrak field dan tabel hasil uji,
mencocokkan data dengan master data perusahaan,
menjalankan deterministic validation engine,
memberi keputusan awal:
APPROVED
NEEDS_REVIEW
REJECTED
menjelaskan alasan dan rekomendasi dengan Azure OpenAI,
menyimpan hasil sebagai verification history / audit trail.

Prinsip final:

AI reads and explains.
Parser structures.
Master DB defines truth.
Validator checks.
Risk engine decides.
Human reviews.
System logs.

Jadi produk ini bukan OCR doang, bukan chatbot, dan bukan full compliance automation. Ini adalah first-line material verification assistant.

2. Problem yang Diangkat

Dalam industri pharma/regulated supply chain, material yang datang dari supplier tidak boleh langsung digunakan. Sebelum diterima, warehouse dan QA harus memverifikasi dokumen seperti COA dan label material.

Masalah manual yang umum:

batch number COA tidak sama dengan label,
supplier belum approved,
expiry/retest date terlalu dekat,
required test parameter hilang,
hasil uji keluar dari spesifikasi,
quantity berbeda,
dokumen sulit diaudit,
pengecekan lambat dan rawan human error.

Dampaknya:

material salah release,
batch produksi tertahan,
audit finding,
kerugian operasional,
risiko kualitas produk.

VeriTrace Lite menjawab masalah ini dengan:

AI document understanding + master data validation + deterministic decision + evidence-based explanation.

3. Tema Lomba yang Diambil
Tema Utama

Pharma/Health — Proses Verifikasi Material

Karena sistem langsung menyelesaikan masalah:

penerimaan bahan baku membutuhkan verifikasi dokumen dan label secara ketat untuk traceability, tetapi masih manual.

Tema Pendukung

Logistik — Kesalahan Input Manual dan Inkonsistensi Data

Karena sistem mendeteksi inkonsistensi antar dokumen.

Manufaktur & Energi — Kepatuhan Regulasi dan Keamanan Data

Karena sistem mendukung audit trail, traceability, dan pengelolaan dokumen sensitif secara lebih aman.

4. Use Case Nyata
Use Case: Incoming Raw Material Verification
Aktor
Supplier
Warehouse Receiving Staff
QA/QC Officer
Procurement Officer
Compliance/Audit Officer
Skenario

Supplier mengirim Paracetamol API ke pabrik beserta:

COA PDF
Material Label PDF/image

Warehouse upload kedua dokumen ke VeriTrace.

Sistem membaca dan menemukan:

COA Batch No   : PCM-2026-999
Label Batch No : PCM-2026-001

Sistem juga mengecek master data:

Material Code : MAT-PCM-001
Supplier      : PT Sumber Farma Kimia
Required Test : Appearance, Identification, Assay, Moisture

Lalu sistem mendeteksi:

Finding  : BATCH_MISMATCH
Decision : NEEDS_REVIEW
Risk     : 35/100

Output ke user:

Decision:
NEEDS_REVIEW

Reason:
Batch number in COA does not match material label.

Evidence:
COA batch: PCM-2026-999
Label batch: PCM-2026-001

Recommendation:
Hold material, quarantine stock, and request corrected COA or supplier clarification.

QA lalu mengambil keputusan final: hold, reject, atau request clarification.

5. Pipeline End-to-End Final
Supplier sends material + COA + label
        ↓
Warehouse/QA uploads COA + label
        ↓
Frontend sends files to Backend API
        ↓
Backend sends documents to Azure Document Intelligence
        ↓
Azure extracts text, layout, and tables
        ↓
Parser normalizes fields using aliases
        ↓
Parser extracts full COA/label schema
        ↓
Backend loads SQLite master data
        ↓
Validator checks:
  - required fields
  - batch consistency
  - supplier approval
  - expiry threshold
  - required tests
  - test result specifications
  - quantity consistency
        ↓
Risk engine calculates score and decision
        ↓
Azure OpenAI generates summary/recommendation
        ↓
Backend saves result to verification_logs
        ↓
Frontend displays decision, evidence, extracted fields, and history
        ↓
Human QA reviews final action
6. Dua Jalur Sistem
A. Real Upload Flow

Dipakai untuk demo utama dengan PDF sungguhan.

COA PDF + Label PDF
→ Azure Document Intelligence
→ Parser
→ Validator
→ Risk Engine
→ Azure OpenAI Explanation
→ Save Log
→ Dashboard
B. Demo Fallback Flow

Dipakai kalau Azure lambat/error saat demo.

demo_extractions.json
→ Validator
→ Risk Engine
→ Azure OpenAI / Template Explanation
→ Save Log
→ Dashboard

Penting:

Demo fallback hanya menyimpan extracted fields. Final decision tetap dihitung oleh validator/risk engine asli. Jadi bukan hardcoded result.

7. AI Usage Final
1. Azure Document Intelligence

Fungsi:

membaca COA,
membaca material label,
mengekstrak text,
mengekstrak layout,
mengekstrak tabel hasil uji.

Posisinya:

Azure Document Intelligence = document understanding engine

Bukan decision maker.

2. Parser / Entity Extraction Layer

Fungsi:

menstrukturkan hasil Azure,
mengambil full COA schema,
mengambil full label schema,
menormalisasi field dengan aliases,
menormalisasi tabel hasil uji.

Parser tidak boleh mengarang. Kalau field tidak ketemu, return null/warning.

3. Azure OpenAI

Fungsi:

membuat summary,
membuat recommendation,
membuat reviewer note.

Batasan keras:

Azure OpenAI tidak boleh menentukan APPROVED / NEEDS_REVIEW / REJECTED.
Azure OpenAI tidak boleh membuat evidence baru.
Azure OpenAI hanya menjelaskan findings yang sudah deterministic.

Kalau Azure OpenAI gagal, sistem pakai template fallback.

8. Kenapa Aman untuk Format COA Berbeda?

Karena sistem tidak bergantung pada satu template kaku.

Masalah

Supplier bisa menulis field berbeda:

Batch No
Lot Number
Batch/Lot

atau:

Assay
Purity
Content
Potency
Solusi

Sistem pakai aliases.

Aliases = kamus sinonim untuk memetakan istilah berbeda ke field standar.

Contoh:

{
  "batch_no": ["Batch No", "Batch Number", "Lot No", "Lot Number", "Batch/Lot"],
  "expiry_date": ["Expiry Date", "Expiration Date", "Retest Date", "Valid Until"],
  "supplier": ["Supplier", "Vendor"]
}

Untuk tabel:

{
  "parameter": ["Parameter", "Test", "Analysis", "Test Item"],
  "specification": ["Specification", "Limit", "Acceptance Criteria", "Requirement"],
  "result": ["Result", "Results", "Actual", "Observed Value"]
}

Untuk parameter:

{
  "parameter": "Assay",
  "aliases": ["Assay", "Purity", "Content", "Potency"]
}

Jadi kalau COA pakai Purity, sistem bisa map ke Assay, jika alias itu memang didefinisikan di master spec material tersebut.

Yang diklaim bukan:

“Bisa semua format COA di dunia.”

Yang diklaim:

“Bisa menangani variasi umum melalui aliases, table normalization, dan fail-safe Needs Review jika dokumen tidak terbaca yakin.”

9. Data Architecture Final
Bentuk Data
Data	Lokasi	Fungsi
HTML COA/Label	datasets/demo_docs/...	sumber synthetic document yang editable
PDF COA/Label	hasil export HTML	dokumen upload ke Azure
Seed JSON	backend/data/*.json	sumber master data
Demo Extraction JSON	backend/data/demo_extractions.json	fallback extracted fields
SQLite DB	backend/storage/veritrace.db	runtime DB + logs
10. Synthetic Dataset Final

Karena data perusahaan asli sensitif, MVP menggunakan synthetic data.

Framing proposal:

VeriTrace Lite uses synthetic but realistic demo documents because real COA and material receiving documents may contain sensitive supplier and quality information. The COA template is structurally informed by common Certificate of Analysis patterns and public guidance, but no real company document is copied. All supplier names, batch numbers, values, and master data are synthetic.

Demo Material
Material Name : Paracetamol API
Material Code : MAT-PCM-001
Category      : API
Shelf Life    : minimum 180 days
Storage       : Keep dry, below 25°C
Demo Required Tests

Untuk MAT-PCM-001, required tests:

Appearance
Identification
Assay
Moisture

Catatan penting:

Assay tidak hardcoded global. Assay hanya salah satu required test untuk Paracetamol API.

11. COA Synthetic Template
CERTIFICATE OF ANALYSIS

COA No: COA-PCM-2026-001
Issue Date: 2026-04-20
Page: 1 of 1

Product Name: Paracetamol API
Material Code: MAT-PCM-001
Category: API
Supplier: PT Sumber Farma Kimia
Manufacturer: PT Sumber Farma Kimia Manufacturing Site
Batch No: PCM-2026-001
MFG Date: 2026-01-15
Expiry Date: 2027-03-31
Quantity: 100 kg
Storage Condition: Keep dry, below 25°C

RESULTS OF ANALYSIS

Parameter | Method | Specification | Result | Unit | Status
Appearance | Visual | White crystalline powder | White crystalline powder | - | PASS
Identification | FTIR | Positive | Positive | - | PASS
Assay | HPLC | 98.0 - 102.0 | 99.4 | % | PASS
Moisture | LOD | <= 0.5 | 0.21 | % | PASS

Conclusion: The batch complies with the defined material specification.
Authorized By: QA Authorized Person
12. Material Label Template
MATERIAL LABEL

Material Name: Paracetamol API
Material Code: MAT-PCM-001
Batch No: PCM-2026-001
Supplier: PT Sumber Farma Kimia
Quantity: 100 kg
MFG Date: 2026-01-15
Expiry Date: 2027-03-31
Storage Condition: Keep dry, below 25°C

Gunakan supplier/manufacturer label, bukan internal warehouse/QC label, supaya scope tidak melebar.

13. Demo Scenarios Final
1. valid

Semua cocok.

Expected:

APPROVED
2. batch_mismatch

COA:

Batch No: PCM-2026-999

Label:

Batch No: PCM-2026-001

Expected finding:

BATCH_MISMATCH

Expected decision:

NEEDS_REVIEW
3. test_result_out_of_spec

COA:

Assay Result: 97.2
Specification: 98.0 - 102.0

Expected finding:

TEST_RESULT_OUT_OF_SPEC
parameter = Assay

Expected decision:

REJECTED

Catatan:

Scenario ini pakai Assay sebagai contoh failing parameter, tapi engine tetap generic.

4. supplier_not_approved

Supplier:

PT Global Chemical Trading

Expected finding:

SUPPLIER_NOT_APPROVED

Expected decision:

NEEDS_REVIEW
14. Master Data Architecture
Table: materials
material_code
material_name
category
min_shelf_life_days
storage_requirement
created_at

Contoh:

{
  "material_code": "MAT-PCM-001",
  "material_name": "Paracetamol API",
  "category": "API",
  "min_shelf_life_days": 180,
  "storage_requirement": "Keep dry, below 25°C"
}
Table: material_specs

Ini inti agar parameter tidak hardcoded.

material_code
parameter
method
spec_type
spec_min
spec_max
expected_text
unit
required
criticality
aliases_json
created_at

Contoh:

{
  "material_code": "MAT-PCM-001",
  "parameter": "Assay",
  "method": "HPLC",
  "spec_type": "range",
  "spec_min": 98.0,
  "spec_max": 102.0,
  "unit": "%",
  "required": true,
  "criticality": "CRITICAL",
  "aliases": ["Assay", "Purity", "Content", "Potency"]
}

Untuk Moisture:

{
  "material_code": "MAT-PCM-001",
  "parameter": "Moisture",
  "method": "LOD",
  "spec_type": "max",
  "spec_max": 0.5,
  "unit": "%",
  "required": true,
  "criticality": "HIGH",
  "aliases": ["Moisture", "Water Content", "LOD"]
}
Table: suppliers
supplier_name
status
created_at

Contoh:

PT Sumber Farma Kimia      APPROVED
PT Farma Nusantara         APPROVED
PT Global Chemical Trading NOT_APPROVED
Table: material_suppliers
material_code
supplier_name
status

Contoh:

MAT-PCM-001 + PT Sumber Farma Kimia      APPROVED
MAT-PCM-001 + PT Global Chemical Trading NOT_APPROVED
Table: verification_logs
analysis_id
decision
risk_score
risk_level
material_code
material_name
supplier
extracted_json
findings_json
summary
recommendation
reviewer_note
created_at

Setiap run analisis disimpan di sini.

15. Full Extraction Schema
COA
{
  "document_type": "Certificate of Analysis",
  "coa_no": "...",
  "issue_date": "...",
  "page": "...",
  "product_name": "...",
  "material_name": "...",
  "material_code": "...",
  "category": "...",
  "supplier": "...",
  "manufacturer": "...",
  "batch_no": "...",
  "mfg_date": "...",
  "expiry_date": "...",
  "quantity": "...",
  "storage_condition": "...",
  "test_results": [
    {
      "parameter": "...",
      "method": "...",
      "specification": "...",
      "result": "...",
      "unit": "...",
      "status": "PASS/FAIL"
    }
  ],
  "conclusion": "...",
  "authorized_by": "..."
}
Label
{
  "material_name": "...",
  "material_code": "...",
  "batch_no": "...",
  "supplier": "...",
  "quantity": "...",
  "mfg_date": "...",
  "expiry_date": "...",
  "storage_condition": "..."
}
16. Validation Rules Final
MISSING_REQUIRED_FIELD

Jika field wajib hilang.

Score:

+15

Severity:

MEDIUM

Required fields:

material_name
material_code
supplier
batch_no
expiry_date
coa_no
BATCH_MISMATCH

COA batch tidak sama dengan label batch.

Score:

+35

Severity:

CRITICAL
SUPPLIER_NOT_APPROVED

Supplier tidak approved untuk material tersebut.

Score:

+30

Severity:

HIGH
EXPIRY_BELOW_THRESHOLD

Expiry/retest date kurang dari minimum shelf life.

Score:

+20

Severity:

HIGH
MISSING_REQUIRED_TEST

Required test dari material_specs tidak ditemukan di COA test_results.

Score:

+25

Severity:

HIGH
TEST_RESULT_OUT_OF_SPEC

Generic rule untuk semua parameter test.

Score by criticality:

CRITICAL = +40
HIGH     = +30
MEDIUM   = +20
LOW      = +10

Jika criticality CRITICAL, force decision:

REJECTED
QUANTITY_MISMATCH

Quantity COA tidak sama dengan label.

Score:

+15

Severity:

MEDIUM
LOW_EXTRACTION_CONFIDENCE / UNPARSABLE_DOCUMENT

Jika terlalu banyak field penting gagal diekstrak.

Score:

+25

Severity:

HIGH

Decision minimal:

NEEDS_REVIEW
17. Risk Engine Final
risk_score = sum(finding scores), capped at 100

Decision:

If any CRITICAL TEST_RESULT_OUT_OF_SPEC:
    REJECTED
Else if risk_score <= 20:
    APPROVED
Else if risk_score <= 59:
    NEEDS_REVIEW
Else:
    REJECTED

Risk Level:

0–20    LOW
21–59   MEDIUM
60–100  HIGH
18. Azure OpenAI Explanation Final

Azure OpenAI digunakan setelah findings dibuat.

Input ke Azure OpenAI:

decision
risk_score
risk_level
findings
extracted_fields

Output:

{
  "summary": "...",
  "recommendation": "...",
  "reviewer_note": "..."
}

System prompt:

You are a QA material verification assistant. You summarize deterministic verification findings for a human QA reviewer. Use only the provided findings and evidence. Do not invent facts. Do not override the provided decision. Return concise JSON only.

Kalau Azure OpenAI gagal:

Use template explanation fallback.
19. Endpoint Final
Health
GET /api/health

Fungsi:

cek backend hidup,
cek status konfigurasi Azure DI,
cek status konfigurasi Azure OpenAI.
Materials
GET /api/materials
GET /api/materials/{code}

Fungsi:

lihat master material,
lihat spec,
lihat approved suppliers.
Suppliers
GET /api/suppliers

Fungsi:

lihat supplier list dan status.
Verifications
POST /api/verifications
GET /api/verifications
GET /api/verifications/{id}
POST /api/verifications

Input:

multipart/form-data:
- coa_file
- label_file

Flow:

Azure DI → Parser → Validator → Risk → Azure OpenAI → Save Log → Return Result
GET /api/verifications

Mengambil history.

GET /api/verifications/{id}

Mengambil detail satu verification.

Demo
GET /api/demo-scenarios
POST /api/demo-scenarios/{id}/run

Fungsi:

menjalankan fallback demo,
tetap menggunakan validator/risk engine asli.
20. Response Contract Final
{
  "analysis_id": "ANL-2026-0001",
  "decision": "REJECTED",
  "risk_score": 75,
  "risk_level": "HIGH",
  "summary": "Batch mismatch and critical test result out-of-spec detected.",
  "extracted_fields": {
    "coa": {
      "document_type": "Certificate of Analysis",
      "coa_no": "COA-PCM-2026-001",
      "issue_date": "2026-04-20",
      "page": "1 of 1",
      "product_name": "Paracetamol API",
      "material_name": "Paracetamol API",
      "material_code": "MAT-PCM-001",
      "category": "API",
      "supplier": "PT Sumber Farma Kimia",
      "manufacturer": "PT Sumber Farma Kimia Manufacturing Site",
      "batch_no": "PCM-2026-999",
      "mfg_date": "2026-01-15",
      "expiry_date": "2027-03-31",
      "quantity": "100 kg",
      "storage_condition": "Keep dry, below 25°C",
      "test_results": [
        {
          "parameter": "Assay",
          "method": "HPLC",
          "specification": "98.0 - 102.0",
          "result": "97.2",
          "unit": "%",
          "status": "FAIL"
        }
      ],
      "conclusion": "The batch does not comply with the defined material specification.",
      "authorized_by": "QA Authorized Person"
    },
    "label": {
      "material_name": "Paracetamol API",
      "material_code": "MAT-PCM-001",
      "batch_no": "PCM-2026-001",
      "supplier": "PT Sumber Farma Kimia",
      "quantity": "100 kg",
      "mfg_date": "2026-01-15",
      "expiry_date": "2027-03-31",
      "storage_condition": "Keep dry, below 25°C"
    }
  },
  "findings": [
    {
      "type": "TEST_RESULT_OUT_OF_SPEC",
      "parameter": "Assay",
      "severity": "CRITICAL",
      "score": 40,
      "message": "Assay result is outside the approved specification range.",
      "evidence": {
        "parameter": "Assay",
        "result": "97.2",
        "required": "98.0 - 102.0",
        "unit": "%"
      }
    }
  ],
  "recommendation": "Quarantine material, hold release, and escalate to QA for supplier clarification.",
  "reviewer_note": "Critical quality issue requires manual QA review.",
  "human_review_required": true,
  "created_at": "..."
}
21. Struktur Repo Final
veritrace-lite/
├─ README.md
├─ .gitignore
├─ .env.example
├─ PROJECT_CONTEXT.md
│
├─ backend/
│  ├─ requirements.txt
│  ├─ main.py
│  ├─ config.py
│  ├─ database.py
│  ├─ schemas.py
│  ├─ seed.py
│  │
│  ├─ routes/
│  │  ├─ __init__.py
│  │  ├─ verifications.py
│  │  ├─ materials.py
│  │  ├─ suppliers.py
│  │  ├─ demo.py
│  │  └─ health.py
│  │
│  ├─ services/
│  │  ├─ __init__.py
│  │  ├─ azure_doc_intel.py
│  │  ├─ azure_openai.py
│  │  ├─ parser.py
│  │  ├─ validator.py
│  │  ├─ risk_engine.py
│  │  ├─ explanation.py
│  │  └─ demo_service.py
│  │
│  ├─ data/
│  │  ├─ seed_materials.json
│  │  ├─ seed_suppliers.json
│  │  ├─ seed_specs.json
│  │  ├─ field_aliases.json
│  │  ├─ table_header_aliases.json
│  │  └─ demo_extractions.json
│  │
│  └─ storage/
│     └─ .gitkeep
│
├─ frontend/
│  ├─ package.json
│  ├─ vite.config.js
│  ├─ index.html
│  │
│  └─ src/
│     ├─ main.jsx
│     ├─ App.jsx
│     ├─ api.js
│     ├─ styles.css
│     │
│     └─ components/
│        ├─ UploadPanel.jsx
│        ├─ DemoScenarioSelector.jsx
│        ├─ DecisionCard.jsx
│        ├─ FieldComparisonTable.jsx
│        ├─ FindingsPanel.jsx
│        ├─ RecommendationCard.jsx
│        ├─ HistoryTable.jsx
│        └─ ExtractedDetailsPanel.jsx
│
└─ datasets/
   ├─ demo_docs/
   │  ├─ valid/
   │  ├─ batch_mismatch/
   │  ├─ test_result_out_of_spec/
   │  └─ supplier_not_approved/
   │
   └─ expected_outputs/

expected_outputs/ optional.

22. Step Implementasi Detail
Phase 1 — Skeleton
[ ] Buat repo structure
[ ] Buat .env.example
[ ] Buat .gitignore
[ ] Buat README awal
[ ] Buat backend skeleton
[ ] Buat frontend skeleton
[ ] Buat datasets folder
Phase 2 — Dataset
[ ] Buat COA/label HTML untuk valid
[ ] Buat COA/label HTML untuk batch_mismatch
[ ] Buat COA/label HTML untuk test_result_out_of_spec
[ ] Buat COA/label HTML untuk supplier_not_approved
[ ] Buat seed_materials.json
[ ] Buat seed_suppliers.json
[ ] Buat seed_specs.json
[ ] Buat field_aliases.json
[ ] Buat table_header_aliases.json
[ ] Buat demo_extractions.json
Phase 3 — Backend Foundation
[ ] Setup FastAPI
[ ] Setup CORS
[ ] Setup config.py
[ ] Setup SQLite
[ ] Create tables
[ ] Seed DB
[ ] GET /api/health
[ ] GET /api/materials
[ ] GET /api/materials/{code}
[ ] GET /api/suppliers
Phase 4 — Validation Engine
[ ] Implement validator.py
[ ] Implement required field check
[ ] Implement batch mismatch
[ ] Implement supplier approval check
[ ] Implement expiry threshold check
[ ] Implement missing required test check
[ ] Implement generic TEST_RESULT_OUT_OF_SPEC
[ ] Implement quantity mismatch
[ ] Implement risk_engine.py
[ ] Implement template explanation fallback
Phase 5 — Demo API
[ ] Implement demo_service.py
[ ] GET /api/demo-scenarios
[ ] POST /api/demo-scenarios/{id}/run
[ ] Save result to verification_logs
[ ] GET /api/verifications
[ ] GET /api/verifications/{id}

At this point, app should already be demoable without Azure. Ini sabuk pengaman utama.

Phase 6 — Frontend
[ ] Setup React + Vite
[ ] Build DemoScenarioSelector
[ ] Build DecisionCard
[ ] Build FieldComparisonTable
[ ] Build FindingsPanel
[ ] Build RecommendationCard
[ ] Build ExtractedDetailsPanel
[ ] Build HistoryTable
[ ] Connect demo scenario API
[ ] Connect history API
[ ] Add upload UI placeholder
Phase 7 — Azure OpenAI
[ ] Implement azure_openai.py
[ ] Add JSON-only prompt
[ ] Use only findings/evidence
[ ] Prevent decision override
[ ] Add template fallback
[ ] Integrate into demo and real verification flow
Phase 8 — Azure Document Intelligence
[ ] Implement azure_doc_intel.py
[ ] Implement parser.py
[ ] Parse COA full schema
[ ] Parse label full schema
[ ] Parse test_results table
[ ] Use field_aliases
[ ] Use table_header_aliases
[ ] Implement POST /api/verifications
[ ] Test upload synthetic PDFs
Phase 9 — Final QA
[ ] Test all demo scenarios
[ ] Test history log
[ ] Test frontend display
[ ] Test Azure OpenAI fallback
[ ] Test Azure DI fallback/error handling
[ ] Update README
[ ] Polish UI
[ ] Prepare demo script
23. Implementation Priority

Urutan paling aman:

1. Dataset
2. Backend DB
3. Validator/risk
4. Demo endpoint
5. Frontend demo
6. Azure OpenAI
7. Azure Document Intelligence
8. Polish

Jangan mulai dari Azure. Demo fallback dulu. Itu yang bikin kamu tetap aman kalau service cloud lagi drama.

24. Final Success Criteria

Project dianggap siap kalau:

[ ] Demo valid → APPROVED
[ ] Demo batch_mismatch → NEEDS_REVIEW
[ ] Demo test_result_out_of_spec → REJECTED
[ ] Demo supplier_not_approved → NEEDS_REVIEW
[ ] Evidence tampil jelas
[ ] Risk score tampil
[ ] Recommendation tampil
[ ] Full extracted fields tampil
[ ] History tersimpan
[ ] Azure OpenAI jalan atau fallback aman
[ ] Azure Document Intelligence jalan minimal untuk synthetic PDF
[ ] App tetap bisa demo tanpa Azure via fallback
25. Final Pitch Line

Versi Inggris:

VeriTrace Lite helps QA and warehouse teams verify incoming material documents using Azure Document Intelligence, material-specific validation rules, deterministic risk scoring, and Azure OpenAI-assisted explanation. It does not replace QA; it accelerates first-line screening and makes every verification traceable.

Versi Indonesia:

VeriTrace Lite membantu tim QA dan warehouse memverifikasi dokumen material masuk menggunakan Azure Document Intelligence, aturan validasi berbasis spesifikasi material, risk scoring deterministik, dan penjelasan berbasis Azure OpenAI. Sistem ini tidak menggantikan QA, tetapi mempercepat screening awal dan membuat setiap keputusan lebih traceable.