import os
import secrets

from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI(title="DevCollective AI Service")

MODEL_NAME = os.getenv("BGE_MODEL", "BAAI/bge-m3")
EMBEDDING_DIMENSIONS = 1024
MAX_BATCH_SIZE = 128
DEFAULT_BATCH_SIZE = 16
BGE_API_KEY = os.getenv("BGE_API_KEY", "").strip()

print(f"Loading {MODEL_NAME}...")
model = SentenceTransformer(MODEL_NAME)
print(f"{MODEL_NAME} loaded successfully!")


class EmbedRequest(BaseModel):
    text: str


class BatchEmbedRequest(BaseModel):
    texts: list[str]


def require_api_key(x_bge_api_key: str | None = Header(default=None)):
    """Protect embedding endpoints when BGE_API_KEY is configured.

    Local development can leave BGE_API_KEY unset. Production Render wiring
    supplies the secret automatically between the app and private service.
    """
    if not BGE_API_KEY:
        return
    if not x_bge_api_key or not secrets.compare_digest(x_bge_api_key, BGE_API_KEY):
        raise HTTPException(status_code=401, detail="Invalid BGE service credentials.")


@app.get("/")
def root():
    return {
        "message": "DevCollective AI Service is running",
        "model": MODEL_NAME,
        "dimensions": EMBEDDING_DIMENSIONS,
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "dimensions": EMBEDDING_DIMENSIONS,
    }


def encode_texts(texts: list[str]):
    cleaned = [text.strip() for text in texts]
    if not cleaned or any(not text for text in cleaned):
        raise HTTPException(status_code=400, detail="Text must not be empty.")

    batch_size = max(1, int(os.getenv("BGE_BATCH_SIZE", str(DEFAULT_BATCH_SIZE))))
    embeddings = model.encode(
        cleaned,
        normalize_embeddings=True,
        batch_size=batch_size,
        show_progress_bar=False,
    )
    return embeddings.tolist()


@app.post("/embed", dependencies=[Depends(require_api_key)])
def create_embedding(request: EmbedRequest):
    embedding = encode_texts([request.text])[0]
    return {
        "text": request.text,
        "embedding": embedding,
        "dimensions": len(embedding),
    }


@app.post("/embed/batch", dependencies=[Depends(require_api_key)])
def create_batch_embeddings(request: BatchEmbedRequest):
    if len(request.texts) > MAX_BATCH_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"A maximum of {MAX_BATCH_SIZE} texts can be embedded per request.",
        )
    embeddings = encode_texts(request.texts)
    return {
        "embeddings": embeddings,
        "dimensions": len(embeddings[0]) if embeddings else EMBEDDING_DIMENSIONS,
        "count": len(embeddings),
    }
