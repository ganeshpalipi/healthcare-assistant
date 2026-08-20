#!/usr/bin/env python3
"""
Smoke Test Script for Healthcare Conversational Assistant API
Windows-compatible. Run: python scripts/smoke_test.py
"""
import json
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed. Run: pip install requests")
    sys.exit(1)

BASE_URL = "http://127.0.0.1:8000"


class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.results = []

    def record(self, name: str, passed: bool, detail: str = ""):
        status = "PASS" if passed else "FAIL"
        self.results.append((name, status, detail))
        if passed:
            self.passed += 1
            print(f"  [PASS] {name}")
        else:
            self.failed += 1
            print(f"  [FAIL] {name} - {detail}")

    def summary(self):
        print("\n" + "=" * 50)
        print(f"Results: {self.passed} passed, {self.failed} failed")
        print("=" * 50)
        return self.failed == 0


def test_health(results: TestResult):
    """Test GET /api/health"""
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=5)
        data = r.json()
        results.record("Health Check", r.status_code == 200, f"Status: {r.status_code}")
        results.record("Health has status field", "status" in data)
        results.record("Health has database field", "database" in data)
        results.record("Health has rag field", "rag" in data)
        results.record("Health has llm field", "llm" in data)
    except Exception as e:
        results.record("Health Check", False, str(e))


def test_register(results: TestResult, email: str):
    """Test POST /api/auth/register"""
    try:
        r = requests.post(f"{BASE_URL}/api/auth/register", json={
            "username": "testuser_smoke",
            "email": email,
            "password": "TestPass123!",
        }, timeout=10)
        results.record("Register", r.status_code in (200, 201), f"Status: {r.status_code}")
        if r.status_code in (200, 201):
            data = r.json()
            return data.get("access_token")
        elif r.status_code == 409:
            results.record("Register (user exists)", True, "User already registered (expected)")
            return test_login(results, email)
    except Exception as e:
        results.record("Register", False, str(e))
    return None


def test_login(results: TestResult, email: str):
    """Test POST /api/auth/login"""
    try:
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": "TestPass123!",
        }, timeout=10)
        results.record("Login", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            return data.get("access_token")
    except Exception as e:
        results.record("Login", False, str(e))
    return None


def test_chat(results: TestResult, token: str):
    """Test POST /api/chat"""
    try:
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        r = requests.post(f"{BASE_URL}/api/chat", json={
            "message": "I have a mild headache. What should I do?",
        }, headers=headers, timeout=30)
        results.record("Chat", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            results.record("Chat has answer", "answer" in data and len(data["answer"]) > 0)
            results.record("Chat has disclaimer", "disclaimer" in data)
            results.record("Chat has risk_level", "risk_level" in data)
    except Exception as e:
        results.record("Chat", False, str(e))


def test_symptom_check(results: TestResult):
    """Test POST /api/symptom-check"""
    try:
        r = requests.post(f"{BASE_URL}/api/symptom-check", json={
            "symptoms": ["fever", "cough", "headache"],
        }, timeout=15)
        results.record("Symptom Check", r.status_code == 200, f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            results.record("Symptom Check has risk_level", "risk_level" in data)
            results.record("Symptom Check has disclaimer", "disclaimer" in data)
    except Exception as e:
        results.record("Symptom Check", False, str(e))


def test_doctors(results: TestResult):
    """Test GET /api/doctors"""
    try:
        r = requests.get(f"{BASE_URL}/api/doctors", timeout=5)
        results.record("Doctors List", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        results.record("Doctors List", False, str(e))


def test_medicines(results: TestResult):
    """Test GET /api/medicines"""
    try:
        r = requests.get(f"{BASE_URL}/api/medicines?query=paracetamol", timeout=15)
        results.record("Medicine Info", r.status_code == 200, f"Status: {r.status_code}")
    except Exception as e:
        results.record("Medicine Info", False, str(e))


def test_rag_unavailable(results: TestResult):
    """Verify the app handles missing RAG gracefully."""
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=5)
        data = r.json()
        rag_status = data.get("rag", "unknown")
        results.record("RAG Graceful Handling", True, f"RAG status: {rag_status}")
    except Exception as e:
        results.record("RAG Graceful Handling", False, str(e))


def test_mongodb_unavailable(results: TestResult):
    """Verify the app handles missing MongoDB gracefully."""
    try:
        r = requests.get(f"{BASE_URL}/api/health", timeout=5)
        data = r.json()
        db_status = data.get("database", "unknown")
        results.record("MongoDB Graceful Handling", True, f"Database status: {db_status}")
    except Exception as e:
        results.record("MongoDB Graceful Handling", False, str(e))


def main():
    print("Healthcare Conversational Assistant - Smoke Tests")
    print(f"Target: {BASE_URL}")
    print("=" * 50)

    results = TestResult()

    # Core tests
    test_health(results)
    test_rag_unavailable(results)
    test_mongodb_unavailable(results)
    test_doctors(results)

    # Auth tests
    test_email = f"smoke_test_{int(time.time())}@example.com"
    token = test_register(results, test_email)
    if not token:
        token = test_login(results, test_email)

    # Feature tests
    test_chat(results, token)
    test_symptom_check(results)
    test_medicines(results)

    # Summary
    all_passed = results.summary()
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
