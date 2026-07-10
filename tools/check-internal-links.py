from __future__ import annotations

import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parents[1]
HTML_FILES = sorted(
    path
    for path in ROOT.rglob("*.html")
    if ".git" not in path.parts and path.is_file()
)


class LinkParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[tuple[str, str]] = []
        self.anchors: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attrs_dict = {name.lower(): value for name, value in attrs if value is not None}
        if "id" in attrs_dict:
            self.anchors.add(attrs_dict["id"])
        if "name" in attrs_dict:
            self.anchors.add(attrs_dict["name"])

        for attr in ("href", "src", "action"):
            value = attrs_dict.get(attr)
            if value:
                self.links.append((attr, value.strip()))


def is_external_or_special(url: str) -> bool:
    if not url or url.startswith("#"):
        return False

    lowered = url.lower()
    if lowered.startswith(("mailto:", "tel:", "javascript:", "data:")):
        return True

    parsed = urlparse(url)
    if parsed.scheme in {"http", "https"}:
        return True

    return False


def target_for(source: Path, url: str) -> tuple[Path, str | None]:
    parsed = urlparse(url)
    path_text = unquote(parsed.path)
    fragment = unquote(parsed.fragment) if parsed.fragment else None

    if not path_text:
        return source, fragment

    if path_text.startswith("/"):
        candidate = ROOT / path_text.lstrip("/")
    else:
        candidate = source.parent / path_text

    if path_text.endswith("/"):
        candidate = candidate / "index.html"
    elif candidate.is_dir():
        candidate = candidate / "index.html"
    elif not candidate.suffix and not candidate.exists():
        index_candidate = candidate / "index.html"
        if index_candidate.exists():
            candidate = index_candidate

    return candidate.resolve(), fragment


def main() -> int:
    parsers: dict[Path, LinkParser] = {}
    failures: list[str] = []

    for html_file in HTML_FILES:
        parser = LinkParser()
        parser.feed(html_file.read_text(encoding="utf-8"))
        parsers[html_file.resolve()] = parser

    for source, parser in parsers.items():
        for attr, url in parser.links:
            if is_external_or_special(url):
                continue

            if url.startswith("#"):
                target = source
                fragment = unquote(url[1:])
            else:
                target, fragment = target_for(source, url)

            if not target.exists():
                failures.append(
                    f"{source.relative_to(ROOT)}: {attr}={url!r} points to missing {target.relative_to(ROOT) if ROOT in target.parents else target}"
                )
                continue

            if fragment and target.suffix.lower() == ".html":
                target_parser = parsers.get(target)
                if target_parser is None:
                    target_parser = LinkParser()
                    target_parser.feed(target.read_text(encoding="utf-8"))
                    parsers[target] = target_parser
                if fragment not in target_parser.anchors:
                    failures.append(
                        f"{source.relative_to(ROOT)}: {attr}={url!r} points to missing anchor #{fragment} in {target.relative_to(ROOT)}"
                    )

    if failures:
        print("Internal link check failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print(f"Internal link check passed for {len(HTML_FILES)} HTML files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
