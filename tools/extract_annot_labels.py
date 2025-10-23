#!/usr/bin/env python3
"""
Extract label names from FreeSurfer annotation files
"""
import sys
import struct
from pathlib import Path

def read_annot(filepath):
    """Read FreeSurfer annotation file and return label names"""
    with open(filepath, 'rb') as f:
        # Read number of vertices
        num_vertices = struct.unpack('>i', f.read(4))[0]
        
        # Skip vertex data (each vertex has index + label = 8 bytes)
        f.seek(num_vertices * 8, 1)
        
        # Check for color table
        has_colortable = struct.unpack('>i', f.read(4))[0]
        
        if has_colortable != 1:
            return []
        
        # Read version/numEntries
        version_or_entries = struct.unpack('>i', f.read(4))[0]
        is_version2 = version_or_entries < 0
        
        if is_version2:
            # Skip max_structure_index
            f.read(4)
        
        # Read filename length and skip filename
        filename_len = struct.unpack('>i', f.read(4))[0]
        f.read(filename_len)
        
        # Read number of entries
        num_entries = struct.unpack('>i', f.read(4))[0]
        
        labels = []
        
        # Read each entry
        for i in range(num_entries):
            try:
                # Structure index
                structure = struct.unpack('>i', f.read(4))[0]
                
                # Name length
                name_len = struct.unpack('>i', f.read(4))[0]
                
                # Name
                name_bytes = f.read(name_len)
                name = name_bytes.decode('utf-8', errors='ignore').rstrip('\x00')
                
                # RGBA
                rgba_data = f.read(16)
                if len(rgba_data) < 16:
                    print(f"Warning: incomplete RGBA data for entry {i}, skipping")
                    break
                r, g, b, a = struct.unpack('>iiii', rgba_data)
                
                labels.append(name)
            except Exception as e:
                print(f"Error reading entry {i}: {e}")
                break
        
        return labels

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python extract_annot_labels.py <annotation_file>")
        sys.exit(1)
    
    annot_file = sys.argv[1]
    labels = read_annot(annot_file)
    
    print(f"\nLabels in {Path(annot_file).name}:")
    print(f"Total: {len(labels)} labels\n")
    for label in labels:
        print(f"  {label}")
