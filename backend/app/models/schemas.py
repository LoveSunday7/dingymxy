"""Pydantic数据模型"""
from typing import Any

from pydantic import BaseModel, Field


# ====== 认证相关 ======

class AdminLoginRequest(BaseModel):
    passphrase: str = Field(..., description="管理员口令")


class UserVerifyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="访客姓名")
    access_code: str = Field(..., description="管理员分配的访问码")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_info: dict[str, Any]


# ====== 用户/访客管理 ======

class UserCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    phone: str | None = None
    email: str | None = None
    wechat: str | None = None
    qq: str | None = None


class UserUpdateRequest(BaseModel):
    name: str | None = None
    phone: str | None = None
    email: str | None = None
    wechat: str | None = None
    qq: str | None = None
    is_verified: bool | None = None
    reset_access_code: bool | None = None


class UserResponse(BaseModel):
    id: int
    name: str
    phone: str | None
    email: str | None
    wechat: str | None
    qq: str | None
    access_code: str | None
    is_verified: bool
    last_login_at: str | None
    created_at: str


class PermissionCreateRequest(BaseModel):
    user_id: int
    resource_type: str = Field(..., pattern="^(page|post|category)$")
    resource_id: str


class PermissionResponse(BaseModel):
    id: int
    user_id: int
    resource_type: str
    resource_id: str
    created_at: str


class PublicPageUpdate(BaseModel):
    pages: dict[str, bool] = Field(..., description="页面ID到是否公开的映射，如 {\"home\": true, \"blog\": false}")


# ====== 文章相关 ======

class PostCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    slug: str | None = None
    excerpt: str | None = None
    content: str
    category_id: int | None = None
    is_published: bool = True
    is_featured: bool = False
    author_name: str = "黑色小猫"
    tag_ids: list[int] = []


class PostUpdateRequest(BaseModel):
    title: str | None = None
    slug: str | None = None
    excerpt: str | None = None
    content: str | None = None
    category_id: int | None = None
    is_published: bool | None = None
    is_featured: bool | None = None
    author_name: str | None = None
    tag_ids: list[int] | None = None


class PostResponse(BaseModel):
    id: int
    title: str
    slug: str | None
    excerpt: str | None
    content: str | None
    category: dict[str, Any] | None
    tags: list[dict[str, Any]]
    is_published: bool
    is_featured: bool
    views: int
    likes: int
    author_name: str
    published_at: str | None
    created_at: str
    updated_at: str
    comments_count: int = 0


class PostListResponse(BaseModel):
    posts: list[PostResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


# ====== 分类与标签 ======

class CategoryCreateRequest(BaseModel):
    name: str
    slug: str
    description: str | None = None


class TagCreateRequest(BaseModel):
    name: str
    slug: str


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None


class TagResponse(BaseModel):
    id: int
    name: str
    slug: str


# ====== 评论 ======

class CommentCreateRequest(BaseModel):
    author_name: str = Field(..., min_length=1, max_length=50)
    author_email: str | None = None
    content: str = Field(..., min_length=1, max_length=2000)
    parent_id: int | None = None


class CommentResponse(BaseModel):
    id: int
    post_id: int
    author_name: str
    author_email: str | None
    content: str
    likes: int
    parent_id: int | None
    is_approved: bool
    created_at: str


# ====== 留言板 ======

class MessageCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    email: str | None = None
    content: str = Field(..., min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: int
    name: str
    email: str | None
    content: str
    likes: int
    created_at: str


# ====== 通用 ======

class ApiResponse(BaseModel):
    success: bool
    message: str
    data: dict[str, Any] | None = None
