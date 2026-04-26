"""
ComplyScope - Compliance Check Pipeline
=========================================
End-to-end pipeline untuk pre-check kepatuhan SOP terhadap UU 32/2009 PPLH.

Pipeline flow:
  SOP text → chunk → BM25 retrieval → topic filter → LLM check → 
  citation guardrail → dedupe → aggregate → JSON output

Run: python compliance_pipeline.py
"""

import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from retrieval import CorpusRetriever


# ============================================================
# SETUP
# ============================================================

load_dotenv('.env.local')

client = OpenAI(
    base_url=os.getenv('GITHUB_MODELS_ENDPOINT'),
    api_key=os.getenv('GITHUB_TOKEN')
)
MODEL = os.getenv('GITHUB_MODELS_DEPLOYMENT', 'gpt-4o-mini')

retriever = CorpusRetriever()


# ============================================================
# CHUNKING
# ============================================================

def chunk_sop(sop_text: str) -> list:
    """
    Split SOP text into chunks per logical section.
    
    Strategy:
    1. Strip whitespace per line
    2. Skip header (first short line without action verbs)
    3. Group lines into sections based on starters (Bagian, Pasal, numbered list)
    4. Filter chunks <20 chars (terlalu pendek)
    """
    # Normalize: strip per-line whitespace, drop empty lines
    lines = [line.strip() for line in sop_text.split('\n') if line.strip()]
    
    if not lines:
        return []
    
    # Detect and strip header
    first = lines[0]
    is_likely_header = (
        len(first) < 80 and
        not any(verb in first.lower() for verb in [
            'wajib', 'harus', 'dilakukan', 'disimpan', 'memakai',
            'mengelola', 'menangani', 'menyimpan', 'mengangkut'
        ])
    )
    if is_likely_header:
        print(f"[Chunker] Skipping header: {first}")
        lines = lines[1:]
    
    # Group lines into chunks
    chunks = []
    current_chunk = []
    section_starters = ['bagian ', 'pasal ', 'langkah ', 'tahap ', 'prosedur ']
    
    for line in lines:
        line_lower = line.lower()
        is_section_start = (
            any(line_lower.startswith(s) for s in section_starters) or
            (line and line[0].isdigit() and ('.' in line[:4] or ')' in line[:4]))
        )
        
        if is_section_start and current_chunk:
            chunks.append(' '.join(current_chunk))
            current_chunk = [line]
        else:
            current_chunk.append(line)
    
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    # Filter chunks too short
    chunks = [c for c in chunks if len(c) >= 20]
    
    return chunks


# ============================================================
# TOPIC FILTER (Pre-LLM Guardrail)
# ============================================================

def filter_topically_relevant(chunk: str, retrieved: list) -> list:
    """
    Pre-LLM filter: drop pasal yang topiknya jelas gak match dengan SOP chunk.
    
    Strict mode: kalau topic SOP terdeteksi tapi gak ada pasal yang aligned,
    return empty list -> chunk akan masuk NEEDS_REVIEW.
    """
    chunk_lower = chunk.lower()
    
    topic_indicators = {
        'apd': ['apd', 'alat pelindung', 'sarung tangan', 'masker', 'helm', 'safety'],
        'penyimpanan': ['simpan', 'disimpan', 'tps', 'gudang', 'area khusus', 'penampung'],
        'pengangkutan': ['angkut', 'pengangkutan', 'transportasi', 'pihak ketiga', 'pihak lain'],
        'izin': ['izin', 'lisensi', 'permit', 'persetujuan'],
        'sanksi': ['denda', 'pidana', 'sanksi', 'pelanggaran'],
        'pengelolaan': ['kelola', 'pengelolaan', 'pemanfaatan', 'pengolahan'],
        'pelaporan': ['laporan', 'pelaporan', 'manifest', 'dokumentasi'],
    }
    
    # Detect chunk topics
    chunk_topics = set()
    for topic, indicators in topic_indicators.items():
        if any(ind in chunk_lower for ind in indicators):
            chunk_topics.add(topic)
    
    if not chunk_topics:
        print(f"  [Topic Filter] No clear topic detected, keeping all retrieved")
        return retrieved
    
    # Filter retrieved pasal
    filtered = []
    for r in retrieved:
        entry = r['entry']
        pasal_text = (
            ' '.join(entry.get('topik', [])) + ' ' +
            ' '.join(entry.get('keywords', [])) + ' ' +
            entry.get('teks', '')
        ).lower()
        
        for topic in chunk_topics:
            if any(ind in pasal_text for ind in topic_indicators[topic]):
                filtered.append(r)
                break
    
    if filtered:
        print(f"  [Topic Filter] Kept {len(filtered)}/{len(retrieved)} pasal matching topic: {chunk_topics}")
        return filtered
    else:
        print(f"  [Topic Filter] STRICT: No pasal aligned with topic {chunk_topics}, returning empty")
        return []


# ============================================================
# LLM COMPLIANCE CHECK
# ============================================================

def compliance_check_chunk(sop_chunk: str, retrieved_pasal: list) -> dict:
    """
    Call LLM to check compliance untuk 1 chunk SOP terhadap retrieved pasal.
    """
    if not retrieved_pasal:
        return {
            "status": "NEEDS_REVIEW",
            "summary": "Tidak ada pasal regulasi yang cukup relevan dengan section SOP ini.",
            "topic_assessment": "unable to determine",
            "gaps": []
        }
    
    retrieved_context = "\n\n".join([
        f"[{r['entry']['sitasi']}] (relevance: {r['score']:.2f})\n{r['entry']['teks']}"
        for r in retrieved_pasal
    ])
    
    prompt = f"""Anda adalah asisten review compliance SOP terhadap regulasi Indonesia.

SOP SECTION YANG DI-REVIEW:
{sop_chunk}

PASAL REGULASI YANG DI-RETRIEVE:
{retrieved_context}

LANGKAH ANALISIS:
1. Baca SOP section. Apa topik utamanya?
2. Untuk setiap pasal: apakah TOPICALLY ALIGNED dengan SOP section?
3. HANYA buat gap untuk pasal yang ALIGNED.
4. Identifikasi kewajiban EKSPLISIT di pasal yang missing dari SOP.

ATURAN KRITIS:
- Lebih baik 0 gap daripada gap yang dipaksa.
- JANGAN buat gap dari pasal yang topiknya beda.
- Explanation HARUS mention konsep yang BENAR-BENAR ADA di teks pasal.
  JANGAN ngarang istilah baru (contoh: jangan bilang "dokumen X" kalau pasal gak sebut "dokumen X").
- sop_excerpt HARUS kutipan EXACT dari teks SOP yang gue kasih, bukan paraphrase atau negasi.

OUTPUT SCHEMA:
{{
  "status": "COMPLIANT" | "GAP_FOUND" | "NEEDS_REVIEW",
  "summary": "1 kalimat ringkasan",
  "topic_assessment": "topik utama SOP section dalam 5-10 kata",
  "gaps": [
    {{
      "sop_excerpt": "kutipan EXACT dari SOP section di atas",
      "regulation_ref": "sitasi exact pasal",
      "explanation": "kewajiban spesifik missing, pakai kata yang ADA di pasal"
    }}
  ]
}}

Output JSON only, no markdown:"""
    
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": "Kamu asisten compliance review yang konservatif dan presisi. Output JSON valid saja."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=800,
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    
    raw = response.choices[0].message.content
    
    try:
        result = json.loads(raw)
        result['_tokens'] = response.usage.total_tokens
        return result
    except json.JSONDecodeError as e:
        return {
            "status": "NEEDS_REVIEW",
            "summary": f"JSON parse error: {str(e)[:100]}",
            "topic_assessment": "parse error",
            "gaps": [],
            "_raw": raw,
            "_tokens": response.usage.total_tokens
        }


# ============================================================
# CITATION GUARDRAIL (Post-LLM)
# ============================================================

def validate_citations(gaps: list, retrieved_pasal: list) -> list:
    """
    Drop gaps yang regulation_ref-nya tidak ada di retrieved pasal.
    Anti-hallucination guardrail.
    """
    valid_sitasi = {r['entry']['sitasi'] for r in retrieved_pasal}
    valid_gaps = []
    dropped = 0
    
    for gap in gaps:
        ref = gap.get('regulation_ref', '')
        # Strip brackets if any (LLM kadang kasih [Pasal X])
        ref_clean = ref.strip('[]').strip()
        
        if ref_clean in valid_sitasi or ref in valid_sitasi:
            gap['regulation_ref'] = ref_clean
            valid_gaps.append(gap)
        else:
            dropped += 1
            print(f"  [Guardrail] Dropped gap with invalid citation: {ref}")
    
    if dropped > 0:
        print(f"  [Guardrail] Dropped {dropped} gap(s) due to citation validation")
    
    return valid_gaps


# ============================================================
# DEDUPE GAPS
# ============================================================

def dedupe_gaps(gaps: list) -> list:
    """
    Remove duplicate gaps based on regulation_ref + sop_excerpt prefix.
    """
    seen = set()
    unique = []
    
    for gap in gaps:
        ref = gap.get('regulation_ref', '')
        excerpt_prefix = gap.get('sop_excerpt', '')[:60]
        key = f"{ref}|{excerpt_prefix}"
        
        if key not in seen:
            seen.add(key)
            unique.append(gap)
    
    return unique


# ============================================================
# MAIN PIPELINE
# ============================================================

def analyze_sop(sop_text: str, top_k: int = 5, max_chunks: int = 12) -> dict:
    """
    Full pipeline: SOP text in -> compliance analysis JSON out.
    
    Args:
        sop_text: Plain text content of SOP
        top_k: Top K pasal to retrieve per chunk (default 5)
        max_chunks: Max chunks to process (token efficiency, default 12)
    
    Returns:
        Dict with status, gaps, summary, disclaimer, metadata
    """
    print(f"\n{'='*60}")
    print("ANALYZING SOP")
    print('='*60)
    
    chunks = chunk_sop(sop_text)
    print(f"SOP split into {len(chunks)} chunk(s) after preprocessing")
    
    # Cap chunks for token efficiency
    if len(chunks) > max_chunks:
        print(f"[Optimizer] Capping to {max_chunks} chunks (was {len(chunks)})")
        # Strategy: take first half + last half for full coverage
        half = max_chunks // 2
        chunks = chunks[:half] + chunks[-half:]
    
    all_gaps = []
    chunk_results = []
    total_tokens = 0
    
    for i, chunk in enumerate(chunks, 1):
        print(f"\n--- Chunk {i}/{len(chunks)} ---")
        print(f"Text: {chunk[:100]}...")
        
        # Retrieve relevant pasal
        retrieved = retriever.retrieve(chunk, top_k=top_k, min_score=0.3)
        print(f"Retrieved {len(retrieved)} pasal:")
        for r in retrieved:
            print(f"  - {r['entry']['sitasi']} (score: {r['score']:.2f})")
        
        # Pre-LLM topic filter
        retrieved = filter_topically_relevant(chunk, retrieved)
        
        if retrieved:
            result = compliance_check_chunk(chunk, retrieved)
            
            # Post-LLM citation guardrail
            if result.get('gaps'):
                result['gaps'] = validate_citations(result['gaps'], retrieved)
            
            print(f"Topic: {result.get('topic_assessment', 'N/A')}")
            print(f"Status: {result.get('status')}, Gaps: {len(result.get('gaps', []))}")
            
            chunk_results.append(result)
            all_gaps.extend(result.get('gaps', []))
            total_tokens += result.get('_tokens', 0)
        else:
            print("Skipped (no relevant pasal after filter)")
            chunk_results.append({
                "status": "NEEDS_REVIEW",
                "summary": "No relevant regulation found.",
                "gaps": []
            })
    
    print(f"\n{'='*60}")
    print("AGGREGATING FINAL RESULT")
    print('='*60)
    
    # Dedupe + cap final gaps at 5
    all_gaps = dedupe_gaps(all_gaps)[:5]
    
    # Determine overall status
    if any(c.get('status') == 'GAP_FOUND' for c in chunk_results) and all_gaps:
        overall_status = 'GAP_FOUND'
    elif all(c.get('status') == 'COMPLIANT' for c in chunk_results):
        overall_status = 'COMPLIANT'
    else:
        overall_status = 'NEEDS_REVIEW'
    
    # Build summary
    if overall_status == 'COMPLIANT':
        summary = "SOP appears compliant with retrieved regulations."
    elif overall_status == 'GAP_FOUND':
        summary = f"Found {len(all_gaps)} compliance gap(s) against UU 32/2009."
    else:
        summary = "Insufficient evidence for confident assessment. Manual review recommended."
    
    final = {
        "status": overall_status,
        "summary": summary,
        "primary_regulation": "UU 32/2009 PPLH",
        "gaps": all_gaps,
        "disclaimer": "Pre-check otomatis berbasis pasal terpilih. Bukan opini hukum final; gunakan untuk review awal internal.",
        "_meta": {
            "chunks_processed": len(chunks),
            "total_tokens": total_tokens
        }
    }
    
    return final


# ============================================================
# CLI ENTRY POINT
# ============================================================

if __name__ == '__main__':
    sop_test = """SOP Penanganan Limbah PT Contoh
    
Bagian 1: Limbah dari proses produksi disimpan di area khusus pabrik.

Bagian 2: Karyawan wajib memakai APD saat menangani limbah.

Bagian 3: Pengangkutan limbah dilakukan setiap minggu oleh pihak ketiga."""
    
    result = analyze_sop(sop_test)
    
    print(f"\n{'='*60}")
    print("FINAL RESULT")
    print('='*60)
    print(json.dumps(result, indent=2, ensure_ascii=False))