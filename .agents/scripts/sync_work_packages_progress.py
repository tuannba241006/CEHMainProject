#!/usr/bin/env python3
"""
Campus Event Hub (CEH) — Phase 2 Work Packages Progress Synchronizer
===================================================================
Tự động đồng bộ tiến độ các Gói công việc (Work Packages: PKG-01 -> PKG-15)
trong file `docs/plans/Phase_2_Work_Packages.md`:

1. Đọc bảng Checklist tiến độ (`[x]` vs `[ ]`).
2. (Tùy chọn) Tự động phát hiện các báo cáo QA/QC PASS trong `docs/reports/` để đánh dấu hoàn thành.
3. Tự động tính toán tỷ lệ % hoàn thành và khối lượng Effort tích lũy.
4. Tự động cập nhật Mermaid Flowchart DAG:
   - Thêm gạch ngang `<s>...</s>`, huy hiệu `✅ HOÀN THÀNH (PASS)`, và class `:::completed`.
   - Trả về class gốc (`:::criticalPath`, `:::parallelTrack`, `:::finalHarness`) nếu chưa tick.
5. In báo cáo trực quan ra terminal.

Cách dùng:
    python .agents/scripts/sync_work_packages_progress.py
    python .agents/scripts/sync_work_packages_progress.py --auto-detect-reports
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# Cấu hình UTF-8 cho console stdout/stderr trên Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def locate_wp_file(project_root: Path) -> Path:
    wp_path = project_root / "docs" / "plans" / "Phase_2_Work_Packages.md"
    if not wp_path.is_file():
        raise FileNotFoundError(f"Không tìm thấy file: {wp_path}")
    return wp_path


def sync_progress(wp_file: Path, auto_detect: bool = False) -> int:
    raw_content = wp_file.read_text(encoding="utf-8")
    is_crlf = "\r\n" in raw_content
    content = raw_content.replace("\r\n", "\n")

    project_root = wp_file.parent.parent.parent
    reports_dir = project_root / "docs" / "reports"

    # Pattern phân tích từng hàng checklist (chấp nhận cả `**PKG-01**` lẫn `**`PKG-01`**`)
    row_pattern = re.compile(
        r"^\|\s*\[(?P<status>[ xX])\]\s*\|\s*\*\*`?(?P<pkg_id>PKG-\d+)`?\*\*\s*\|\s*(?P<name>[^|]+)\s*\|\s*(?P<wave>[^|]+)\s*\|\s*\*\*(?P<effort>[\d\.]+)d\*\*\s*\|\s*(?P<category>[^|]+)\s*\|\s*(?P<report>[^|]+)\s*\|\s*(?P<notes>[^|]+)\s*\|",
        re.MULTILINE,
    )

    matches = list(row_pattern.finditer(content))
    if not matches:
        print("[!] Không tìm thấy bảng checklist tiến độ trong file.")
        return 1

    packages = []
    for m in matches:
        pkg_id = m.group("pkg_id")
        checked = m.group("status").lower() == "x"
        effort = float(m.group("effort"))
        category = m.group("category").strip()
        name = m.group("name").strip()
        wave = m.group("wave").strip()
        report = m.group("report").strip()
        notes = m.group("notes").strip()

        # Tùy chọn tự động phát hiện report PASS
        if auto_detect and not checked:
            report_file = reports_dir / f"{pkg_id}_QA_QC_REPORT.md"
            if report_file.is_file():
                rep_text = report_file.read_text(encoding="utf-8")
                if "VERDICT" in rep_text and "PASS" in rep_text:
                    checked = True
                    report = f"[`{pkg_id}_QA_QC_REPORT.md`](../reports/{pkg_id}_QA_QC_REPORT.md)"
                    notes = "✅ **PASS** (Tự động phát hiện QA/QC Report)"

        packages.append({
            "match": m,
            "pkg_id": pkg_id,
            "node_id": pkg_id.replace("-", ""),
            "checked": checked,
            "name": name,
            "wave": wave,
            "effort": effort,
            "category": category,
            "report": report,
            "notes": notes,
        })

    # Tính toán các chỉ số thống kê
    total_pkgs = len(packages)
    completed_pkgs = sum(1 for p in packages if p["checked"])
    total_effort = sum(p["effort"] for p in packages)
    completed_effort = sum(p["effort"] for p in packages if p["checked"])
    total_cp_effort = sum(p["effort"] for p in packages if "Critical" in p["category"])
    completed_cp_effort = sum(p["effort"] for p in packages if p["checked"] and "Critical" in p["category"])

    pct_pkgs = (completed_pkgs / total_pkgs * 100) if total_pkgs > 0 else 0
    pct_effort = (completed_effort / total_effort * 100) if total_effort > 0 else 0
    pct_cp = (completed_cp_effort / total_cp_effort * 100) if total_cp_effort > 0 else 0

    next_pkg = next((p for p in packages if not p["checked"]), None)
    next_info = (
        f"**`{next_pkg['pkg_id']}`** ({next_pkg['wave']} - {next_pkg['name']})"
        if next_pkg
        else "🎉 **TẤT CẢ CÁC GÓI ĐÃ HOÀN THÀNH**"
    )

    # 1. Cập nhật các hàng checklist trong bảng nếu có auto-detect
    for p in packages:
        status_char = "x" if p["checked"] else " "
        old_row = p["match"].group(0)
        new_row = (
            f"| [{status_char}] | **`{p['pkg_id']}`** | {p['name']} | {p['wave']} | "
            f"**{p['effort']:.1f}d** | {p['category']} | {p['report']} | {p['notes']} |"
        )
        content = content.replace(old_row, new_row)

    # 2. Cập nhật khối blockquote tổng quan
    overview_pattern = re.compile(
        r">(?:[ \t]*\n>)?\s*\*\*Trạng thái tổng quan Phase 2\*\*:\s*\n"
        r">\s*-\s*\*\*Tiến độ gói\*\*:[^\n]+\n"
        r">\s*-\s*\*\*Khối lượng Effort\*\*:[^\n]+\n"
        r">\s*-\s*\*\*Gói đang kích hoạt / Kế tiếp\*\*:[^\n]+",
        re.MULTILINE,
    )
    new_overview = (
        f"> **Trạng thái tổng quan Phase 2**:\n"
        f"> - **Tiến độ gói**: **{completed_pkgs} / {total_pkgs} gói hoàn thành ({pct_pkgs:.1f}%)**\n"
        f"> - **Khối lượng Effort**: **{completed_effort:.1f}d / {total_effort:.1f}d ({pct_effort:.1f}%)** hoàn thành "
        f"(Đường găng đã hoàn thành: **{completed_cp_effort:.1f}d / {total_cp_effort:.1f}d = {pct_cp:.1f}%**)\n"
        f"> - **Gói đang kích hoạt / Kế tiếp**: {next_info}"
    )
    content = overview_pattern.sub(new_overview, content)

    # 3. Cập nhật hàng footer TỔNG của bảng
    footer_pattern = re.compile(
        r"^\|\s*\*\*TỔNG\*\*\s*\|[^\n]+\|$",
        re.MULTILINE,
    )
    new_footer = (
        f"| **TỔNG** | **{total_pkgs} Gói** | **Đường găng: 44.0d (Single-dev: 55.0d)** | **12 Waves** | "
        f"**{total_effort:.1f}d** | — | **{completed_pkgs}/{total_pkgs} Gói có Báo cáo QA** | "
        f"**Hoàn thành: {completed_pkgs}/{total_pkgs} ({pct_pkgs:.1f}%) | Effort: {completed_effort:.1f}d/{total_effort:.1f}d ({pct_effort:.1f}%)** |"
    )
    content = footer_pattern.sub(new_footer, content)

    # 4. Đảm bảo classDef completed tồn tại trong mermaid
    if "classDef completed" not in content:
        content = content.replace(
            "classDef finalHarness",
            "classDef completed fill:#f0fdf4,stroke:#16a34a,stroke-width:3px,color:#166534,font-weight:bold;\n    classDef finalHarness",
        )

    # 5. Cập nhật từng Node trong Mermaid Flowchart
    # Node pattern: PKG01["..."]:::className
    for p in packages:
        node_id = p["node_id"]
        pkg_id = p["pkg_id"]
        clean_name = p["name"]
        
        # Quyết định class mặc định khi chưa complete
        if p["pkg_id"] == "PKG-15":
            default_class = "finalHarness"
        elif "Song song" in p["category"]:
            default_class = "parallelTrack"
        else:
            default_class = "criticalPath"

        # Regex tìm node tương ứng trong mermaid: PKG01["..."]:::...
        node_regex = re.compile(
            rf'({node_id}\["\s*)(?:<s>)?\[{pkg_id}\](?:</s>)?\s*([^"]+?)("\s*:::\s*)(\w+)',
            re.MULTILINE,
        )

        match_node = node_regex.search(content)
        if match_node:
            inner_text = match_node.group(2)
            # Lọc bỏ các phần HTML bổ sung cũ như ✅ HOÀN THÀNH
            inner_lines = [
                line.strip()
                for line in inner_text.split("<br/>")
                if "HOÀN THÀNH" not in line and line.strip()
            ]
            raw_title = inner_lines[0] if inner_lines else clean_name
            # Lấy thông số thời lượng và wave nếu có
            wave_info = f"<b>{p['effort']:.1f}d</b> | {p['wave']}"
            if len(inner_lines) > 1 and ("<b>" in inner_lines[1] or "Wave" in inner_lines[1]):
                wave_info = inner_lines[1]

            if p["checked"]:
                new_node_text = (
                    f'{node_id}["<s>[{pkg_id}] {raw_title}</s>'
                    f'<br/>{wave_info}<br/>✅ <b>HOÀN THÀNH (PASS)</b>"]:::completed'
                )
            else:
                new_node_text = (
                    f'{node_id}["[{pkg_id}] {raw_title}'
                    f'<br/>{wave_info}"]:::{default_class}'
                )

            full_old = match_node.group(0)
            content = content.replace(full_old, new_node_text)

    # Khôi phục line endings ban đầu
    final_output = content.replace("\n", "\r\n") if is_crlf else content
    wp_file.write_text(final_output, encoding="utf-8")

    # In kết quả trực quan
    bar_len = 25
    filled = int(bar_len * (pct_pkgs / 100))
    bar = "█" * filled + "░" * (bar_len - filled)

    print("\n" + "=" * 65)
    print(" Campus Event Hub — Phase 2 Progress Synchronizer")
    print("=" * 65)
    print(f"File mục tiêu : {wp_file.relative_to(project_root)}")
    print(f"Tiến độ Gói   : [{bar}] {completed_pkgs}/{total_pkgs} ({pct_pkgs:.1f}%)")
    print(f"Tiến độ Effort: {completed_effort:.1f}d / {total_effort:.1f}d ({pct_effort:.1f}%)")
    print(f"Đường găng CP : {completed_cp_effort:.1f}d / {total_cp_effort:.1f}d ({pct_cp:.1f}%)")
    print("-" * 65)
    for p in packages:
        icon = "[x]" if p["checked"] else "[ ]"
        badge = "COMPLETED" if p["checked"] else "PENDING"
        print(f"  {icon} {p['pkg_id']:<7} | {badge:<9} | {p['wave']:<7} | {p['effort']:>4.1f}d | {p['name']}")
    print("-" * 65)
    print(f"Gói kế tiếp   : {next_info}")
    print("=" * 65)
    print("🎉 Đồng bộ thành công Checklist và Mermaid DAG Flowchart!\n")

    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Đồng bộ tiến độ Phase 2 Work Packages và Mermaid DAG")
    parser.add_argument(
        "--auto-detect-reports",
        action="store_true",
        help="Tự động kiểm tra file docs/reports/{PKG-ID}_QA_QC_REPORT.md để tick [x]",
    )
    args = parser.parse_args()

    current = Path(__file__).resolve()
    project_root = current.parent.parent.parent
    wp_file = locate_wp_file(project_root)

    return sync_progress(wp_file, auto_detect=args.auto_detect_reports)


if __name__ == "__main__":
    raise SystemExit(main())
