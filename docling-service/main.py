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
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from docling.document_converter import DocumentConverter
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


class DocumentMetadata(BaseModel):
    pages: int = 0
    figures: int = 0
    tables: int = 0


class ProcessResult(BaseModel):
    markdown: str
    metadata: DocumentMetadata
    images: list[str] = []
    error: Optional[str] = None


# Initialize converter once
converter = DocumentConverter()


def extract_page_count(result, doc) -> int:
    try:
        if hasattr(result, 'input') and result.input is not None and hasattr(result.input, 'page_count'):
            return int(result.input.page_count)
        if hasattr(doc, 'pages') and doc.pages:
            return int(len(doc.pages))
    except Exception as e:
        logger.warning(f"Error extracting pages: {e}")
    return 0


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
            return JSONResponse(status_code=500, content={"error": "Failed to convert PDF"})

        doc = result.document

        markdown = doc.export_to_markdown() if hasattr(doc, 'export_to_markdown') else ''
        if not markdown or len(markdown) < 100:
            return JSONResponse(status_code=500, content={"error": "Docling returned empty markdown"})

        metadata = DocumentMetadata(
            pages=extract_page_count(result, doc),
            figures=len(doc.pictures) if hasattr(doc, 'pictures') and doc.pictures else 0,
            tables=len(doc.tables) if hasattr(doc, 'tables') and doc.tables else 0,
        )

        return ProcessResult(
            markdown=markdown,
            metadata=metadata,
            images=[],
        )
        
    except Exception as e:
        logger.exception(f"Error processing PDF: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


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
            return JSONResponse(status_code=500, content={"error": "Failed to convert PDF"})

        doc = result.document

        markdown = doc.export_to_markdown() if hasattr(doc, 'export_to_markdown') else ''
        if not markdown or len(markdown) < 100:
            return JSONResponse(status_code=500, content={"error": "Docling returned empty markdown"})

        metadata = DocumentMetadata(
            pages=extract_page_count(result, doc),
            figures=len(doc.pictures) if hasattr(doc, 'pictures') and doc.pictures else 0,
            tables=len(doc.tables) if hasattr(doc, 'tables') and doc.tables else 0,
        )

        return ProcessResult(
            markdown=markdown,
            metadata=metadata,
            images=[],
        )
        
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch PDF: {e}")
    except Exception as e:
        logger.exception(f"Error processing PDF from URL: {e}")
        return JSONResponse(status_code=500, content={"error": str(e)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
