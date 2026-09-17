"""Preserve exported foregrounds while removing their decorative line backgrounds."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ET.register_namespace('', 'http://www.w3.org/2000/svg')
ET.register_namespace('xlink', 'http://www.w3.org/1999/xlink')
assets = Path(__file__).resolve().parents[1] / 'public/assets'
names = ['workspace-complete', 'assistant', 'intelligence', 'deployment-self-hosted', 'deployment-managed', 'why-prism'] + [f'feature-{i}' for i in range(5)]
for name in names:
    source = ET.parse(assets / f'{name}.svg').getroot()
    frame = next(n for n in source.iter() if n.get('clip-path') == 'url(#clip0_302_12581)')
    # The first rectangle is the solid panel; the following identified nodes are its line artwork.
    frame.remove(frame[0])
    for node in list(frame):
        if node.get('id', '').startswith('image 63 [Vectorized]') or node.get('id') in {'image 71', 'image 67'}:
            frame.remove(node)
    result = ET.Element(source.tag, source.attrib)
    result.append(frame)
    defs = source.find('{http://www.w3.org/2000/svg}defs')
    if defs is not None:
        candidates = {node.get('id'): node for node in defs}
        def references(node):
            text = ET.tostring(node, encoding='unicode')
            return set(re.findall(r'url\(#([^)]*)\)', text) + re.findall(r'(?:href)="#([^"]+)"', text))
        needed = references(frame)
        while True:
            expanded = needed | set().union(*(references(candidates[k]) for k in needed if k in candidates))
            if expanded == needed: break
            needed = expanded
        clean_defs = ET.SubElement(result, defs.tag)
        for node in defs:
            if node.get('id') in needed: clean_defs.append(node)
    ET.ElementTree(result).write(assets / f'{name}-foreground.svg', encoding='unicode')
    print(name)
