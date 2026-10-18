"""
Clockt FastAPI backend.

Provides activity storage, statistics, productivity
analysis, and local AI chat for React + Electron.
"""

import json
import os
import time
import uuid

import torch
import uvicorn

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from transformers import AutoTokenizer, AutoModelForCausalLM

from activity_analyzer import (
    Activity,
    find_repeated_activities,
    generate_suggestions,
    calculate_activity_statistics,
)

from database import (
    initialize_database,
    save_activity,
    get_activities,
    delete_activity,
)

from config import (
    APP_NAME,
    API_VERSION,
    BASE_DIR,
    HOST,
    PORT,
    MODEL_NAME,
)

from schemas import (
    HealthResponse,
    ActivityResponse,
    DeleteActivityResponse,
    StatisticsResponse,
    AnalysisResponse,
    ModelsResponse,
    ChatCompletionResponse,
)


# --------------------------------------------------
# Application configuration
# --------------------------------------------------

ROOT_PATH = os.getenv("CLOCKT_ROOT_PATH", "")

app = FastAPI(
    title=f"{APP_NAME} Local Server",
    root_path=ROOT_PATH,
)

default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

additional_origins = [
    origin.strip()
    for origin in os.getenv(
        "CLOCKT_CORS_ORIGINS", ""
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_origins + additional_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type"],
)


# --------------------------------------------------
# Database initialization
# --------------------------------------------------

initialize_database()


# --------------------------------------------------
# AI model initialization
# --------------------------------------------------

print(f"Loading {APP_NAME} AI model...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(MODEL_NAME)
model.eval()

print(f"{APP_NAME} AI model ready!")


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get(
    f"/{API_VERSION}/health",
    response_model=HealthResponse,
)
def health_check():
    return {
        "status": "ok",
        "application": APP_NAME,
        "api_version": API_VERSION,
    }


# --------------------------------------------------
# Activity storage
# --------------------------------------------------

class ActivityCreate(BaseModel):
    timestamp: str
    application: str = Field(min_length=1)
    action: str = Field(min_length=1)
    duration_seconds: float = Field(ge=0)


@app.post(
    f"/{API_VERSION}/activities",
    status_code=201,
    response_model=ActivityResponse,
)
def create_activity(activity: ActivityCreate):
    activity_id = save_activity(
        timestamp=activity.timestamp,
        application=activity.application,
        action=activity.action,
        duration_seconds=activity.duration_seconds,
    )

    return {
        "id": activity_id,
        **activity.model_dump(),
    }


@app.get(
    f"/{API_VERSION}/activities",
    response_model=list[ActivityResponse],
)
def list_activities():
    """
    Retrieve saved activity history, newest first.
    """
    return get_activities()


@app.delete(
    f"/{API_VERSION}/activities/{{activity_id}}",
    response_model=DeleteActivityResponse,
    responses={
        404: {
            "description": "Activity not found",
        }
    },
)
def remove_activity(activity_id: int):
    """
    Delete a saved activity by its database ID.
    """
    deleted = delete_activity(activity_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Activity not found",
        )

    return {
        "deleted": True,
        "activity_id": activity_id,
    }


# --------------------------------------------------
# Dashboard statistics
# --------------------------------------------------

@app.get(
    f"/{API_VERSION}/statistics",
    response_model=StatisticsResponse,
)
def get_statistics():
    """
    Calculate dashboard statistics from saved activities.
    """
    activities = get_activities()

    return calculate_activity_statistics(activities)


# --------------------------------------------------
# Chat request models
# --------------------------------------------------

class ChatMessage(BaseModel):
    role: str
    content: str | list[dict]


class ChatRequest(BaseModel):
    model: str
    messages: list[ChatMessage]
    max_tokens: int = 128
    stream: bool = False


def normalize_content(content):
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        return "\n".join(
            str(part.get("text", ""))
            for part in content
            if isinstance(part, dict)
            and part.get("type") == "text"
        )

    return ""


# --------------------------------------------------
# OpenAI-compatible model endpoint
# --------------------------------------------------

@app.get(
    f"/{API_VERSION}/models",
    response_model=ModelsResponse,
)
def list_models():
    return {
        "object": "list",
        "data": [
            {
                "id": "timesaver-local",
                "object": "model",
                "owned_by": "clockt",
            }
        ],
    }


# --------------------------------------------------
# Streaming AI responses
# --------------------------------------------------

def stream_chat_response(response):
    completion_id = f"chatcmpl-{uuid.uuid4().hex}"
    created = int(time.time())

    chunk = {
        "id": completion_id,
        "object": "chat.completion.chunk",
        "created": created,
        "model": "timesaver-local",
        "choices": [
            {
                "index": 0,
                "delta": {
                    "role": "assistant",
                    "content": response,
                },
                "finish_reason": None,
            }
        ],
    }

    yield f"data: {json.dumps(chunk)}\n\n"

    chunk["choices"][0]["delta"] = {}
    chunk["choices"][0]["finish_reason"] = "stop"

    yield f"data: {json.dumps(chunk)}\n\n"
    yield "data: [DONE]\n\n"


# --------------------------------------------------
# AI chat completions
# --------------------------------------------------

@app.post(
    f"/{API_VERSION}/chat/completions",
    response_model=ChatCompletionResponse,
    responses={
        200: {
            "description": (
                "JSON chat completion, or text/event-stream "
                "when stream=true."
            ),
            "content": {
                "text/event-stream": {
                    "schema": {
                        "type": "string",
                        "description": (
                            "Server-sent events containing "
                            "chat completion chunks."
                        ),
                    }
                }
            },
        }
    },
)
def chat_completion(request: ChatRequest):
    print(
        "Incoming request:",
        len(request.messages),
        "messages,",
        sum(
            len(normalize_content(message.content))
            for message in request.messages
        ),
        "characters",
        flush=True,
    )

    messages = [
        {
            "role": message.role,
            "content": (
                "You are Clockt, a helpful productivity assistant. "
                "Answer the user's questions directly and accurately. "
                "Use the conversation history when answering follow-up questions."
                if message.role == "system"
                else normalize_content(message.content)
            ),
        }
        for message in request.messages
        if message.role in ("system", "user", "assistant")
    ]

    system_messages = [
        message
        for message in messages
        if message["role"] == "system"
    ]

    conversation_messages = [
        message
        for message in messages
        if message["role"] != "system"
    ]

    messages = (
        system_messages[:1]
        + conversation_messages[-4:]
    )

    if not system_messages:
        messages.insert(
            0,
            {
                "role": "system",
                "content": (
                    "You are Clockt, a helpful productivity assistant."
                ),
            },
        )

    inputs = tokenizer.apply_chat_template(
        messages,
        return_tensors="pt",
        return_dict=False,
        add_generation_prompt=True,
    )

    print("Input tokens:", inputs.shape[-1], flush=True)

    with torch.inference_mode():
        output = model.generate(
            inputs,
            max_new_tokens=min(
                max(request.max_tokens, 1),
                256,
            ),
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
        )

    response = tokenizer.decode(
        output[0][inputs.shape[-1]:],
        skip_special_tokens=True,
    )

    if request.stream:
        return StreamingResponse(
            stream_chat_response(response),
            media_type="text/event-stream",
        )

    return {
        "id": f"chatcmpl-{uuid.uuid4().hex}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "timesaver-local",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": response,
                },
                "finish_reason": "stop",
            }
        ],
        "usage": {
            "prompt_tokens": inputs.shape[-1],
            "completion_tokens": (
                output.shape[-1] - inputs.shape[-1]
            ),
            "total_tokens": output.shape[-1],
        },
    }


# --------------------------------------------------
# Activity analysis
# --------------------------------------------------

@app.post(
    f"/{API_VERSION}/analyze-activities",
    response_model=AnalysisResponse,
)
def analyze_activities(activities: list[Activity]):
    repeated = find_repeated_activities(activities)
    suggestions = generate_suggestions(repeated)

    return {
        "activities_analyzed": len(activities),
        "repeated_activities": repeated,
        "suggestions": suggestions,
    }


# --------------------------------------------------
# Legacy development dashboard
# --------------------------------------------------

@app.get("/dashboard")
def serve_dashboard():
    return FileResponse(
        BASE_DIR / "dashboard.html",
        media_type="text/html",
    )


# --------------------------------------------------
# Local development entry point
# --------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(
        app,
        host=HOST,
        port=PORT,
    )