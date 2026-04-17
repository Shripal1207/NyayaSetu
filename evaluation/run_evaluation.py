import csv
import json
import re
import time
from pathlib import Path

import matplotlib.pyplot as plt
import requests


API_URL = "http://localhost:5001/api/chat"
OUTPUT_DIR = Path(__file__).resolve().parent

TEST_QUERIES = [
    {
        "id": "Q1",
        "category": "Criminal",
        "query": "Someone cheated me in an online payment scam. Which section can I file under?",
        "expected_keywords": ["420", "cheating", "ipc", "bns"],
    },
    {
        "id": "Q2",
        "category": "Criminal",
        "query": "My bike was stolen. What IPC section applies and how to file FIR?",
        "expected_keywords": ["379", "theft", "ipc", "fir", "bns"],
    },
    {
        "id": "Q3",
        "category": "Criminal",
        "query": "I was physically assaulted by my neighbor. Which legal section is relevant?",
        "expected_keywords": ["323", "assault", "hurt", "ipc", "bns"],
    },
    {
        "id": "Q4",
        "category": "Consumer",
        "query": "E-commerce app delivered defective product and denied refund. How can I file a consumer case?",
        "expected_keywords": ["consumer", "complaint", "commission", "act"],
    },
    {
        "id": "Q5",
        "category": "Cyber",
        "query": "I am getting threats on WhatsApp. What legal provisions can I use?",
        "expected_keywords": ["threat", "506", "ipc", "it act", "bns"],
    },
    {
        "id": "Q6",
        "category": "Property",
        "query": "Builder took money but did not give possession. What legal case can I file?",
        "expected_keywords": ["consumer", "rera", "fraud", "complaint"],
    },
    {
        "id": "Q7",
        "category": "Family",
        "query": "What can a woman do legally in a domestic violence case?",
        "expected_keywords": ["domestic violence", "protection", "act", "complaint"],
    },
    {
        "id": "Q8",
        "category": "Employment",
        "query": "My employer has not paid salary for 3 months. What legal remedy is available?",
        "expected_keywords": ["labour", "salary", "complaint", "act"],
    },
    {
        "id": "Q9",
        "category": "Defamation",
        "query": "Can I file a case for false allegations on social media?",
        "expected_keywords": ["defamation", "499", "500", "ipc", "bns"],
    },
    {
        "id": "Q10",
        "category": "Police Procedure",
        "query": "Explain FIR filing process and what evidence should I carry.",
        "expected_keywords": ["fir", "police", "complaint", "evidence", "crpc", "bnss"],
    },
]


def clean_text(text: str) -> str:
    return re.sub(r"<br\\s*/?>", "\n", text or "", flags=re.I).strip()


def contains_section_reference(text: str) -> bool:
    pattern = r"(section\\s+\\d+|ipc|crpc|cpc|bns|bnss|consumer protection act|it act)"
    return bool(re.search(pattern, text, flags=re.I))


def contains_lawyer_disclaimer(text: str) -> bool:
    return bool(re.search(r"(consult\\s+a\\s+lawyer|advocate|legal advice)", text, flags=re.I))


def keyword_score(text: str, expected_keywords: list[str]) -> float:
    text_low = text.lower()
    hits = sum(1 for kw in expected_keywords if kw.lower() in text_low)
    return hits / max(1, len(expected_keywords))


def run():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    rows = []

    for item in TEST_QUERIES:
        start = time.perf_counter()
        ok = True
        status_code = None
        error = ""
        response_text = ""

        try:
            r = requests.post(API_URL, json={"msg": item["query"]}, timeout=60)
            status_code = r.status_code
            body = r.json() if r.headers.get("content-type", "").startswith("application/json") else {}
            response_text = clean_text(body.get("response", ""))
            if status_code >= 400:
                ok = False
                error = body.get("error") or body.get("response") or f"HTTP {status_code}"
        except Exception as exc:
            ok = False
            error = str(exc)

        latency_ms = (time.perf_counter() - start) * 1000
        section_ref = contains_section_reference(response_text)
        disclaimer = contains_lawyer_disclaimer(response_text)
        kscore = keyword_score(response_text, item["expected_keywords"])

        rows.append(
            {
                "query_id": item["id"],
                "category": item["category"],
                "query": item["query"],
                "status_code": status_code,
                "success": int(ok),
                "latency_ms": round(latency_ms, 2),
                "section_reference_present": int(section_ref),
                "lawyer_disclaimer_present": int(disclaimer),
                "keyword_score": round(kscore, 3),
                "response": response_text,
                "error": error,
            }
        )

        print(f"{item['id']} | success={ok} | latency={latency_ms:.1f} ms")

    metrics = compute_metrics(rows)
    save_outputs(rows, metrics)
    plot_graphs(rows, metrics)

    print("\nEvaluation complete.")
    print(json.dumps(metrics, indent=2))


def compute_metrics(rows: list[dict]) -> dict:
    n = len(rows)
    success = sum(r["success"] for r in rows)
    availability = success / n if n else 0.0
    avg_latency = sum(r["latency_ms"] for r in rows) / n if n else 0.0
    section_rate = sum(r["section_reference_present"] for r in rows) / n if n else 0.0
    disclaimer_rate = sum(r["lawyer_disclaimer_present"] for r in rows) / n if n else 0.0
    keyword_avg = sum(r["keyword_score"] for r in rows) / n if n else 0.0

    by_cat = {}
    for r in rows:
        cat = r["category"]
        by_cat.setdefault(cat, []).append(r["keyword_score"])
    category_keyword_accuracy = {k: round(sum(v) / len(v), 3) for k, v in by_cat.items()}

    return {
        "total_queries": n,
        "successful_queries": success,
        "availability_rate": round(availability, 3),
        "avg_latency_ms": round(avg_latency, 2),
        "section_reference_rate": round(section_rate, 3),
        "lawyer_disclaimer_rate": round(disclaimer_rate, 3),
        "mean_keyword_accuracy": round(keyword_avg, 3),
        "category_keyword_accuracy": category_keyword_accuracy,
    }


def save_outputs(rows: list[dict], metrics: dict):
    csv_path = OUTPUT_DIR / "query_outputs.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    metrics_path = OUTPUT_DIR / "metrics_summary.json"
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    table_path = OUTPUT_DIR / "paper_metrics_table.csv"
    table_rows = [
        ("Availability Rate", "Successful responses / total queries", f"{metrics['availability_rate'] * 100:.1f}%"),
        ("Average Latency (ms)", "Mean response time across all queries", f"{metrics['avg_latency_ms']:.2f}"),
        ("Section Reference Rate", "Responses mentioning legal section/act", f"{metrics['section_reference_rate'] * 100:.1f}%"),
        ("Lawyer Disclaimer Rate", "Responses advising consultation with lawyer", f"{metrics['lawyer_disclaimer_rate'] * 100:.1f}%"),
        ("Mean Keyword Accuracy", "Average expected-keyword overlap", f"{metrics['mean_keyword_accuracy'] * 100:.1f}%"),
    ]
    with table_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Metric", "Definition", "Value"])
        writer.writerows(table_rows)


def plot_graphs(rows: list[dict], metrics: dict):
    # Graph 1: Query-wise latency
    plt.figure(figsize=(10, 4))
    x = [r["query_id"] for r in rows]
    y = [r["latency_ms"] for r in rows]
    plt.plot(x, y, marker="o")
    plt.title("Graph 1: Query-wise Response Latency")
    plt.xlabel("Query ID")
    plt.ylabel("Latency (ms)")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "graph_latency.png", dpi=200)
    plt.close()

    # Graph 2: Category keyword accuracy
    cats = list(metrics["category_keyword_accuracy"].keys())
    vals = [metrics["category_keyword_accuracy"][c] * 100 for c in cats]
    plt.figure(figsize=(10, 4))
    plt.bar(cats, vals)
    plt.title("Graph 2: Category-wise Keyword Accuracy")
    plt.xlabel("Category")
    plt.ylabel("Keyword Accuracy (%)")
    plt.xticks(rotation=25, ha="right")
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "graph_category_accuracy.png", dpi=200)
    plt.close()

    # Graph 3: Binary quality indicators
    labels = ["Availability", "Section Reference", "Lawyer Disclaimer"]
    vals = [
        metrics["availability_rate"] * 100,
        metrics["section_reference_rate"] * 100,
        metrics["lawyer_disclaimer_rate"] * 100,
    ]
    plt.figure(figsize=(7, 4))
    plt.bar(labels, vals)
    plt.title("Graph 3: System-level Quality Indicators")
    plt.ylabel("Rate (%)")
    plt.ylim(0, 100)
    plt.tight_layout()
    plt.savefig(OUTPUT_DIR / "graph_quality_indicators.png", dpi=200)
    plt.close()


if __name__ == "__main__":
    run()
