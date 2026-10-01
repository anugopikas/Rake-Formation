from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def home():
    return {"message": "RAKE Formation API is running"}

@router.get("/health")
def health():
    return {"status": "OK"}