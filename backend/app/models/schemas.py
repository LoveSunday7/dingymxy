"""Pydantic数据模型"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ====== 认证相关 ======

class AdminLoginRequest(BaseModel):
    username: str
    password: str


class UserVerifyRequest(BaseModel):
    access_code: str = Field(..., description="管理员分配的访问码")
    name: str = Field(..., min_length=1, max_length=50, description="访客姓名")
    phone: Optional[str] = Field(None, description="手机号")
    email: Optional[str] = Field(None, description="邮箱")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_info: dict


# ====== 用户/访客管理 ======

class UserCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    phone: Optional[str] = None
    email: Optional[str] = None
    wechat: Optional[str] = None
    qq: Optional[str] = None


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    wechat: Optional[str] = None
    qq: Optional[str] = None
    is_verified: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    wechat: Optional[str]
    qq: Optional[str]
    access_code: Optional[str]
    is_verified: bool
    last_login_at: Optional[str]
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


# ====== 文章相关 ======

class PostCreateRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: str
    category_id: Optional[int] = None
    is_published: bool = True
    is_featured: bool = False
    author_name: str = "黑色小猫"
    tag_ids: List[int] = []


class PostUpdateRequest(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    category_id: Optional[int] = None
    is_published: Optional[bool] = None
    is_featured: Optional[bool] = None
    author_name: Optional[str] = None
    tag_ids: Optional[List[int]] = None


class PostResponse(BaseModel):
    id: int
    title: str
    slug: Optional[str]
    excerpt: Optional[str]
    content: Optional[str]
    category: Optional[dict]
    tags: List[dict]
    is_published: bool
    is_featured: bool
    views: int
    likes: int
    author_name: str
    published_at: Optional[str]
    created_at: str
    updated_at: str
    comments_count: int = 0


class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


# ====== 分类与标签 ======

class CategoryCreateRequest(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None


class TagCreateRequest(BaseModel):
    name: str
    slug: str


class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]


class TagResponse(BaseModel):
    id: int
    name: str
    slug: str


# ====== 评论 ======

class CommentCreateRequest(BaseModel):
    author_name: str = Field(..., min_length=1, max_length=50)
    author_email: Optional[str] = None
    content: str = Field(..., min_length=1, max_length=2000)
    parent_id: Optional[int] = None


class CommentResponse(BaseModel):
    id: int
    post_id: int
    author_name: str
    author_email: Optional[str]
    content: str
    likes: int
    parent_id: Optional[int]
    is_approved: bool
    created_at: str


# ====== 留言板 ======

class MessageCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    email: Optional[str] = None
    content: str = Field(..., min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: int
    name: str
    email: Optional[str]
    content: str
    likes: int
    created_at: str


# ====== 通用 ======

class ApiResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
