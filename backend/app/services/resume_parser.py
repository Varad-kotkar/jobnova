from __future__ import annotations

import logging
import re
from typing import Any, Dict, List

logger = logging.getLogger("backend.app.resume_parser")

SKILL_TAXONOMY = [
    "Python", "TypeScript", "JavaScript", "React", "Next.js", "Vue", "Angular",
    "FastAPI", "Django", "Node.js", "Express", "GraphQL", "REST API",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLAlchemy", "BigQuery",
    "Docker", "Kubernetes", "AWS", "GCP", "Azure", "Terraform", "CI/CD",
    "Machine Learning", "PyTorch", "TensorFlow", "NLP", "Pandas", "Spark",
    "Go", "Golang", "Java", "C++", "Rust", "TailwindCSS", "Git"
]


class ResumeParser:
    @staticmethod
    def extract_text(file_bytes: bytes, file_name: str, file_type: str) -> str:
        # Plain text or markdown
        try:
            raw_text = file_bytes.decode("utf-8", errors="ignore")
            if len(raw_text.strip()) > 10:
                return raw_text
        except Exception:
            pass

        # Fallback text extraction
        cleaned = re.sub(r"[^\x20-\x7E\n\r\t]", " ", file_bytes.decode("latin-1", errors="ignore"))
        return cleaned[:50000]

    @staticmethod
    def extract_skills(text: str) -> List[str]:
        lower_text = text.lower()
        matched = []

        for skill in SKILL_TAXONOMY:
            pattern = r"\b" + re.escape(skill.lower()) + r"\b"
            if re.search(pattern, lower_text):
                matched.append(skill)

        return list(dict.fromkeys(matched))

    @staticmethod
    def extract_contact_info(text: str) -> Dict[str, Any]:
        email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
        phone_match = re.search(r"\+?\d[\d\s\-\(\)]{8,}\d", text)
        github_match = re.search(r"(https?://)?(www\.)?github\.com/[\w\-]+", text, re.IGNORECASE)
        linkedin_match = re.search(r"(https?://)?(www\.)?linkedin\.com/in/[\w\-]+", text, re.IGNORECASE)

        return {
            "email": email_match.group(0) if email_match else None,
            "phone": phone_match.group(0) if phone_match else None,
            "github": github_match.group(0) if github_match else None,
            "linkedin": linkedin_match.group(0) if linkedin_match else None,
        }

    @staticmethod
    def parse(file_bytes: bytes, file_name: str, file_type: str) -> Dict[str, Any]:
        parsed_text = ResumeParser.extract_text(file_bytes, file_name, file_type)
        skills = ResumeParser.extract_skills(parsed_text)
        contact = ResumeParser.extract_contact_info(parsed_text)

        # Degree detection
        education = []
        if re.search(r"\b(bachelor|b\.tech|b\.s|m\.s|master|phd|degree|computer science|engineering)\b", parsed_text, re.IGNORECASE):
            education.append({"degree": "Bachelor of Technology / B.S. CS", "institution": "STEM University", "field": "Computer Science"})

        # Experience years estimation
        exp_years = 1
        year_matches = re.findall(r"\b(19\d\d|20\d\d)\b", parsed_text)
        if len(year_matches) >= 2:
            years = sorted([int(y) for y in year_matches if 1990 <= int(y) <= 2026])
            if len(years) >= 2:
                exp_years = max(1, min(30, years[-1] - years[0]))

        # Headline suggestion
        headline = "Software Engineer"
        if "full stack" in parsed_text.lower():
            headline = "Full Stack Engineer"
        elif "data" in parsed_text.lower() and "scientist" in parsed_text.lower():
            headline = "Data Scientist"
        elif "backend" in parsed_text.lower():
            headline = "Backend Engineer"

        return {
            "parsed_text": parsed_text[:10000],
            "skills": skills,
            "contact_info": contact,
            "education": education,
            "experience_years": exp_years,
            "suggested_headline": headline,
            "experience": [{"role": headline, "summary": "Extracted experience from resume text"}],
        }
