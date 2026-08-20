"""Medical report analysis service.
Extracts text from PDFs and generates AI-powered summaries."""
import logging
from pathlib import Path
from typing import Any, Dict

logger = logging.getLogger(__name__)

DISCLAIMER = (
    "This AI-generated summary is for educational purposes only. "
    "It does NOT replace professional medical interpretation of your reports. "
    "Please consult a qualified healthcare provider for accurate diagnosis and treatment."
)


def analyze_report(file_content: bytes, file_ext: str, filename: str) -> Dict[str, Any]:
    """Analyze an uploaded medical report."""
    extracted_text = ""

    if file_ext == "pdf":
        extracted_text = _extract_pdf(file_content)
    elif file_ext == "txt":
        extracted_text = file_content.decode("utf-8", errors="replace")
    elif file_ext in ("png", "jpg", "jpeg"):
        return {
            "summary": "Image-based report analysis requires OCR setup. Please upload a PDF or text file for analysis.",
            "extracted_info": {"filename": filename, "type": "image"},
            "explanations": [],
            "disclaimer": DISCLAIMER,
        }
    else:
        return {
            "summary": "Unsupported file format.",
            "extracted_info": {},
            "explanations": [],
            "disclaimer": DISCLAIMER,
        }

    if not extracted_text.strip():
        return {
            "summary": "Could not extract text from the uploaded file. The file may be image-based or empty.",
            "extracted_info": {"filename": filename},
            "explanations": [],
            "disclaimer": DISCLAIMER,
        }

    return _generate_analysis(extracted_text, filename)


def _extract_pdf(content: bytes) -> str:
    """Extract text from PDF bytes using pdfplumber."""
    try:
        import pdfplumber
        import io
        text_parts = []
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text_parts.append(page_text)
        return "\n".join(text_parts)
    except ImportError:
        logger.warning("pdfplumber not installed; cannot extract PDF text.")
        return ""
    except Exception as exc:
        logger.error("PDF extraction error: %s", exc)
        return ""


def _generate_analysis(text: str, filename: str) -> Dict[str, Any]:
    """Generate analysis from extracted text. Uses LLM if available, otherwise keyword-based."""
    from app.core.config import settings

    # Extract key information with simple heuristics
    extracted_info: Dict[str, Any] = {"filename": filename}
    explanations = []

    lines = text.strip().split("\n")
    extracted_info["total_lines"] = len(lines)
    extracted_info["text_preview"] = text[:500] + ("..." if len(text) > 500 else "")

    # Try to identify common report elements
    text_lower = text.lower()
    report_types = ["blood", "urine", "x-ray", "mri", "ct scan", "ecg", "echo", "pathology", "lipid", "thyroid", "sugar", "glucose", "hba1c", "cbc", "liver", "kidney", "cholesterol"]
    found_types = [rt for rt in report_types if rt in text_lower]
    if found_types:
        extracted_info["possible_report_types"] = found_types
        explanations.append(f"This appears to be related to: {', '.join(found_types)}")

    # Look for abnormal/normal indicators
    abnormal_count = text_lower.count("abnormal") + text_lower.count("high") + text_lower.count("low") + text_lower.count("critical")
    if abnormal_count > 0:
        extracted_info["potential_flags"] = abnormal_count
        explanations.append("Some values may be outside normal ranges. Please consult your doctor for interpretation.")

    # Try LLM-based analysis if OpenAI is configured
    if settings.is_openai_configured:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)

            prompt = f"""You are a medical report assistant. Analyze the following extracted text from a medical report.
Provide a clear, patient-friendly summary. Highlight any notable findings.
NEVER diagnose. NEVER prescribe. Always recommend consulting a doctor.

Report text:
{text[:2000]}

Provide your response as plain text (not JSON). Include sections: Summary, Key Findings, Recommendations."""

            response = client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a helpful medical report assistant. Provide educational summaries only."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=600,
            )
            summary = response.choices[0].message.content or "No summary generated."
            return {
                "summary": summary,
                "extracted_info": extracted_info,
                "explanations": explanations,
                "disclaimer": DISCLAIMER,
            }
        except Exception as exc:
            logger.error("LLM report analysis failed: %s", exc)

    # Fallback summary
    summary = f"Report '{filename}' has been processed. {len(lines)} lines of text were extracted."
    if found_types:
        summary += f" The report appears related to: {', '.join(found_types)}."
    summary += "\n
**Note:** For a detailed AI analysis, please configure the OpenAI API key."
    summary += "\n
Please consult your healthcare provider for accurate interpretation of this report."

    return {
        "summary": summary,
        "extracted_info": extracted_info,
        "explanations": explanations,
        "disclaimer": DISCLAIMER,
    }
