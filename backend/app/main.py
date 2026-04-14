from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="nbktoybrary backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class HelloResponse(BaseModel):
    message: str


@app.get("/hello", response_model=HelloResponse)
def hello() -> HelloResponse:
    return HelloResponse(message="Hello, world!")
