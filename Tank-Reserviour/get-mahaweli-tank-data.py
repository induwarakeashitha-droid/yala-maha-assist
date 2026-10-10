import pdfplumber
import json
import re
import os
import sys

MONTH_MAP = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
}


def clean_text_precision(val):
    #Fixes kerning/spacing issues in text, dates, and numbers.
    if val is None:
        return ""
    text = str(val).strip()
    if not text:
        return ""

    # Replace newlines/multiple spaces
    text = re.sub(r'\s+', ' ', text)

    # Fix dates (e.g. "2 - Oct" -> "2-Oct")
    text = re.sub(r'(\d+)\s*-\s*([A-Za-z]+)', r'\1-\2', text)

    # Fix spaces inside numeric strings (e.g. "26, 024" -> "26,024", "103 . 54" -> "103.54")
    text = re.sub(r'(?<=\d)\s+(?=[\d,\.%])', '', text)
    text = re.sub(r'(?<=[\d,\.%])\s+(?=\d)', '', text)

    # Pure numeric/dash cells: strip internal spaces
    if re.match(r'^[\d\s,\.\-%/]+$', text):
        text = text.replace(' ', '')

    return text.strip()


def extract_header_date(pdf):
    for page in pdf.pages:
        text = page.extract_text() or ""
        # Search for date pattern after title
        match = re.search(r'LATEST STATUS OF RESERVOIRS\s+(\d{4})[/-](\d{1,2})[/-](\d{1,2})', text, re.IGNORECASE)
        if match:
            return int(match.group(1)), int(match.group(2)), int(match.group(3))

        # Fallback regex for any YYYY/MM/DD header date pattern
        match_any = re.search(r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})', text)
        if match_any:
            return int(match_any.group(1)), int(match_any.group(2)), int(match_any.group(3))

    # Default fallback if date not found in header
    return 2026, 10, 5


def format_to_standard_date(raw_date_str, base_year, base_month):
    
    #Converts '2-Oct' or '5-Oct' to standard 'YYYY-MM-DD' (e.g., '2026-10-02').
    
    cleaned = clean_text_precision(raw_date_str)
    if not cleaned or cleaned in ["-", "–", "—"]:
        return None

    # Pattern 1: "2-Oct" or "05-Oct"
    match_short = re.search(r'^(\d{1,2})[-/\s]*([A-Za-z]{3,9})$', cleaned)
    if match_short:
        day = int(match_short.group(1))
        mon_name = match_short.group(2).lower()[:3]
        month = MONTH_MAP.get(mon_name, base_month)

        year = base_year
        # Handle year wrap-around (e.g., Report is Jan 2026, but row date is Dec)
        if base_month == 1 and month == 12:
            year = base_year - 1

        return f"{year:04d}-{month:02d}-{day:02d}"

    # Pattern 2: Already YYYY/MM/DD or YYYY-MM-DD
    match_full = re.search(r'(\d{4})[/-](\d{1,2})[/-](\d{1,2})', cleaned)
    if match_full:
        return f"{int(match_full.group(1)):04d}-{int(match_full.group(2)):02d}-{int(match_full.group(3)):02d}"

    return cleaned


def parse_number(val):
 
    cleaned = clean_text_precision(val)
    if not cleaned or cleaned in ["-", "–", "—"]:
        return None

    cleaned_num = cleaned.replace(",", "").replace("%", "")
    try:
        val_float = float(cleaned_num)
        if val_float.is_integer():
            return int(val_float)
        return val_float
    except ValueError:
        return None


def is_summary_row(row_cells):
    """Identifies and filters out Gross Total, Sub Total, and Summary rows."""
    row_text = " ".join([clean_text_precision(c).lower() for c in row_cells if c])
    summary_keywords = ["sub total", "subtotal", "gross total", "total", "grand total", "g.total"]

    return any(keyword in row_text for keyword in summary_keywords)


def get_underlined_words(page):
    """Identifies text with visual vector underlines."""
    words = page.extract_words()
    lines = []

    for line in page.lines:
        if abs(line['top'] - line['bottom']) <= 3.0:
            lines.append(line)
    for rect in page.rects:
        if rect['height'] <= 3.0:
            lines.append(rect)

    underlined_text = set()
    for word in words:
        w_x0, w_x1, w_bottom = word['x0'], word['x1'], word['bottom']
        w_width = w_x1 - w_x0

        for line in lines:
            l_x0, l_x1, l_top = line['x0'], line['x1'], line['top']
            l_width = l_x1 - l_x0

            if -1.0 <= (l_top - w_bottom) <= 6.0:
                if (l_x0 <= w_x0 + 8) and (l_x1 >= w_x1 - 8):
                    if l_width <= w_width + 30:
                        underlined_text.add(word['text'].strip().lower())
                        break

    return underlined_text


def is_topic_header(row, underlined_words):
    """Checks if a row is an underlined section topic (e.g. <u>Power Stations</u>)."""
    if len(row) < 2:
        return False, ""

    col0 = clean_text_precision(row[0])
    col1 = clean_text_precision(row[1])

    if not col1:
        return False, ""

    cell_words = [w.strip().lower() for w in col1.split() if w.strip()]
    is_underlined = any(w in underlined_words for w in cell_words)

    non_empty_data = sum(1 for c in row[2:] if clean_text_precision(c) not in ["", "-", None])

    if (is_underlined or col0 == "") and non_empty_data == 0:
        return True, col1

    return False, ""


def map_row_to_json(row, current_topic, base_year, base_month):
    """Maps a single row to the target JSON schema."""
    while len(row) < 14:
        row.append("")

    return {
        "no": parse_number(row[0]),
        "topic": current_topic,
        "tank_name": clean_text_precision(row[1]),
        "gross_capacity": {
            "mcm": parse_number(row[2]),
            "acft": parse_number(row[3])
        },
        "date": format_to_standard_date(row[4], base_year, base_month),
        "water_level_msl": parse_number(row[5]),
        "storage": {
            "mcm": parse_number(row[6]),
            "acft": parse_number(row[7]),
            "percentage": parse_number(row[8])
        },
        "covered_land": {
            "hectares": parse_number(row[9]),
            "acres": parse_number(row[10])
        },
        "rainfall_last_24h": parse_number(row[11]),
        "spilling_downstream_discharge": {
            "m3_s": parse_number(row[12]),
            "ft3_s": parse_number(row[13])
        }
    }


def extract_pdf_to_json(pdf_path, target_topic=None):
    if not os.path.exists(pdf_path):
        print(f"❌ Error: File '{pdf_path}' not found.")
        return

    print(f"\n📄 Processing PDF: {pdf_path}")
    print("=" * 60)

    all_records = []
    current_topic = "General"

    with pdfplumber.open(pdf_path) as pdf:
        # Step 1: Extract Base Year & Month from header
        base_year, base_month, base_day = extract_header_date(pdf)
        print(f"📅 Extracted Report Date Context: {base_year}/{base_month:02d}/{base_day:02d}")

        # Step 2: Iterate Pages & Extract Tables
        for page_num, page in enumerate(pdf.pages, start=1):
            underlined_words = get_underlined_words(page)

            tables = page.extract_tables({
                "vertical_strategy": "lines",
                "horizontal_strategy": "lines",
                "snap_tolerance": 3,
                "join_tolerance": 3,
                "text_x_tolerance": 1.5,
            })

            if not tables:
                tables = page.extract_tables({
                    "vertical_strategy": "text",
                    "horizontal_strategy": "text",
                    "text_x_tolerance": 1.5,
                })

            for table in tables:
                for row in table:
                    if not row or all(c is None or str(c).strip() == "" for c in row):
                        continue

                    cleaned_row = [clean_text_precision(c) for c in row]
                    row_text = " ".join(cleaned_row).lower()

                    # Skip Table Headers
                    if "gross capacity" in row_text or "water level" in row_text or "latest status" in row_text:
                        continue
                    if cleaned_row[0].lower() == "no" or cleaned_row[1].lower() == "tank/ reservoir":
                        continue

                    # Filter Out Total / Sub Total Rows
                    if is_summary_row(cleaned_row):
                        print(f"  🙈 Skipped Summary Row: [{cleaned_row[1] if len(cleaned_row) > 1 else 'Total'}]")
                        continue

                    # Check for Section Topic Header (e.g. "Power Stations")
                    is_topic, topic_name = is_topic_header(cleaned_row, underlined_words)
                    if is_topic:
                        current_topic = topic_name
                        print(f"  📌 Detected Underlined Topic: [{current_topic}] (Page {page_num})")
                        continue

                    # Map row data to JSON object
                    record = map_row_to_json(cleaned_row, current_topic, base_year, base_month)
                    all_records.append(record)

    if not all_records:
        print("❌ No data rows extracted.")
        return

    # Output Folder
    output_dir = "json_output"
    os.makedirs(output_dir, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]

    # Export Full JSON
    full_json_path = os.path.join(output_dir, f"{base_name}_ALL_TOPICS.json")
    with open(full_json_path, "w", encoding="utf-8") as f:
        json.dump(all_records, f, indent=2, ensure_ascii=False)
    print(f"\n [FILE CREATED] Full JSON: {os.path.abspath(full_json_path)}")

    # Export Topic JSON (e.g. Power Stations)
    if target_topic:
        filtered_records = [
            r for r in all_records
            if target_topic.lower() in r["topic"].lower()
        ]

        if filtered_records:
            topic_file_name = f"{base_name}_{target_topic.replace(' ', '_')}.json"
            topic_json_path = os.path.join(output_dir, topic_file_name)

            with open(topic_json_path, "w", encoding="utf-8") as f:
                json.dump(filtered_records, f, indent=2, ensure_ascii=False)

            print(f" [FILE CREATED] Filtered JSON ({target_topic}): {os.path.abspath(topic_json_path)}")

            # Display Preview
            print(f"\n--- Clean JSON Preview ({target_topic}) ---")
            print(json.dumps(filtered_records[:2], indent=2))
        else:
            available = list(set(r["topic"] for r in all_records))
            print(f"\n Topic '{target_topic}' not found. Available topics: {available}")

    print("\n Success!")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        pdf_file = sys.argv[1]
        topic = sys.argv[2] if len(sys.argv) > 2 else "Power Stations"
        extract_pdf_to_json(pdf_file, target_topic=topic)
    else:
        pdf_file = input("Enter path to PDF file: ").strip().strip('"').strip("'")
        if pdf_file:
            topic = input("Enter topic to filter [Default: Power Stations]: ").strip()
            if not topic:
                topic = "Power Stations"
            extract_pdf_to_json(pdf_file, target_topic=topic)
        else:
            print(" No PDF path provided.")