#!/usr/bin/env python3
"""Sync public GitHub profile stats into rollycalma.com.

The profile README remains the source of truth for headline contribution
counts. This script mirrors those numbers into the domain and refreshes visible
star labels for selected contributed repositories.
"""

from __future__ import annotations

import base64
import datetime as dt
import json
import os
import re
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
PROFILE_API = "https://api.github.com/repos/Ghraven/Ghraven/contents/README.md"

# Public portfolio hard guard. Keep these topics out of generated public copy.
FORBIDDEN_PUBLIC_TERMS = (
    "TradingAgents",
    "TauricResearch/TradingAgents",
    "crypto",
    "trading",
    "forex",
    "binance",
    "ccxt",
    "stocktwits",
)


def github_headers() -> dict[str, str]:
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "rollycalma-portfolio-stats-sync",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def fetch_json(url: str) -> dict:
    request = urllib.request.Request(url, headers=github_headers())
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"GitHub request failed {exc.code} for {url}: {body}") from exc


def fetch_profile_readme() -> str:
    payload = fetch_json(PROFILE_API)
    encoded = payload.get("content", "")
    if not encoded:
        raise RuntimeError("Profile README content was empty.")
    return base64.b64decode(encoded).decode("utf-8")


def parse_profile_stats(markdown: str) -> dict[str, str]:
    patterns = {
        "prs": r"badge/PRs_opened-(\d+)-",
        "merged": r"badge/Merged-(\d+)-",
        "repos": r"badge/Repos_contributed-(\d+)-",
        "stars": r"badge/Contributed_to_repos_with-([0-9.]+k%2B|[0-9.]+k\+|[0-9]+%2B|[0-9]+\+)_",
    }
    stats: dict[str, str] = {}
    for key, pattern in patterns.items():
        match = re.search(pattern, markdown)
        if not match:
            raise RuntimeError(f"Could not parse {key} from profile README badges.")
        stats[key] = match.group(1).replace("%2B", "+")
    return stats


def format_stars(count: int) -> str:
    if count >= 100_000:
        return f"{round(count / 1000):.0f}k"
    if count >= 10_000:
        return f"{round(count / 1000):.0f}k"
    if count >= 1_000:
        value = count / 1000
        return f"{value:.1f}k" if value < 10 else f"{round(value):.0f}k"
    return str(count)


def selected_repo_stars(html: str) -> dict[str, str]:
    repos = sorted(set(re.findall(r'data-repo-stars="([^"]+)"', html)))
    stars: dict[str, str] = {}
    for repo in repos:
        lower = repo.lower()
        if any(term.lower() in lower for term in FORBIDDEN_PUBLIC_TERMS):
            raise RuntimeError(f"Forbidden public repo matched sync list: {repo}")
        data = fetch_json(f"https://api.github.com/repos/{repo}")
        stars[repo] = f"\u2b50 {format_stars(int(data.get('stargazers_count', 0)))}"
    return stars


def replace_all(pattern: str, repl: str, text: str) -> str:
    new_text, count = re.subn(pattern, repl, text)
    if count == 0:
        raise RuntimeError(f"No replacements made for pattern: {pattern}")
    return new_text


def update_html(html: str, stats: dict[str, str], stars: dict[str, str]) -> str:
    for key, value in stats.items():
        html = replace_all(
            rf'(<span[^>]*data-stat="{re.escape(key)}"[^>]*>)[^<]*(</span>)',
            rf"\g<1>{value}\2",
            html,
        )

    html = replace_all(
        r"Self-taught, \d+ OSS PRs merged",
        f"Self-taught, {stats['merged']} OSS PRs merged",
        html,
    )

    today = dt.date.today().isoformat()
    pretty_date = dt.date.today().strftime("%B %-d, %Y") if os.name != "nt" else dt.date.today().strftime("%B %#d, %Y")
    html = replace_all(
        r'(<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"ProfilePage","dateModified":")\d{4}-\d{2}-\d{2}(")',
        rf"\g<1>{today}\2",
        html,
    )
    html = replace_all(
        r'(<p class="oss-updated" data-sync-note>)[^<]*(</p>)',
        rf"\g<1>Contribution stats synced with GitHub profile on {pretty_date}.\2",
        html,
    )

    for repo, label in stars.items():
        html = replace_all(
            rf'(<span class="oss-repo-stars" data-repo-stars="{re.escape(repo)}">)[^<]*(</span>)',
            rf"\g<1>{label}\2",
            html,
        )

    lower_html = html.lower()
    forbidden_hits = [term for term in FORBIDDEN_PUBLIC_TERMS if term.lower() in lower_html]
    if forbidden_hits:
        raise RuntimeError(f"Forbidden public terms found after sync: {', '.join(forbidden_hits)}")

    return html


def main() -> int:
    original_bytes = INDEX.read_bytes()
    newline = "\r\n" if b"\r\n" in original_bytes else "\n"
    html = original_bytes.decode("utf-8")
    stats = parse_profile_stats(fetch_profile_readme())
    stars = selected_repo_stars(html)
    updated = update_html(html, stats, stars)

    if updated == html:
        print("Portfolio stats already current.")
        return 0

    normalized = updated.replace("\r\n", "\n").replace("\n", newline)
    INDEX.write_text(normalized, encoding="utf-8", newline="")
    print("Updated portfolio stats:")
    print(json.dumps({"stats": stats, "repo_stars": stars}, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
