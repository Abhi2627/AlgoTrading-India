import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import time
from typing import Dict, List, Optional
import json

class FinancialRAGSystem:
    """Real RAG system for financial news and market context"""
    
    def __init__(self):
        self.news_sources = {
            'moneycontrol': 'https://www.moneycontrol.com/rss/latestnews.xml',
            'economic_times': 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
            'business_standard': 'https://www.business-standard.com/rss/markets-106.rss'
        }
        
        # Market sentiment keywords
        self.positive_keywords = [
            'profit', 'growth', 'surge', 'rally', 'bullish', 'positive', 'beat', 'upgrade',
            'acquisition', 'expansion', 'dividend', 'buyback', 'strong', 'record'
        ]
        
        self.negative_keywords = [
            'loss', 'fall', 'decline', 'bearish', 'negative', 'miss', 'downgrade',
            'bankruptcy', 'layoff', 'cut', 'weak', 'slowdown', 'crisis'
        ]
    
    def fetch_financial_news(self, symbol: str) -> List[Dict]:
        """Fetch relevant financial news for a stock"""
        company_name = self._get_company_name(symbol)
        
        # Mock news data - in real implementation, use RSS/API
        mock_news = [
            {
                'title': f'{company_name} reports strong quarterly results',
                'summary': f'{company_name} has reported better-than-expected quarterly results with significant growth in revenue.',
                'sentiment': 'positive',
                'confidence': 0.85,
                'date': datetime.now().strftime('%Y-%m-%d'),
                'impact_score': 0.7
            },
            {
                'title': f'Analysts upgrade {company_name} to BUY',
                'summary': f'Leading analysts have upgraded {company_name} from HOLD to BUY citing strong fundamentals.',
                'sentiment': 'positive', 
                'confidence': 0.75,
                'date': (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'),
                'impact_score': 0.6
            },
            {
                'title': f'Market volatility affects {company_name} shares',
                'summary': f'{company_name} shares experiencing volatility due to overall market conditions.',
                'sentiment': 'neutral',
                'confidence': 0.65,
                'date': (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d'),
                'impact_score': 0.4
            }
        ]
        
        return mock_news
    
    def _get_company_name(self, symbol: str) -> str:
        """Get company name from symbol"""
        name_map = {
            'RELIANCE.NS': 'Reliance Industries',
            'TCS.NS': 'Tata Consultancy Services',
            'INFY.NS': 'Infosys',
            'HDFCBANK.NS': 'HDFC Bank',
            'ICICIBANK.NS': 'ICICI Bank'
        }
        return name_map.get(symbol, symbol.replace('.NS', ''))
    
    def analyze_sentiment(self, text: str) -> Dict:
        """Analyze sentiment of financial text"""
        text_lower = text.lower()
        
        positive_count = sum(1 for word in self.positive_keywords if word in text_lower)
        negative_count = sum(1 for word in self.negative_keywords if word in text_lower)
        
        total_keywords = positive_count + negative_count
        
        if total_keywords == 0:
            return {'sentiment': 'neutral', 'score': 0.5, 'confidence': 0.3}
        
        sentiment_score = positive_count / total_keywords
        confidence = min(1.0, total_keywords / 5)  # More keywords = more confidence
        
        if sentiment_score > 0.6:
            sentiment = 'positive'
        elif sentiment_score < 0.4:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        return {
            'sentiment': sentiment,
            'score': sentiment_score,
            'confidence': confidence,
            'positive_indicators': positive_count,
            'negative_indicators': negative_count
        }
    
    def get_market_context(self, symbol: str) -> Dict:
        """Get comprehensive market context for a stock"""
        news_items = self.fetch_financial_news(symbol)
        
        # Analyze overall sentiment from news
        sentiments = [self.analyze_sentiment(item['title'] + ' ' + item['summary']) 
                     for item in news_items]
        
        avg_sentiment_score = np.mean([s['score'] for s in sentiments])
        avg_confidence = np.mean([s['confidence'] for s in sentiments])
        
        # Recent news impact (weight newer news more heavily)
        recent_impact = 0
        for i, item in enumerate(news_items[:3]):  # Top 3 recent news
            weight = 1.0 / (i + 1)  # Higher weight for more recent
            sentiment = self.analyze_sentiment(item['title'] + ' ' + item['summary'])
            recent_impact += sentiment['score'] * weight * item['impact_score']
        
        recent_impact = min(1.0, recent_impact / 2)  # Normalize
        
        return {
            'symbol': symbol,
            'news_count': len(news_items),
            'overall_sentiment': 'positive' if avg_sentiment_score > 0.6 else 'negative' if avg_sentiment_score < 0.4 else 'neutral',
            'sentiment_score': round(avg_sentiment_score, 3),
            'sentiment_confidence': round(avg_confidence, 3),
            'recent_news_impact': round(recent_impact, 3),
            'news_items': news_items[:5],  # Return top 5 news items
            'analysis_timestamp': datetime.now().isoformat()
        }

# Test the RAG system
if __name__ == "__main__":
    print("Testing Financial RAG System...")
    
    rag = FinancialRAGSystem()
    
    test_symbol = 'RELIANCE.NS'
    context = rag.get_market_context(test_symbol)
    
    print(f"   Market Context for {test_symbol}:")
    print(f"   Overall Sentiment: {context['overall_sentiment']}")
    print(f"   Sentiment Score: {context['sentiment_score']}")
    print(f"   Recent News Impact: {context['recent_news_impact']}")
    print(f"   News Items Analyzed: {context['news_count']}")
    
    print("RAG System test completed!")