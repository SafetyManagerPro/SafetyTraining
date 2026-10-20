#!/usr/bin/env python3
"""Verify all independently authored GP04 SVG assets with a real XML parser."""
from pathlib import Path
from xml.etree import ElementTree as ET

root = Path(__file__).resolve().parents[1] / "apps" / "training" / "assets"
images = sorted(root.glob("gp04-*.svg"))
assert len(images) == 54, f"Expected 54 GP04 assets, found {len(images)}"
svg_ns = "{http://www.w3.org/2000/svg}"
for path in images:
    source = path.read_text(encoding="utf-8")
    parsed = ET.fromstring(source)
    assert parsed.tag == svg_ns + "svg", path
    assert parsed.attrib.get("viewBox") == "0 0 1280 720", path
    assert parsed.attrib.get("role") == "img", path
    assert parsed.attrib.get("aria-label"), path
    assert not any(element.tag == svg_ns + "image" for element in parsed.iter()), path
    assert source.count("DA EVITARE") == 1, path
    assert source.count("COMPORTAMENTO SICURO") == 1, path
print(f"Validated {len(images)} original GP04 SVG documents with XML parser.")
