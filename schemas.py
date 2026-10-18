"""
Clockt API response schemas.

Defines the JSON structures returned by the backend.
"""

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str
    application: str
    api_version: str


class ActivityResponse(BaseModel):
    id: int
    timestamp: str
    application: str
    action: str
    duration_seconds: float = Field(ge=0)


class DeleteActivityResponse(BaseModel):
    deleted: bool
    activity_id: int


class ApplicationStatistics(BaseModel):
    application: str
    activity_count: int
    total_duration_seconds: float


class StatisticsResponse(BaseModel):
    total_activities: int
    total_duration_seconds: float
    unique_applications: int
    applications: list[ApplicationStatistics]


class RepeatedActivityResponse(BaseModel):
    application: str
    action: str
    repetitions: int
    total_seconds: float


class SuggestionResponse(BaseModel):
    application: str
    action: str
    repetitions: int
    total_seconds: float
    suggestion: str


class AnalysisResponse(BaseModel):
    activities_analyzed: int
    repeated_activities: list[RepeatedActivityResponse]
    suggestions: list[SuggestionResponse]


class ModelInfo(BaseModel):
    id: str
    object: str
    owned_by: str


class ModelsResponse(BaseModel):
    object: str
    data: list[ModelInfo]


class ChatResponseMessage(BaseModel):
    role: str
    content: str


class ChatChoice(BaseModel):
    index: int
    message: ChatResponseMessage
    finish_reason: str


class TokenUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatCompletionResponse(BaseModel):
    id: str
    object: str
    created: int
    model: str
    choices: list[ChatChoice]
    usage: TokenUsage