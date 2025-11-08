import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
from datetime import datetime
from typing import List, Dict, Optional
import hashlib
import logging

logger = logging.getLogger(__name__)

class VectorStore:
    """Vector storage for webpage content using ChromaDB"""
    
    def __init__(self, persist_directory: str = "./chroma_db"):
        """Initialize ChromaDB client and embedding model"""
        try:
            # Initialize ChromaDB with persistence
            self.client = chromadb.PersistentClient(path=persist_directory)
            
            # Use ChromaDB's default embedding function
            self.embedding_function = embedding_functions.DefaultEmbeddingFunction()
            
            # Get or create collection for page content with embedding function
            self.collection = self.client.get_or_create_collection(
                name="webpage_content",
                embedding_function=self.embedding_function,
                metadata={"description": "Stores webpage content with embeddings"}
            )
            
            logger.info("✅ Vector store initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing vector store: {e}")
            raise
    
    def _generate_page_id(self, url: str, timestamp: str) -> str:
        """Generate unique ID for a page based on URL and timestamp"""
        unique_string = f"{url}_{timestamp}"
        return hashlib.md5(unique_string.encode()).hexdigest()
    
    def _chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks for better retrieval"""
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < text_length:
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                
                if break_point > chunk_size // 2:  # Only break if we're past halfway
                    chunk = chunk[:break_point + 1]
                    end = start + break_point + 1
            
            chunks.append(chunk.strip())
            start = end - overlap  # Overlap for context continuity
        
        return chunks
    
    async def store_page(
        self,
        url: str,
        title: str,
        content: str,
        description: Optional[str] = None,
        access_time: Optional[datetime] = None
    ) -> Dict[str, any]:
        """
        Store webpage content in vector database
        
        Args:
            url: Page URL
            title: Page title
            content: Full page content
            description: Optional meta description
            access_time: Time when page was accessed
            
        Returns:
            Dictionary with storage status and metadata
        """
        try:
            if access_time is None:
                access_time = datetime.now()
            
            timestamp = access_time.isoformat()
            
            # Chunk the content for better retrieval
            content_chunks = self._chunk_text(content)
            
            logger.info(f"Storing page: {url} ({len(content_chunks)} chunks)")
            
            # Prepare data for storage
            ids = []
            documents = []
            metadatas = []
            
            for i, chunk in enumerate(content_chunks):
                chunk_id = f"{self._generate_page_id(url, timestamp)}_chunk_{i}"
                ids.append(chunk_id)
                documents.append(chunk)
                metadatas.append({
                    "url": url,
                    "title": title,
                    "description": description or "",
                    "access_time": timestamp,
                    "access_date": access_time.strftime("%Y-%m-%d"),
                    "chunk_index": i,
                    "total_chunks": len(content_chunks)
                })
            
            # Add to collection (ChromaDB will handle embeddings)
            self.collection.add(
                ids=ids,
                documents=documents,
                metadatas=metadatas
            )
            
            logger.info(f"✅ Successfully stored {len(content_chunks)} chunks for {url}")
            
            return {
                "success": True,
                "url": url,
                "title": title,
                "chunks_stored": len(content_chunks),
                "timestamp": timestamp,
                "page_id": self._generate_page_id(url, timestamp)
            }
            
        except Exception as e:
            logger.error(f"Error storing page: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def query_relevant_content(
        self,
        query: str,
        n_results: int = 5,
        filter_url: Optional[str] = None
    ) -> List[Dict[str, any]]:
        """
        Query vector database for relevant content
        
        Args:
            query: Search query
            n_results: Number of results to return
            filter_url: Optional URL filter to search only specific page
            
        Returns:
            List of relevant content chunks with metadata
        """
        try:
            # Prepare query parameters
            query_params = {
                "query_texts": [query],
                "n_results": n_results
            }
            
            # Add URL filter if specified
            if filter_url:
                query_params["where"] = {"url": filter_url}
            
            # Query the collection
            results = self.collection.query(**query_params)
            
            # Format results
            formatted_results = []
            if results['documents'] and len(results['documents']) > 0:
                for i in range(len(results['documents'][0])):
                    formatted_results.append({
                        "content": results['documents'][0][i],
                        "metadata": results['metadatas'][0][i],
                        "distance": results['distances'][0][i] if 'distances' in results else None
                    })
            
            logger.info(f"Found {len(formatted_results)} relevant chunks for query: {query[:50]}...")
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error querying vector store: {e}")
            return []
    
    async def get_page_history(
        self,
        url: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, any]]:
        """
        Get browsing history from vector store
        
        Args:
            url: Optional URL filter
            limit: Maximum number of pages to return
            
        Returns:
            List of stored pages with metadata
        """
        try:
            query_params = {
                "limit": limit * 10  # Get more to account for chunks
            }
            
            if url:
                query_params["where"] = {"url": url}
            
            # Get all documents
            results = self.collection.get(**query_params)
            
            # Group by page (URL + timestamp)
            pages = {}
            for i, metadata in enumerate(results['metadatas']):
                page_key = f"{metadata['url']}_{metadata['access_time']}"
                if page_key not in pages:
                    pages[page_key] = {
                        "url": metadata['url'],
                        "title": metadata['title'],
                        "description": metadata['description'],
                        "access_time": metadata['access_time'],
                        "access_date": metadata['access_date'],
                        "chunks": 0
                    }
                pages[page_key]['chunks'] += 1
            
            # Convert to list and sort by access time
            page_list = list(pages.values())
            page_list.sort(key=lambda x: x['access_time'], reverse=True)
            
            return page_list[:limit]
            
        except Exception as e:
            logger.error(f"Error getting page history: {e}")
            return []
    
    def get_stats(self) -> Dict[str, any]:
        """Get statistics about stored content"""
        try:
            count = self.collection.count()
            return {
                "total_chunks": count,
                "collection_name": self.collection.name
            }
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {"error": str(e)}

# Global instance
vector_store = VectorStore()
