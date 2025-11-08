"""Focus Mode service with AI URL validation"""
import os
from groq import Groq
from typing import Dict, List
from urllib.parse import urlparse
import re

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Use lightweight, fast model for focus mode checks
FOCUS_MODEL = "llama-3.1-8b-instant"  # Fast and efficient


class FocusModeService:
    """Service for focus mode URL validation"""
    
    def __init__(self):
        self.client = client
    def clean_url_simple(self,url: str) -> str:
        """Trim URL to remove unwanted params and fragments."""
        url = url.split('&', 1)[0].split('#', 1)[0]
        return url.rstrip('?/&')
    def extract_domain(self, url: str) -> str:
        """Extract domain from URL"""
        try:
            url = self.clean_url_simple(url)
            print(url)
            parsed = urlparse(url)
            
            return parsed.netloc or parsed.path
        except:
            return url
    
    def is_whitelisted_domain(self, url: str, allowed_domains: List[str]) -> bool:
        """Check if URL is in whitelisted domains"""
        domain = self.extract_domain(url)
        
        for allowed in allowed_domains:
            if allowed.lower() in domain.lower():
                return True
        
        return False
    
    async def check_url_relevance(
        self,
        url: str,
        topic: str,
        description: str = "",
        keywords: List[str] = [],
        strict_mode: bool = False
    ) -> Dict[str, any]:
        """
        Check if URL is relevant to the focus topic using AI
        
        Args:
            url: URL to check
            topic: Focus topic
            description: Optional topic description
            keywords: Optional keywords
            strict_mode: If True, be more restrictive
            
        Returns:
            Dict with 'allowed', 'reason', and 'confidence' keys
        """
        try:
            domain = self.extract_domain(url)
            
            # Build context
            context = f"Topic: {topic}"
            if description:
                context += f"\nDescription: {description}"
            if keywords:
                context += f"\nKeywords: {', '.join(keywords)}"
            
            # Create prompt for AI
            prompt = f"""You are a focus mode assistant. Determine if a website is relevant to the user's focus topic.

{context}

Website to check: {url}
Domain: {domain}

Analyze if this website is relevant to the focus topic. Consider:
1. Does the domain name suggest relevance?
2. Would visiting this site help with the topic?
3. Is it a distraction or productive?

Strict mode: {'Yes - Be very restrictive' if strict_mode else 'No - Be reasonable'}

Respond in this exact format:
DECISION: [ALLOW or BLOCK]
CONFIDENCE: [0-100]
REASON: [One sentence explanation]"""

            # Call AI with lightweight model
            response = self.client.chat.completions.create(
                model=FOCUS_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful focus mode assistant. Be concise and decisive."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,  # Low temperature for consistent decisions
                max_tokens=150
            )
            
            result_text = response.choices[0].message.content.strip()
            
            # Parse response
            decision = "BLOCK"
            confidence = 50
            reason = "Unable to determine relevance"
            
            for line in result_text.split('\n'):
                if line.startswith('DECISION:'):
                    decision = line.split(':', 1)[1].strip().upper()
                elif line.startswith('CONFIDENCE:'):
                    try:
                        confidence = int(re.search(r'\d+', line).group())
                    except:
                        confidence = 50
                elif line.startswith('REASON:'):
                    reason = line.split(':', 1)[1].strip()
            
            allowed = decision == "ALLOW"
            
            return {
                "allowed": allowed,
                "confidence": confidence,
                "reason": reason,
                "url": url,
                "domain": domain
            }
            
        except Exception as e:
            print(f"Error checking URL relevance: {e}")
            # Default to blocking on error in strict mode, allowing otherwise
            return {
                "allowed": not strict_mode,
                "confidence": 0,
                "reason": f"Error during check: {str(e)}",
                "url": url,
                "domain": self.extract_domain(url)
            }
    
    async def batch_check_urls(
        self,
        urls: List[str],
        topic: str,
        description: str = "",
        keywords: List[str] = [],
        strict_mode: bool = False
    ) -> Dict[str, Dict]:
        """Check multiple URLs at once"""
        results = {}
        
        for url in urls:
            result = await self.check_url_relevance(
                url, topic, description, keywords, strict_mode
            )
            results[url] = result
        
        return results
    
    def get_quick_decision(self, url: str, keywords: List[str]) -> bool:
        """
        Quick keyword-based check without AI (fallback)
        Useful for very fast checks
        """
        url_lower = url.lower()
        
        # Check if any keyword appears in URL
        for keyword in keywords:
            if keyword.lower() in url_lower:
                return True
        
        # Common distraction domains
        distraction_domains = [
            'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com',
            'youtube.com', 'reddit.com', 'netflix.com', 'twitch.tv',
            'pinterest.com', 'snapchat.com', 'whatsapp.com'
        ]
        
        for distraction in distraction_domains:
            if distraction in url_lower:
                return False
        
        # If no match, allow by default (let AI decide)
        return True


# Global service instance
focus_service = FocusModeService()
