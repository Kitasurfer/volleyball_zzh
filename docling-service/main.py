"""
Docling PDF Processing Service

Converts PDF documents into semantically chunked text using IBM Docling.
Returns structured chunks with headings, text, and metadata.
"""

import io
import logging
from typing import Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from docling.document_converter import DocumentConverter
from docling.chunking import HybridChunker
from docling.datamodel.base_models import InputFormat

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Docling PDF Service",
    description="Convert PDFs to semantic chunks using IBM Docling",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChunkResult(BaseModel):
    text: str
    headings: list[str] = []
    page: Optional[int] = None
    doc_items_refs: list[str] = []


class ProcessResult(BaseModel):
    success: bool
    filename: str
    total_chunks: int
    chunks: list[ChunkResult]
    error: Optional[str] = None


# Initialize converter once
converter = DocumentConverter()


def extract_headings(chunk) -> list[str]:
    """Extract heading hierarchy from chunk metadata."""
    headings = []
    try:
        if hasattr(chunk, 'meta') and chunk.meta:
            # Get headings from chunk metadata
            if hasattr(chunk.meta, 'headings'):
                headings = list(chunk.meta.headings) if chunk.meta.headings else []
            # Alternative: doc_items may contain heading info
            elif hasattr(chunk.meta, 'doc_items'):
                for item in chunk.meta.doc_items:
                    if hasattr(item, 'label') and 'heading' in str(item.label).lower():
                        if hasattr(item, 'text'):
                            headings.append(item.text)
    except Exception as e:
        logger.warning(f"Error extracting headings: {e}")
    return headings


def extract_page(chunk) -> Optional[int]:
    """Extract page number from chunk."""
    try:
        if hasattr(chunk, 'meta') and chunk.meta:
            if hasattr(chunk.meta, 'doc_items') and chunk.meta.doc_items:
                first_item = chunk.meta.doc_items[0]
                if hasattr(first_item, 'prov') and first_item.prov:
                    prov = first_item.prov[0] if isinstance(first_item.prov, list) else first_item.prov
                    if hasattr(prov, 'page_no'):
                        return prov.page_no
    except Exception as e:
        logger.warning(f"Error extracting page: {e}")
    return None


def extract_doc_items_refs(chunk) -> list[str]:
    """Extract document item references (for linking to images, tables, etc.)."""
    refs = []
    try:
        if hasattr(chunk, 'meta') and chunk.meta:
            if hasattr(chunk.meta, 'doc_items') and chunk.meta.doc_items:
                for item in chunk.meta.doc_items:
                    if hasattr(item, 'self_ref'):
                        refs.append(item.self_ref)
    except Exception as e:
        logger.warning(f"Error extracting refs: {e}")
    return refs


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "docling-pdf"}


@app.post("/process", response_model=ProcessResult)
async def process_pdf(
    file: UploadFile = File(...),
    max_tokens: int = Query(default=512, ge=100, le=2000, description="Max tokens per chunk"),
    language: str = Query(default="de", description="Document language (de, en, ru)"),
):
    """
    Process a PDF file and return semantic chunks.
    
    - **file**: PDF file to process
    - **max_tokens**: Maximum tokens per chunk (default: 512)
    - **language**: Document language for tokenization
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    logger.info(f"Processing file: {file.filename}")
    
    try:
        # Read file content
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")
        
        if len(content) > 50 * 1024 * 1024:  # 50MB limit
            raise HTTPException(status_code=400, detail="File too large (max 50MB)")
        
        # Convert PDF using Docling
        logger.info("Converting PDF with Docling...")
        
        # Create a temporary file-like object
        pdf_stream = io.BytesIO(content)
        
        # Convert the document
        result = converter.convert(pdf_stream, input_format=InputFormat.PDF)
        
        if not result or not result.document:
            raise HTTPException(status_code=500, detail="Failed to convert PDF")
        
        doc = result.document
        logger.info(f"Document converted, creating chunks...")
        
        # Create chunker with hybrid strategy (semantic + size-based)
        chunker = HybridChunker(
            tokenizer="sentence-transformers/all-MiniLM-L6-v2",
            max_tokens=max_tokens,
            merge_peers=True,  # Merge adjacent chunks of same type
        )
        
        # Generate chunks
        chunks = list(chunker.chunk(doc))
        logger.info(f"Generated {len(chunks)} chunks")
        
        # Convert to response format
        chunk_results = []
        for chunk in chunks:
            chunk_text = chunk.text if hasattr(chunk, 'text') else str(chunk)
            
            if not chunk_text or not chunk_text.strip():
                continue
            
            chunk_results.append(ChunkResult(
                text=chunk_text.strip(),
                headings=extract_headings(chunk),
                page=extract_page(chunk),
                doc_items_refs=extract_doc_items_refs(chunk),
            ))
        
        logger.info(f"Returning {len(chunk_results)} non-empty chunks")
        
        return ProcessResult(
            success=True,
            filename=file.filename,
            total_chunks=len(chunk_results),
            chunks=chunk_results,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error processing PDF: {e}")
        return ProcessResult(
            success=False,
            filename=file.filename or "unknown",
            total_chunks=0,
            chunks=[],
            error=str(e),
        )


@app.post("/process-url", response_model=ProcessResult)
async def process_pdf_url(
    url: str = Query(..., description="URL of the PDF to process"),
    max_tokens: int = Query(default=512, ge=100, le=2000),
    language: str = Query(default="de"),
):
    """
    Process a PDF from URL and return semantic chunks.
    """
    import httpx
    
    logger.info(f"Fetching PDF from URL: {url}")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            content = response.content
        
        # Extract filename from URL
        filename = url.split("/")[-1].split("?")[0]
        if not filename.endswith('.pdf'):
            filename = "document.pdf"
        
        # Convert PDF
        pdf_stream = io.BytesIO(content)
        result = converter.convert(pdf_stream, input_format=InputFormat.PDF)
        
        if not result or not result.document:
            raise HTTPException(status_code=500, detail="Failed to convert PDF")
        
        doc = result.document
        
        chunker = HybridChunker(
            tokenizer="sentence-transformers/all-MiniLM-L6-v2",
            max_tokens=max_tokens,
            merge_peers=True,
        )
        
        chunks = list(chunker.chunk(doc))
        
        chunk_results = []
        for chunk in chunks:
            chunk_text = chunk.text if hasattr(chunk, 'text') else str(chunk)
            if not chunk_text or not chunk_text.strip():
                continue
            
            chunk_results.append(ChunkResult(
                text=chunk_text.strip(),
                headings=extract_headings(chunk),
                page=extract_page(chunk),
                doc_items_refs=extract_doc_items_refs(chunk),
            ))
        
        return ProcessResult(
            success=True,
            filename=filename,
            total_chunks=len(chunk_results),
            chunks=chunk_results,
        )
        
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch PDF: {e}")
    except Exception as e:
        logger.exception(f"Error processing PDF from URL: {e}")
        return ProcessResult(
            success=False,
            filename="unknown",
            total_chunks=0,
            chunks=[],
            error=str(e),
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
