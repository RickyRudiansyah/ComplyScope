# ComplyScope

**AI-powered Compliance Pre-Check untuk SOP Manufaktur-Energi terhadap UU 32/2009 PPLH**

[![Status](https://img.shields.io/badge/status-active--development-blue)]()
[![Hackathon](https://img.shields.io/badge/hackathon-Microsoft%20Elevate%202026-blue)]()
[![Python](https://img.shields.io/badge/python-3.10%2B-green)]()
[![License](https://img.shields.io/badge/license-MIT-orange)]()

> *"ComplyScope adalah prototype AI untuk pre-check kepatuhan SOP limbah B3 terhadap regulasi terpilih, dengan output gap analysis berbasis pasal dan status NEEDS_REVIEW bila evidence tidak cukup."*

---

## 📋 Tentang Proyek

ComplyScope adalah aplikasi web yang membantu **HSE (Health, Safety & Environment) officer** dan **compliance officer** di perusahaan manufaktur-energi melakukan pre-check kepatuhan SOP internal terhadap regulasi Indonesia, dengan fokus pada **pengelolaan Limbah B3 sesuai UU 32/2009** tentang Perlindungan dan Pengelolaan Lingkungan Hidup.

### Konteks Kompetisi

Proyek ini dibangun untuk **Microsoft Elevate Training Center AI Impact Challenge 2026**, kategori **Tema 4: Manufaktur & Energi - Kepatuhan Regulasi dan Keamanan Data**.

- Penyelenggara: Microsoft × Dicoding × Komdigi
- Deadline submission: 30 April 2026
- Tim: Ricky (BINUS CS S6) + Aflaha Fatinah Fatahillah

### Problem Statement

Compliance officer perusahaan manufaktur-energi menghadapi:
- Review SOP manual memakan **2-5 hari per dokumen**
- Regulasi tersebar di banyak UU dan peraturan turunannya
- Risiko kelalaian: sanksi pidana, denda, penundaan izin operasional, dampak reputasi

### Value Proposition

1. **Kecepatan** — pre-check dari 2-5 hari → < 20 detik
2. **Auditability** — setiap gap punya sitasi pasal eksplisit yang bisa diverifikasi
3. **Honest AI** — status `NEEDS_REVIEW` saat evidence lemah, bukan force-fit kesimpulan

---

## 🏗️ Arsitektur

```
User Browser
     ↓ upload PDF
[Frontend React]                                  ← in development
     ↓ HTTP POST /analyze
[Backend FastAPI]                                  ← in development
     ↓
     ├─ PDF Extraction (PyPDF)
     ├─ SOP Chunking (header strip + section detect)
     ├─ BM25 Retrieval (rank_bm25 + topik/keywords boost)
     ├─ Topic Filter (anti-force-fit guardrail)
     ├─ LLM Compliance Check (GitHub Models / GPT-4o-mini)
     ├─ Citation Validation (anti-hallucination guardrail)
     └─ Dedupe + Aggregate
     ↓
JSON Output: status + max 5 gaps + sitasi + disclaimer
```

### Stack Teknologi

| Layer | Tech | Status |
|---|---|---|
| LLM | GitHub Models (gpt-4o-mini) | ✅ Working |
| Retrieval | rank_bm25 (Python) | ✅ Working |
| PDF Extract | pypdf | ✅ Working |
| Pipeline | Python 3.14 | ✅ Working |
| Backend API | FastAPI | 🔄 Next |
| Frontend | React + Tailwind CSS | ⏳ Planned |
| Backend Deploy | Render.com | ⏳ Planned |
| Frontend Deploy | Vercel | ⏳ Planned |

### Catatan Engineering: Kenapa GitHub Models, bukan Azure OpenAI?

Saat development, Azure for Students subscription mengalami restriction policy yang memblokir provisioning Azure OpenAI, AI Search, dan Document Intelligence di seluruh region. Kami pivot ke **GitHub Models** sebagai alternatif yang masih dalam ekosistem Microsoft (GitHub adalah subsidiary Microsoft) dengan keuntungan:

- Free tier untuk development hackathon
- API-compatible dengan OpenAI Python SDK (zero refactor)
- Endpoint resmi: `https://models.inference.ai.azure.com` (Azure-hosted)
- Model: GPT-4o-mini, kapasitas reasoning yang sufficient untuk compliance check

---

## 📊 Progress Saat Ini

### ✅ COMPLETED (H1 - 24 April 2026)

#### 1. Setup Environment
- ✅ Python 3.14 + venv aktif
- ✅ Dependencies: `openai`, `python-dotenv`, `rank_bm25`, `pypdf`
- ✅ VS Code dengan PowerShell terminal
- ✅ GitHub repo + .gitignore (proteksi credentials)

#### 2. LLM Connection
- ✅ GitHub Personal Access Token dengan permission `models:read`
- ✅ Endpoint: `https://models.inference.ai.azure.com`
- ✅ Model: `gpt-4o-mini` confirmed working
- ✅ Test response: 89 tokens, response berkualitas tentang UU 32/2009

#### 3. Corpus Knowledge Base
- ✅ **43 entries** dari UU 32/2009 PPLH dalam JSON terstruktur
- ✅ Schema lengkap per entry: `id`, `doc_id`, `pasal`, `ayat`, `angka`, `huruf`, `teks`, `sitasi`, `topik[]`, `keywords[]`, `chunk_strategy`
- ✅ Coverage pasal kunci untuk B3: Pasal 1 (definisi), 47, 58-61 (pengelolaan B3), 63, 69 (larangan), 88-94 (penyidikan), 102-107 (sanksi pidana), 116-123 (korporasi & transitional)
- ✅ Chunking per pasal/ayat/angka untuk presisi sitasi

#### 4. SOP Dummy Data
- ✅ `SOP_Compliant.pdf` — baseline yang sesuai UU 32/2009
- ✅ `SOP_GapFound.pdf` — sengaja kurang beberapa kewajiban (4 halaman, 4593 chars extracted)
- ✅ `SOP_Ambigu.pdf` — terlalu pendek/ambigu untuk trigger NEEDS_REVIEW

#### 5. Retrieval Module (`retrieval.py`)
- ✅ Class `CorpusRetriever` dengan BM25 indexing
- ✅ Boost untuk field `topik` dan `keywords` (3x weight)
- ✅ Stop-word filter Bahasa Indonesia
- ✅ Min score threshold (default 0.3)
- ✅ Tested with 5 query — 4/5 excellent, 1/5 acceptable

#### 6. Compliance Pipeline (`compliance_pipeline.py`)
- ✅ Function `chunk_sop()` — smart chunking dengan header strip
- ✅ Function `filter_topically_relevant()` — pre-LLM topic filter (STRICT mode)
- ✅ Function `compliance_check_chunk()` — LLM call dengan structured prompt v3
- ✅ Function `validate_citations()` — anti-hallucination guardrail
- ✅ Function `dedupe_gaps()` — remove duplicate gaps
- ✅ Function `analyze_sop()` — main orchestrator dengan max_chunks cap (default 12)

#### 7. PDF Extraction (`pdf_extractor.py`)
- ✅ Function `extract_text_from_pdf()` menggunakan pypdf library
- ✅ Tested dengan SOP_GapFound.pdf (4 pages, 4593 chars extracted)
- ✅ Logging per page untuk debugging

#### 8. End-to-End Integration (`analyze_pdf.py`)
- ✅ Combine: PDF input → text extraction → compliance pipeline → JSON output
- ✅ Tested working dengan SOP_GapFound.pdf
- ✅ Output: 5 dedupe-d gaps dengan sitasi pasal valid

### 🔄 IN PROGRESS (H2 - 25 April 2026)

- 🔄 FastAPI wrapper (`api.py`) — REST endpoint /analyze
- 🔄 Test API via Swagger UI

### ⏳ NEXT MILESTONES

| Hari | Task |
|---|---|
| H3-H5 | Frontend React (3 halaman: upload, loading, hasil) |
| H5-H6 | Deploy backend (Render) + frontend (Vercel) |
| H6-H7 | Polish UI + screenshot + finalisasi proposal |
| H7 | Submit ke Dicoding Challenge |
| H8 | Buffer day |

---

## 🚀 Cara Menjalankan

### Prerequisites

- Python 3.10+
- Git
- GitHub account dengan akses ke GitHub Models (permission `models:read`)
- Editor seperti VS Code

### 1. Clone Repository

```powershell
git clone https://github.com/your-username/complyscope.git
cd complyscope
```

### 2. Setup Virtual Environment

```powershell
# Buat venv
python -m venv venv

# Aktifkan venv (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Tanda berhasil: prompt jadi (venv) PS C:\...\complyscope>
```

> **Note untuk Windows:** Kalau muncul error "execution policy", jalankan sekali:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

### 3. Install Dependencies

```powershell
pip install openai python-dotenv rank_bm25 pypdf
```

(FastAPI dependency akan ditambahkan di milestone berikutnya:)
```powershell
pip install fastapi uvicorn python-multipart
```

### 4. Setup Credentials

Generate **GitHub Personal Access Token** di:
```
https://github.com/settings/personal-access-tokens/new
```

Pastikan permission **Models: Read-only** di-enable.

Buat file `.env.local` di root folder:

```bash
GITHUB_TOKEN=github_pat_xxxxxxxxxxxxxxx
GITHUB_MODELS_ENDPOINT=https://models.inference.ai.azure.com
GITHUB_MODELS_DEPLOYMENT=gpt-4o-mini
```

⚠️ **JANGAN commit `.env.local` ke Git!** File ini sudah ada di `.gitignore`.

### 5. Test Components

#### Test A: GitHub Models Connection
```powershell
python test_github_models.py
```
Expected: Response dari LLM tentang limbah B3.

#### Test B: BM25 Retrieval
```powershell
python retrieval.py
```
Expected: 5 query test dengan top-3 pasal relevan untuk masing-masing.

#### Test C: Compliance Pipeline (text input)
```powershell
python compliance_pipeline.py
```
Expected: JSON output dengan status GAP_FOUND/NEEDS_REVIEW.

#### Test D: PDF Extraction
```powershell
python pdf_extractor.py test_docs/SOP_GapFound.pdf
```
Expected: Extracted text dari 4 halaman PDF.

#### Test E: End-to-End (PDF input)
```powershell
python analyze_pdf.py test_docs/SOP_GapFound.pdf
```
Expected: Full compliance analysis JSON output.

---

## 📁 Struktur Folder

```
ComplyScope/
├── corpus/
│   └── uu_32_2009.json              # 43 pasal UU 32/2009 dengan metadata
├── prompts/
│   └── compliance_check.txt         # Prompt template (reference)
├── test_docs/
│   ├── SOP_Compliant.pdf            # SOP baseline compliant
│   ├── SOP_GapFound.pdf             # SOP dengan gap (untuk demo)
│   └── SOP_Ambigu.pdf               # SOP terlalu pendek (test NEEDS_REVIEW)
├── venv/                            # Python virtual environment (gitignored)
├── retrieval.py                     # BM25 retrieval module
├── compliance_pipeline.py           # Main compliance pipeline
├── pdf_extractor.py                 # PDF text extraction
├── analyze_pdf.py                   # End-to-end CLI: PDF in → JSON out
├── test_github_models.py            # Test koneksi GitHub Models
├── api.py                           # FastAPI server (in progress)
├── .env.local                       # Credentials (gitignored)
├── .gitignore
└── README.md                        # File ini
```

---

## 🔧 Komponen Detail

### `retrieval.py` — BM25 Retriever

**Fitur:**
- Load corpus dari JSON
- Build BM25 index dengan boost: `topik` dan `keywords` di-replicate 3x
- Indonesian stopword filtering
- Min score threshold (default 0.3)

**Penggunaan:**
```python
from retrieval import CorpusRetriever

retriever = CorpusRetriever('corpus/uu_32_2009.json')
results = retriever.retrieve("limbah B3 disimpan di area khusus", top_k=5, min_score=0.3)

for r in results:
    print(f"{r['entry']['sitasi']}: {r['entry']['teks']}")
```

### `compliance_pipeline.py` — Main Pipeline

**3-stage Anti-Hallucination Architecture:**

1. **Pre-LLM (Topic Filter):** Drop pasal yang topiknya jelas tidak match dengan SOP chunk
2. **LLM (Strict Prompt):** Multi-rule prompt yang prioritize "0 gap valid > 5 gap dipaksa"
3. **Post-LLM (Citation Validation):** Drop gap yang sitasinya bukan dari retrieved set

**Penggunaan:**
```python
from compliance_pipeline import analyze_sop

sop_text = "..."  # Plain text SOP
result = analyze_sop(sop_text, max_chunks=12)

print(result['status'])  # COMPLIANT / GAP_FOUND / NEEDS_REVIEW
print(result['gaps'])    # List of gap objects
```

### `pdf_extractor.py` — PDF Text Extraction

Wrapper sederhana di atas `pypdf` library untuk extract text dari PDF page-by-page.

**Penggunaan:**
```python
from pdf_extractor import extract_text_from_pdf

text = extract_text_from_pdf('test_docs/SOP_GapFound.pdf')
```

### `analyze_pdf.py` — End-to-End CLI

Combine PDF extractor + compliance pipeline.

**Penggunaan:**
```powershell
python analyze_pdf.py test_docs/SOP_GapFound.pdf
```

---

## 📋 Output Schema

```json
{
  "status": "GAP_FOUND",
  "summary": "Found 3 compliance gap(s) against UU 32/2009.",
  "primary_regulation": "UU 32/2009 PPLH",
  "gaps": [
    {
      "sop_excerpt": "Limbah dari proses produksi disimpan di area khusus pabrik.",
      "regulation_ref": "Pasal 59 ayat (1) UU 32/2009",
      "explanation": "SOP tidak menyebut kewajiban pengelolaan limbah B3 secara eksplisit."
    }
  ],
  "disclaimer": "Pre-check otomatis berbasis pasal terpilih. Bukan opini hukum final; gunakan untuk review awal internal.",
  "_meta": {
    "chunks_processed": 12,
    "total_tokens": 4500,
    "source_pdf": "test_docs/SOP_GapFound.pdf"
  }
}
```

### Status Values

| Status | Arti |
|---|---|
| `COMPLIANT` | SOP sesuai dengan retrieved regulations |
| `GAP_FOUND` | Ditemukan 1-5 gaps konkret dengan sitasi pasal |
| `NEEDS_REVIEW` | Evidence tidak cukup, butuh review manual |

---

## 🛡️ Anti-Hallucination Guardrails

ComplyScope mengimplementasi **3 lapis guardrail** untuk meminimalisir AI hallucination:

### Lapis 1: Pre-LLM Topic Filter
- Detect topik SOP chunk via keyword matching
- Drop retrieved pasal yang topiknya jelas tidak align
- **STRICT mode:** kalau topic ada tapi tidak ada pasal aligned → return empty (force NEEDS_REVIEW)

### Lapis 2: LLM Prompt Engineering
- Explicit rule: "Lebih baik 0 gap daripada gap yang dipaksa"
- Force model identify topic dulu sebelum buat gap
- Restrict explanation pakai bahasa yang ada di pasal

### Lapis 3: Post-LLM Citation Validation
- Parse `regulation_ref` dari LLM output
- Cross-check terhadap retrieved pasal set
- Drop gap dengan sitasi yang tidak ditemukan

---

## 🎯 Demo Scenarios

### Scenario 1: SOP_Compliant.pdf
**Expected output:** `status: COMPLIANT`, 0 gaps

### Scenario 2: SOP_GapFound.pdf
**Expected output:** `status: GAP_FOUND`, 2-5 gaps dengan sitasi UU 32/2009 Pasal 59

### Scenario 3: SOP_Ambigu.pdf
**Expected output:** `status: NEEDS_REVIEW`, 0 gaps (evidence too low)

---

## 👥 Tim

| Peran | Nama | Tanggung Jawab |
|---|---|---|
| Product Lead | Ricky | Corpus curation, prompt engineering, proposal writing, end-to-end pipeline |
| Tech Lead | Aflaha Fatinah Fatahillah | Frontend development, deployment, demo support |

**Universitas:** Bina Nusantara University (BINUS)

---

## 📜 Lisensi

MIT License — bebas digunakan untuk akademik dan komersial dengan attribution.

---

## 🙏 Acknowledgments

- **Microsoft Elevate Training Center** untuk inisiatif AI Impact Challenge
- **Dicoding Indonesia** untuk platform kompetisi
- **Kementerian Komunikasi dan Digital RI (Komdigi)** untuk dukungan
- **GitHub Models** untuk akses LLM gratis tier development
- **Bina Nusantara University** untuk sponsor Azure for Students subscription

---

## ⚠️ Disclaimer

ComplyScope adalah **alat bantu pre-check otomatis**, bukan pengganti review manual oleh ahli hukum atau auditor compliance bersertifikasi. Output dari sistem ini:

- Bukan opini hukum final
- Tidak menggantikan review oleh konsultan hukum
- Hanya berbasis pasal yang di-retrieve oleh sistem (mungkin belum cover semua aspek regulasi)
- Untuk pengambilan keputusan compliance final, **konsultasikan dengan profesional bersertifikat**.

Sistem ini didesain dengan prinsip **honest AI** — saat evidence tidak cukup, sistem akan output `NEEDS_REVIEW` daripada memaksa kesimpulan.

---

## 📞 Kontak

- Ricky — [GitHub Profile]
- Aflaha — [GitHub Profile]

**Repo Issues:** Silakan open issue di GitHub untuk pertanyaan, bug report, atau saran fitur.

---

*Last updated: 24 April 2026 (H1 milestone)*