"""
PDF text extraction untuk ComplyScope.
Input: path ke PDF file
Output: text string siap di-feed ke compliance_pipeline.

Run standalone untuk test:
  python pdf_extractor.py test_docs/SOP_GapFound.pdf
"""

import sys
from pypdf import PdfReader


def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extract text dari PDF file.
    
    Returns:
        String berisi text dari semua halaman, di-join dengan double newline.
    """
    reader = PdfReader(pdf_path)
    
    print(f"[PDF Extractor] Loaded {pdf_path}")
    print(f"[PDF Extractor] Pages: {len(reader.pages)}")
    
    all_text = []
    for i, page in enumerate(reader.pages, 1):
        text = page.extract_text()
        if text and text.strip():
            all_text.append(text.strip())
            print(f"[PDF Extractor] Page {i}: {len(text)} chars extracted")
        else:
            print(f"[PDF Extractor] Page {i}: empty or failed")
    
    full_text = '\n\n'.join(all_text)
    print(f"[PDF Extractor] Total extracted: {len(full_text)} chars")
    
    return full_text


# Self-test
if __name__ == '__main__':
    if len(sys.argv) < 2:
        # Default: test dengan SOP_GapFound.pdf
        pdf_path = 'test_docs/SOP_GapFound.pdf'
    else:
        pdf_path = sys.argv[1]
    
    text = extract_text_from_pdf(pdf_path)
    
    print(f"\n{'='*60}")
    print("EXTRACTED TEXT:")
    print('='*60)
    print(text)
    print(f"\n{'='*60}")
    print(f"Total: {len(text)} characters")
    print('='*60)