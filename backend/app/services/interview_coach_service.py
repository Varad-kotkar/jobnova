from __future__ import annotations

import logging
from typing import Any, Dict, List

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload, selectinload

from ..models.job import Job
from ..models.resume import Resume
from ..models.user import User

logger = logging.getLogger("backend.app.interview_coach_service")


class InterviewCoachService:
    @staticmethod
    async def generate_interview_prep(
        session: AsyncSession,
        user_id: str,
        job_id: str,
    ) -> Dict[str, Any]:
        # 1. Fetch Target Job
        job_query = select(Job).options(joinedload(Job.company)).where(Job.id == job_id)
        job_res = await session.execute(job_query)
        job = job_res.scalars().first()

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target job listing not found")

        company_name = job.company.name if job.company else "Employer"
        job_title = job.title
        job_skills = [s.title() for s in (job.skills or [])]

        if not job_skills and job.description:
            desc_lower = job.description.lower()
            for tech in ["Python", "React", "TypeScript", "FastAPI", "Django", "PostgreSQL", "Docker", "AWS", "Kubernetes", "Next.JS"]:
                if tech.lower() in desc_lower:
                    job_skills.append(tech)

        top_tech = job_skills[:3] if job_skills else ["Software Engineering", "Web Architecture"]
        primary_tech = top_tech[0] if top_tech else "Software Architecture"

        # 2. Synthesize Role-Specific Technical Questions
        technical_questions = [
            {
                "question": f"How do you handle asynchronous execution and concurrency in {primary_tech}?",
                "key_answer_points": [
                    "Explain event loops, non-blocking I/O, and async/await syntax.",
                    "Discuss memory overhead differences between threads vs event loops.",
                    "Provide a real-world example of handling concurrent HTTP requests or database calls.",
                ],
            },
            {
                "question": f"What strategies do you use for database index optimization in production systems using {', '.join(job_skills[1:3]) if len(job_skills) > 1 else 'SQL databases'}?",
                "key_answer_points": [
                    "Explain B-Tree vs Hash vs GIN indexes.",
                    "Analyze EXPLAIN ANALYZE query execution plans.",
                    "Discuss compound indexes and avoiding index bloat on high-write tables.",
                ],
            },
            {
                "question": "How do you design REST API idempotency and error handling for critical user endpoints?",
                "key_answer_points": [
                    "Use Idempotency-Key headers for state-mutating requests.",
                    "Follow standard HTTP status codes (400, 401, 403, 404, 409, 429, 500).",
                    "Return consistent error payloads with machine-readable error codes.",
                ],
            },
        ]

        # 3. Categorized Coding Problems
        coding_questions = [
            {"title": "Implement an In-Memory LRU Cache with O(1) Operations", "difficulty": "Medium", "category": "Data Structures"},
            {"title": "Sliding Window Maximum Rate Limiter Algorithm", "difficulty": "Medium", "category": "Algorithms"},
            {"title": "Detect & Resolve Cyclic Dependencies in Dependency Graph", "difficulty": "Hard", "category": "Graphs & Recursion"},
        ]

        # 4. System Design Scenarios
        system_design_questions = [
            {
                "title": f"Design a High-Throughput Job Ingestion & Notification Engine for {company_name}",
                "key_components": ["API Gateway & Rate Limiter", "Message Queue (Kafka / RabbitMQ)", "Worker Pool Processors", "PostgreSQL / Redis Cache Layer"],
                "tradeoffs": "Consistency vs Eventual Availability during high ingestion spikes.",
            },
            {
                "title": "Design a Distributed Idempotent Payment & Transaction Processing Pipeline",
                "key_components": ["Idempotency Store", "Transactional Outbox Pattern", "Dead Letter Queues"],
                "tradeoffs": "Exactly-once processing vs At-least-once delivery guarantees.",
            },
        ]

        # 5. STAR Behavioral Prompts
        behavioral_questions = [
            {
                "question": "Describe a situation where you encountered an unexpected production incident. How did you diagnose and resolve it under pressure?",
                "star_framework": "Situation: Describe system outage. Task: your responsibility. Action: incident response & telemetry inspection. Result: MTTR & post-mortem learnings.",
            },
            {
                "question": "Tell me about a time you disagreed with a technical design decision proposed by a senior engineer.",
                "star_framework": "Situation: Architectural conflict. Task: evaluate trade-offs. Action: data-driven benchmark comparison. Result: consensus reached.",
            },
        ]

        # 6. Topics to Review & Company Tips
        topics_to_review = list(dict.fromkeys(job_skills + ["Data Structures", "System Design", "REST API Design", "Database Indexing"]))

        company_interview_tips = [
            f"Focus on practical problem solving and clean code structure relevant to {company_name}'s domain.",
            "Be prepared to discuss technical trade-offs, scalability bottlenecks, and testing strategies.",
            "Prepare 2-3 thoughtful questions about engineering team structure and deployment practices.",
        ]

        return {
            "job_id": job.id,
            "role": job_title,
            "company": company_name,
            "difficulty": "Medium-Hard",
            "technical_questions": technical_questions,
            "coding_questions": coding_questions,
            "system_design_questions": system_design_questions,
            "behavioral_questions": behavioral_questions,
            "topics_to_review": topics_to_review,
            "company_interview_tips": company_interview_tips,
            "estimated_preparation_time": "4 hours",
        }
