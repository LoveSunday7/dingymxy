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
    access_code: str | None = None
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
    parent_id: int | None = None
    reply_to_name: str | None = None


class MessageResponse(BaseModel):
    id: int
    name: str
    email: str | None
    content: str
    likes: int
    created_at: str


# ====== 简历 (Phase 2) ======

class ResumeFieldCreate(BaseModel):
    section: str = Field(..., min_length=1, max_length=50, description="分组: basic_info, bio, skills, work_experience, education, certifications, traits")
    field_key: str = Field(..., min_length=1, max_length=100)
    field_label: str = Field(..., min_length=1, max_length=100)
    field_value: str
    field_type: str = Field(default="text", pattern="^(text|longtext|list)$")
    sort_order: int = 0


class ResumeFieldUpdate(BaseModel):
    field_value: str | None = None
    field_label: str | None = None
    sort_order: int | None = None


class ResumeFieldResponse(BaseModel):
    id: int
    section: str
    field_key: str
    field_label: str
    field_value: str
    field_type: str
    sort_order: int
    created_at: str
    updated_at: str | None


class ResumeSectionResponse(BaseModel):
    section: str
    fields: list[ResumeFieldResponse]


class ResumeBatchUpdateRequest(BaseModel):
    """批量更新简历字段"""
    fields: list[ResumeFieldCreate]


# ====== 时间线/经历 (Phase 2) ======

class TimelineEventCreate(BaseModel):
    event_type: str = Field(default="work", pattern="^(work|education|life)$")
    title: str = Field(..., min_length=1, max_length=200)
    organization: str | None = None
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    summary: str | None = None
    highlights: list[str] | None = None
    sort_order: int = 0
    is_visible: bool = True


class TimelineEventUpdate(BaseModel):
    event_type: str | None = None
    title: str | None = None
    organization: str | None = None
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    summary: str | None = None
    highlights: list[str] | None = None
    sort_order: int | None = None
    is_visible: bool | None = None


class TimelineEventResponse(BaseModel):
    id: int
    event_type: str
    title: str
    organization: str | None
    location: str | None
    start_date: str | None
    end_date: str | None
    summary: str | None
    highlights: list[str] | None
    sort_order: int
    is_visible: bool
    created_at: str
    updated_at: str | None


class ResumeProjectCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    period: str | None = None
    role: str | None = None
    tech_stack: list[str] | None = None
    description: str | None = None
    highlights: list[str] | None = None
    post_id: int | None = None
    sort_order: int = 0
    is_visible: bool = True


class ResumeProjectUpdate(BaseModel):
    title: str | None = None
    period: str | None = None
    role: str | None = None
    tech_stack: list[str] | None = None
    description: str | None = None
    highlights: list[str] | None = None
    post_id: int | None = None
    sort_order: int | None = None
    is_visible: bool | None = None


class ResumeProjectResponse(BaseModel):
    id: int
    title: str
    period: str | None
    role: str | None
    tech_stack: list[str] | None
    description: str | None
    highlights: list[str] | None
    post_id: int | None = None
    sort_order: int
    is_visible: bool
    created_at: str
    updated_at: str | None


# ====== 朋友圈 (Phase 2) ======

class MomentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    images: list[str] | None = Field(default=None, max_items=9, description="图片路径列表，最多9张")


class MomentUpdate(BaseModel):
    content: str | None = None
    images: list[str] | None = None
    is_published: bool | None = None


class MomentResponse(BaseModel):
    id: int
    author_name: str
    content: str
    images: list[str] | None
    likes: int
    is_published: bool
    created_at: str
    comments_count: int = 0


class MomentDetailResponse(BaseModel):
    id: int
    author_name: str
    content: str
    images: list[str] | None
    likes: int
    is_published: bool
    created_at: str
    comments: list[dict[str, Any]]


class FriendsCommentCreate(BaseModel):
    author_name: str = Field(..., min_length=1, max_length=50)
    content: str = Field(..., min_length=1, max_length=2000)


class FriendsCommentResponse(BaseModel):
    id: int
    moment_id: int
    author_name: str
    content: str
    created_at: str


# ====== 通用 ======

class ApiResponse(BaseModel):
    success: bool
    message: str
    data: dict[str, Any] | None = None
