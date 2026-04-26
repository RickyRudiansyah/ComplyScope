"""
BM25 Retrieval untuk corpus regulasi v2.
Dengan boost untuk topik + keywords match.
"""

import json
import re
from rank_bm25 import BM25Okapi


class CorpusRetriever:
    def __init__(self, corpus_path: str = 'corpus/uu_32_2009.json'):
        """Load corpus dan build BM25 index dengan boost."""
        with open(corpus_path, 'r', encoding='utf-8') as f:
            self.corpus = json.load(f)
        
        # Build searchable text dengan boost untuk topik + keywords
        # Topik dan keywords di-replicate 3x supaya bobotnya naik di BM25
        self.documents = []
        for entry in self.corpus:
            parts = [entry['teks']]
            
            # Boost topik (3x weight)
            if entry.get('topik'):
                topik_text = ' '.join(entry['topik'])
                parts.extend([topik_text] * 3)
            
            # Boost keywords (3x weight)
            if entry.get('keywords'):
                keywords_text = ' '.join(entry['keywords'])
                parts.extend([keywords_text] * 3)
            
            self.documents.append(' '.join(parts))
        
        # Tokenize
        tokenized_docs = [self._tokenize(doc) for doc in self.documents]
        
        # Build BM25
        self.bm25 = BM25Okapi(tokenized_docs)
        
        print(f"[Retriever] Loaded {len(self.corpus)} entries, BM25 index ready (with topik+keywords boost)")
    
    def _tokenize(self, text: str) -> list:
        """Tokenize: lowercase + split alphanumeric, drop very short tokens."""
        text = text.lower()
        # Stop-word ringan untuk Bahasa Indonesia (paling umum)
        stopwords = {
            'di', 'dan', 'atau', 'yang', 'dari', 'untuk', 'pada', 'dalam',
            'oleh', 'dengan', 'ke', 'akan', 'adalah', 'ini', 'itu', 'dapat',
            'tidak', 'jika', 'agar', 'serta', 'juga', 'telah', 'sudah'
        }
        tokens = re.findall(r'[a-z0-9]+', text)
        # Filter stop-words dan token sangat pendek
        tokens = [t for t in tokens if len(t) > 1 and t not in stopwords]
        return tokens
    
    def retrieve(self, query: str, top_k: int = 5, min_score: float = 0.5) -> list:
        """
        Retrieve top-k pasal paling relevan untuk query.
        
        Args:
            query: query text
            top_k: jumlah hasil maksimum
            min_score: skor BM25 minimum supaya hasil dianggap relevan
        
        Returns:
            List of dict dengan keys: entry, score
        """
        tokenized_query = self._tokenize(query)
        scores = self.bm25.get_scores(tokenized_query)
        
        # Filter by min_score, sort, take top_k
        scored_indices = [(i, s) for i, s in enumerate(scores) if s >= min_score]
        scored_indices.sort(key=lambda x: x[1], reverse=True)
        scored_indices = scored_indices[:top_k]
        
        results = []
        for idx, score in scored_indices:
            results.append({
                'entry': self.corpus[idx],
                'score': float(score)
            })
        
        return results


if __name__ == '__main__':
    retriever = CorpusRetriever()
    
    test_queries = [
        "limbah B3 disimpan di area khusus pabrik",
        "pengangkutan limbah pihak ketiga",
        "izin pengelolaan limbah B3 dari menteri",
        "sanksi pidana pelanggaran pengelolaan limbah B3",
        "kewajiban memiliki TPS limbah B3",  # query baru untuk validasi
    ]
    
    for query in test_queries:
        print(f"\n{'='*60}")
        print(f"Query: {query}")
        print('='*60)
        results = retriever.retrieve(query, top_k=3, min_score=0.5)
        if not results:
            print("  No results above min_score threshold")
            continue
        for i, r in enumerate(results, 1):
            entry = r['entry']
            print(f"\n#{i} [{entry['sitasi']}] (score: {r['score']:.3f})")
            print(f"   Topik: {entry.get('topik', [])}")
            print(f"   Teks: {entry['teks'][:150]}...")