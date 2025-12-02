import requests
from bs4 import BeautifulSoup
from app.ml.rag_engine import RAGEngine # Import the new brain

class NewsAgent:
    """
    Aladdin's 'Smart Ears'.
    Scrapes Google News and uses Vector RAG for sentiment.
    """
    
    def __init__(self):
        # Initialize the RAG engine once
        self.rag = RAGEngine()
    
    def get_news(self, query: str, max_results=5):
        print(f"📰 Aladdin is reading news about: {query}...")
        url = f"https://news.google.com/rss/search?q={query}+when:7d&hl=en-IN&gl=IN&ceid=IN:en"
        
        try:
            response = requests.get(url)
            soup = BeautifulSoup(response.content, features="xml")
            items = soup.find_all("item")
            
            news_results = []
            for item in items[:max_results]:
                news_results.append({
                    "title": item.title.text,
                    "link": item.link.text,
                    "pubDate": item.pubDate.text,
                    "source": item.source.text if item.source else "Unknown"
                })
            return news_results
        except Exception as e:
            print(f"⚠️ Error reading news: {e}")
            return []

    def analyze_sentiment(self, news_items):
        """
        Uses RAG Engine to understand meaning.
        """
        if not news_items: return 0.0
        
        # Extract just the titles for analysis
        titles = [item['title'] for item in news_items]
        
        # Ask the RAG Engine to score them
        return self.rag.analyze_semantic_sentiment(titles)