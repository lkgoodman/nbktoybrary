from __future__ import annotations

from pydantic import BaseModel

from app.schemas.user import UserReadWithRoles


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserReadWithRoles
