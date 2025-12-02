from sentence_transformers import SentenceTransformer, util
import numpy as np

class RAGEngine:
    """
    The 'Semantic Brain' of Aladdin.
    Converts text into vectors to understand context, not just keywords.
    """
    def __init__(self):
        print("🧠 Loading RAG Embedding Model (MiniLM)...")
        # We use a tiny, fast model designed for semantic search
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Define 'Anchor Concepts' - We compare news against these ideas
        self.positive_anchors = self.model.encode([
            "Stock price surged significantly",
            "Company reports record high profits",
            "Strategic partnership announced",
            "Market bullish and optimistic",
            "Analyst upgrades rating to buy"
        ])
        
        self.negative_anchors = self.model.encode([
            "Stock price crashed heavily",
            "Company files for bankruptcy or lawsuit",
            "Quarterly earnings missed expectations",
            "Market bearish and fearful",
            "Analyst downgrades rating to sell"
        ])

    def analyze_semantic_sentiment(self, texts: list):
        """
        Determines if news is Bullish or Bearish by comparing its 'meaning'
        to our positive/negative anchors.
        """
        if not texts: return 0.0
        
        # 1. Turn all headlines into vectors
        news_vectors = self.model.encode(texts)
        
        total_sentiment = 0
        
        for vector in news_vectors:
            # Calculate similarity to Positive Anchors
            pos_score = util.cos_sim(vector, self.positive_anchors).max().item()
            
            # Calculate similarity to Negative Anchors
            neg_score = util.cos_sim(vector, self.negative_anchors).max().item()
            
            # Net Sentiment for this headline
            sentiment = pos_score - neg_score
            total_sentiment += sentiment
            
        # Average the score across all headlines
        avg_sentiment = total_sentiment / len(texts)
        
        # Scale it a bit (Embeddings are usually subtle, between -0.2 and 0.2)
        final_score = avg_sentiment * 5 
        
        # Cap between -1 and 1
        return max(-1.0, min(1.0, final_score))

# --- Quick Test Block ---
if __name__ == "__main__":
    rag = RAGEngine()
    
    # Test a tricky headline that keyword search fails on
    test_headlines = [
        "Reliance avoided a major disaster today.", # Contains 'disaster', but is positive
        "The infinite growth cycle has stopped."   # Contains 'growth', but is negative
    ]
    
    score = rag.analyze_semantic_sentiment(test_headlines)
    print(f"\n📢 Semantic Score: {score:.2f} (Should be mixed/neutral)")