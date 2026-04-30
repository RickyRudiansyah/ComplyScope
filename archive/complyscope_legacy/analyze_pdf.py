"""
End-to-end: PDF in → compliance analysis JSON out.

Usage:
  python analyze_pdf.py test_docs/SOP_GapFound.pdf
"""

import sys
import json
from pdf_extractor import extract_text_from_pdf
from compliance_pipeline import analyze_sop


def analyze_pdf_file(pdf_path: str) -> dict:
    """
    Full pipeline: PDF file → compliance result JSON.
    """
    # Step 1: Extract text from PDF
    sop_text = extract_text_from_pdf(pdf_path)
    
    if not sop_text or len(sop_text) < 50:
        return {
            "status": "NEEDS_REVIEW",
            "summary": "PDF text extraction failed or document too short.",
            "primary_regulation": "UU 32/2009 PPLH",
            "gaps": [],
            "disclaimer": "Pre-check otomatis berbasis pasal terpilih. Bukan opini hukum final."
        }
    
    # Step 2: Analyze SOP text
    result = analyze_sop(sop_text)
    
    # Add metadata
    result['_meta']['source_pdf'] = pdf_path
    result['_meta']['extracted_chars'] = len(sop_text)
    
    return result


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python analyze_pdf.py <path_to_pdf>")
        print("Example: python analyze_pdf.py test_docs/SOP_GapFound.pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    result = analyze_pdf_file(pdf_path)
    
    print(f"\n{'='*60}")
    print("FINAL RESULT")
    print('='*60)
    print(json.dumps(result, indent=2, ensure_ascii=False))