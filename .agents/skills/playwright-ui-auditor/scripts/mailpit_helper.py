#!/usr/bin/env python3
"""
Mailpit Helper Utility for Autonomous QA/QC Agents.
Provides headless inspection of emails, OTP tokens, and action links from Mailpit REST API.
Does not require browser navigation or external third-party dependencies.
"""

import sys
import json
import re
import argparse
import urllib.request
import urllib.error
import os

DEFAULT_BASE_URL = os.getenv("MAILPIT_URL", "http://localhost:8025")

def make_request(url: str, method: str = "GET", data: bytes = None) -> dict:
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Accept", "application/json")
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            content = resp.read()
            if content:
                return json.loads(content.decode("utf-8"))
            return {}
    except urllib.error.URLError as e:
        sys.stderr.write(f"Error connecting to Mailpit at {url}: {e}\n")
        return None

def get_messages(base_url: str, query: str = None, limit: int = 20) -> list:
    url = f"{base_url}/api/v1/messages?limit={limit}"
    if query:
        url += f"&query={urllib.parse.quote(query)}"
    res = make_request(url)
    if res and "messages" in res:
        return res["messages"]
    return []

def get_message_detail(base_url: str, message_id: str) -> dict:
    url = f"{base_url}/api/v1/message/{message_id}"
    return make_request(url)

def extract_tokens(text: str) -> dict:
    """Extract common verification tokens, 4-8 digit numeric OTPs, and URLs."""
    urls = re.findall(r'https?://[^\s<>"\']+', text)
    # 4 to 8 digit OTP codes (surrounded by whitespace, boundaries, or colons)
    otps = re.findall(r'\b(?:\d{6}|\d{4}|\d{8})\b', text)
    return {
        "urls": urls,
        "otps": list(dict.fromkeys(otps))
    }

def clear_all_messages(base_url: str) -> bool:
    url = f"{base_url}/api/v1/messages"
    res = make_request(url, method="DELETE")
    return res is not None

def main():
    parser = argparse.ArgumentParser(description="Headless Mailpit Inspection Tool for E2E QA")
    parser.add_argument("--url", default=DEFAULT_BASE_URL, help="Base URL of Mailpit service (default: %(default)s)")
    parser.add_argument("--action", choices=["list", "latest", "extract", "clear"], default="list",
                        help="Action to perform: list, latest, extract (OTP/URLs), or clear")
    parser.add_argument("--to", help="Filter messages by recipient email address")
    parser.add_argument("--subject", help="Filter messages by subject keyword")
    parser.add_argument("--limit", type=int, default=10, help="Maximum number of messages to inspect")
    parser.add_argument("--extract-type", choices=["any", "otp", "link"], default="any",
                        help="Specific token type to extract when using --action extract")

    args = parser.parse_args()

    if args.action == "clear":
        success = clear_all_messages(args.url)
        print(json.dumps({"success": success, "action": "clear"}))
        return

    query_parts = []
    if args.to:
        query_parts.append(f"to:{args.to}")
    if args.subject:
        query_parts.append(f"subject:{args.subject}")
    query = " ".join(query_parts) if query_parts else None

    messages = get_messages(args.url, query=query, limit=args.limit)

    if not messages:
        print(json.dumps({"status": "empty", "message": "No messages found matching criteria", "count": 0}))
        return

    if args.action == "list":
        results = []
        for msg in messages:
            results.append({
                "id": msg.get("ID"),
                "from": msg.get("From", {}).get("Address"),
                "to": [t.get("Address") for t in msg.get("To", [])],
                "subject": msg.get("Subject"),
                "date": msg.get("Created")
            })
        print(json.dumps({"count": len(results), "messages": results}, indent=2))
        return

    latest_msg_summary = messages[0]
    msg_id = latest_msg_summary.get("ID")
    detail = get_message_detail(args.url, msg_id)

    if not detail:
        print(json.dumps({"error": f"Failed to retrieve body for message ID {msg_id}"}))
        return

    body_text = detail.get("Text", "")
    body_html = detail.get("HTML", "")
    combined_body = f"{body_text}\n{body_html}"

    if args.action == "latest":
        print(json.dumps({
            "id": msg_id,
            "subject": detail.get("Subject"),
            "from": detail.get("From", {}).get("Address"),
            "to": [t.get("Address") for t in detail.get("To", [])],
            "text": body_text,
            "date": detail.get("Created")
        }, indent=2))
        return

    if args.action == "extract":
        extracted = extract_tokens(combined_body)
        res = {
            "id": msg_id,
            "subject": detail.get("Subject"),
            "recipient": [t.get("Address") for t in detail.get("To", [])],
            "otps": extracted["otps"],
            "urls": extracted["urls"]
        }
        if args.extract_type == "otp":
            res["target_otp"] = extracted["otps"][0] if extracted["otps"] else None
        elif args.extract_type == "link":
            res["target_link"] = extracted["urls"][0] if extracted["urls"] else None

        print(json.dumps(res, indent=2))

if __name__ == "__main__":
    main()
