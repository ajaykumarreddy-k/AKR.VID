import os
import glob

base_dir = '/home/prince/ProjectsMain/akr-vid/files/artkit-clone'

def process_index():
    path = os.path.join(base_dir, 'index.html')
    with open(path, 'r') as f:
        content = f.read()
    
    # 1. Add id="hero"
    content = content.replace('<div class="layout-container">', '<div class="layout-container" id="hero">')
    
    # 2. Add Back button and change Home href
    dock_target = '''  <!-- Floating Navigation Dock -->
  <div class="floating-dock">
    <a href="#" class="dock-item" title="Home">'''
    dock_replace = '''  <!-- Floating Navigation Dock -->
  <div class="floating-dock">
    <a href="javascript:history.back()" class="dock-item" title="Back">
      <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
    </a>
    <a href="#hero" class="dock-item" title="Home">'''
    content = content.replace(dock_target, dock_replace)
    
    with open(path, 'w') as f:
        f.write(content)

def process_tools():
    tools_dir = os.path.join(base_dir, 'tools')
    html_files = glob.glob(os.path.join(tools_dir, '*.html'))
    
    dock_target = '''  <!-- Floating Navigation Dock -->
  <div class="floating-dock">
    <a href="../index.html" class="dock-item" title="Home">'''
    dock_replace = '''  <!-- Floating Navigation Dock -->
  <div class="floating-dock">
    <a href="javascript:history.back()" class="dock-item" title="Back">
      <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
    </a>
    <a href="../index.html#hero" class="dock-item" title="Home">'''
    
    for path in html_files:
        with open(path, 'r') as f:
            content = f.read()
            
        content = content.replace(dock_target, dock_replace)
        
        with open(path, 'w') as f:
            f.write(content)

process_index()
process_tools()
print("Done")
