import os
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
import logging

logger = logging.getLogger(__name__)

class LangChainService:
    """LangChain service for advanced AI tasks"""
    
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found")
        
        self.llm = ChatGroq(
            api_key=api_key,
            model=os.getenv("GROQ_MODEL", "mixtral-8x7b-32768"),
            temperature=0.7
        )
        
        self.output_parser = StrOutputParser()
        
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=4000,
            chunk_overlap=200
        )
    
    async def summarize_content(self, content: str, url: str = None) -> str:
        """Summarize webpage or document content"""
        try:
            # Split content if too long
            chunks = self.text_splitter.split_text(content)
            
            if len(chunks) > 1:
                # Summarize each chunk then combine
                summaries = []
                for chunk in chunks[:3]:  # Limit to first 3 chunks
                    summary = await self._summarize_chunk(chunk)
                    summaries.append(summary)
                
                # Combine summaries
                combined = "\n\n".join(summaries)
                final_summary = await self._summarize_chunk(combined)
                return final_summary
            else:
                return await self._summarize_chunk(content)
                
        except Exception as e:
            logger.error(f"Summarization error: {e}")
            return "I encountered an error while summarizing the content."
    
    async def _summarize_chunk(self, text: str) -> str:
        """Summarize a single chunk of text"""
        prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a helpful assistant that provides clear and concise summaries."),
            ("user", "Provide a clear and concise summary of the following content:\n\n{text}\n\nSummary:")
        ])
        
        chain = prompt | self.llm | self.output_parser
        result = await chain.ainvoke({"text": text})
        return result.strip()
    
    async def answer_question(self, question: str, context: str, url: str = None) -> str:
        """Answer question based on context"""
        try:
            # Split context if too long
            chunks = self.text_splitter.split_text(context)
            
            # Use first few chunks as context
            relevant_context = "\n\n".join(chunks[:3])
            
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are a helpful assistant that answers questions based on provided context."),
                ("user", "Based on the following context, answer the question accurately and concisely.\n\nContext:\n{context}\n\nQuestion: {question}\n\nAnswer:")
            ])
            
            chain = prompt | self.llm | self.output_parser
            result = await chain.ainvoke({"context": relevant_context, "question": question})
            return result.strip()
            
        except Exception as e:
            logger.error(f"Question answering error: {e}")
            return "I encountered an error while processing your question."
    
    async def general_chat(self, query: str, context: str = None) -> str:
        """General chat with optional context"""
        try:
            if context:
                prompt = ChatPromptTemplate.from_messages([
                    ("system", "You are AiChat, a helpful AI assistant integrated into a browser."),
                    ("user", "Context from current page:\n{context}\n\nUser: {query}\n\nAssistant:")
                ])
                chain = prompt | self.llm | self.output_parser
                result = await chain.ainvoke({"context": context, "query": query})
            else:
                prompt = ChatPromptTemplate.from_messages([
                    ("system", "You are AiChat, a helpful AI assistant integrated into a browser."),
                    ("user", "{query}")
                ])
                chain = prompt | self.llm | self.output_parser
                result = await chain.ainvoke({"query": query})
            
            return result.strip()
            
        except Exception as e:
            logger.error(f"General chat error: {e}")
            return "I encountered an error while chatting."

# Global instance
langchain_service = LangChainService()
