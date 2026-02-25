import os
import re
import sys
import urllib.parse
from functools import lru_cache

def find_markdown_files(root_dir):
    md_files = []
    for root, dirs, files in os.walk(root_dir):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        for file in files:
            if file.endswith('.md'):
                md_files.append(os.path.join(root, file))
    return md_files

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    text = text.strip('-')
    return text

@lru_cache(maxsize=None)
def get_anchors(filepath):
    anchors = set()
    if not os.path.exists(filepath):
        return anchors

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Standard headers
    headers = re.findall(r'^#{1,6}\s+(.+)$', content, re.MULTILINE)
    for h in headers:
        anchors.add(slugify(h))

    # Explicit HTML anchors <a name="..."> or <a id="...">
    html_anchors = re.findall(r'<a\s+(?:name|id)=["\'](.*?)["\']', content)
    for a in html_anchors:
        anchors.add(a)

    return anchors

def verify_links(root_dir):
    md_files = find_markdown_files(root_dir)
    errors = []

    for file_path in md_files:
        # print(f"Checking {file_path}...")
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        links = re.findall(r'\[.*?\]\((.*?)\)', content)

        for link in links:
            # Skip external links and email
            if link.startswith(('http://', 'https://', 'mailto:', '#')):
                continue

            # Handle anchor only links (e.g. [Link](#anchor)) - treated as internal to same file
            # Wait, regex above captures full url inside parens.
            # If it starts with #, it's same-page anchor.

            target = link
            anchor = None

            if '#' in target:
                target, anchor = target.split('#', 1)

            if not target:
                # Same page anchor
                target_path = file_path
            else:
                # Relative path
                target_path = os.path.normpath(os.path.join(os.path.dirname(file_path), target))

            if not os.path.exists(target_path):
                errors.append(f"Broken link in {file_path}: {link} (Target not found: {target_path})")
                continue

            if anchor:
                # If target is not a markdown file, we can't easily check anchors (e.g. code files)
                if not target_path.endswith('.md'):
                    continue

                target_anchors = get_anchors(target_path)
                if anchor not in target_anchors:
                     errors.append(f"Broken anchor in {file_path}: {link} (Anchor #{anchor} not found in {target_path})")

    return errors

if __name__ == "__main__":
    root_dir = os.getcwd()
    errors = verify_links(root_dir)

    if errors:
        print("\nFound broken links:")
        for error in errors:
            print(f"- {error}")
        sys.exit(1)
    else:
        print("\nAll internal links verified successfully!")
        sys.exit(0)
