from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI(title="DevCollective AI Service")

print("Loading BGE-M3...")
model = SentenceTransformer("BAAI/bge-m3")
print("BGE-M3 loaded successfully!")


class EmbedRequest(BaseModel):
    text: str


class BatchEmbedRequest(BaseModel):
    texts: list[str]


@app.get("/")
def root():
    return {
        "message": "DevCollective AI Service is running",
        "model": "BAAI/bge-m3",
        "dimensions": 1024,
    }


@app.get("/health")
def health():
    return {"status": "ok", "model": "BAAI/bge-m3", "dimensions": 1024}


def encode_texts(texts: list[str]):
    cleaned = [text.strip() for text in texts]
    if not cleaned or any(not text for text in cleaned):
        raise HTTPException(status_code=400, detail="Text must not be empty.")
    embeddings = model.encode(cleaned, normalize_embeddings=True)
    return embeddings.tolist()


@app.post("/embed")
def create_embedding(request: EmbedRequest):
    embedding = encode_texts([request.text])[0]
    return {
        "text": request.text,
        "embedding": embedding,
        "dimensions": len(embedding),
    }


@app.post("/embed/batch")
def create_batch_embeddings(request: BatchEmbedRequest):
    if len(request.texts) > 128:
        raise HTTPException(status_code=400, detail="A maximum of 128 texts can be embedded per request.")
    embeddings = encode_texts(request.texts)
    return {
        "embeddings": embeddings,
        "dimensions": len(embeddings[0]) if embeddings else 1024,
        "count": len(embeddings),
    }
