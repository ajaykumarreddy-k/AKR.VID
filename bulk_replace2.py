import os
import glob

base_dir = '/home/prince/ProjectsMain/akr-vid/files/artkit-clone'

def process_tools():
    tools_dir = os.path.join(base_dir, 'tools')
    html_files = glob.glob(os.path.join(tools_dir, '*.html'))
    
    dock_target = """  <!-- Floating Navigation Dock -->
  <div class="floating-dock">
    <a href="../index.html" class="dock-item" title="Home">"""
    dock_replace = """  <!-- Floating Navigation Dock -->
  <div class="floating-dock">
    <a href="javascript:history.back()" class="dock-item" title="Back">
      <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
    </a>
    <a href="../index.html#hero" class="dock-item" title="Home">"""
    
    for path in html_files:
        with open(path, 'r') as f:
            content = f.read()
            
        if dock_target in content:
            print(f"Replacing in {path}")
            content = content.replace(dock_target, dock_replace)
            with open(path, 'w') as f:
                f.write(content)
        else:
            print(f"Target not found in {path}")

process_tools()
