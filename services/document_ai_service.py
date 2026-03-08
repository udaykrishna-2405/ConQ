"""
Document AI Service for the ConQ Contextual Intelligence Engine.

Uses a local NLP engine (no external API calls) to produce
structured intelligence from raw document text in real time.
"""

import logging
from typing import Any, Dict, Generator

from ai.local_nlp import (
    analyze_document as nlp_analyze,
    extract_entities as nlp_entities,
    extract_keywords,
    extractive_summary,
    extract_insights,
    answer_question,
)

logger = logging.getLogger(__name__)

_MAX_DOCUMENT_CHARS = 500_000


def _truncate(text: str) -> str:
    if len(text) > _MAX_DOCUMENT_CHARS:
        logger.warning("Document truncated from %d to %d chars", len(text), _MAX_DOCUMENT_CHARS)
        return text[:_MAX_DOCUMENT_CHARS]
    return text


class DocumentAIService:
    """High-level service for AI-powered document intelligence (local NLP)."""

    # ------------------------------------------------------------------
    # 1. Full structured analysis  (POST /ai/analyze)
    # ------------------------------------------------------------------

    def analyze_document(self, document_text: str) -> Dict[str, Any]:
        text = _truncate(document_text)
        result = nlp_analyze(text)
        for key in ("summary", "entities", "keywords", "tags", "insights"):
            result.setdefault(key, [] if key != "summary" else "")
        return result

    # ------------------------------------------------------------------
    # 2. Conversational Q&A  (POST /ai/chat)
    # ------------------------------------------------------------------

    def chat(self, question: str, document_context: str) -> str:
        ctx = _truncate(document_context)
        return answer_question(question, ctx)

    def chat_stream(self, question: str, document_context: str) -> Generator[str, None, None]:
        ctx = _truncate(document_context)
        answer = answer_question(question, ctx)
        # Simulate streaming by yielding word-by-word
        words = answer.split()
        chunk: list = []
        for w in words:
            chunk.append(w)
            if len(chunk) >= 4:
                yield " ".join(chunk) + " "
                chunk = []
        if chunk:
            yield " ".join(chunk)

    # ------------------------------------------------------------------
    # 3. Streaming analysis  (POST /ai/analyze/stream)
    # ------------------------------------------------------------------

    def analyze_stream(self, document_text: str) -> Generator[str, None, None]:
        text = _truncate(document_text)
        result = nlp_analyze(text)

        yield "## Summary\n\n"
        yield result["summary"] + "\n\n"

        yield "## Entities\n\n"
        for e in result["entities"]:
            yield f"- {e}\n"
        yield "\n"

        yield "## Keywords\n\n"
        for k in result["keywords"]:
            yield f"- {k}\n"
        yield "\n"

        yield "## Tags\n\n"
        for t in result["tags"]:
            yield f"- {t}\n"
        yield "\n"

        yield "## Insights\n\n"
        for i in result["insights"]:
            yield f"- {i}\n"

    # ------------------------------------------------------------------
    # 4. Deep entity extraction  (POST /ai/entities)
    # ------------------------------------------------------------------

    def extract_entities(self, document_text: str) -> Dict[str, Any]:
        text = _truncate(document_text)
        return nlp_entities(text)

    # ------------------------------------------------------------------
    # 5. Summarisation  (POST /ai/summarize)
    # ------------------------------------------------------------------

    def summarize_brief(self, document_text: str) -> str:
        text = _truncate(document_text)
        return extractive_summary(text, num_sentences=2)

    def summarize_detailed(self, document_text: str) -> str:
        text = _truncate(document_text)
        return extractive_summary(text, num_sentences=6)
