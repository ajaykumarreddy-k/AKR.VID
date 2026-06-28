import os
import glob
import re

base_dir = '/home/prince/ProjectsMain/akr-vid/files/artkit-clone/tools'
files = glob.glob(os.path.join(base_dir, '*.html'))

for path in files:
    filename = os.path.basename(path)
    if filename == '_template.html':
        continue
    
    with open(path, 'r') as f:
        content = f.read()

    # Find the tool name from the <title> tag
    # Example: <title>ToneKit — ajay</title>
    title_match = re.search(r'<title>(.*?) —', content)
    tool_name = title_match.group(1).strip() if title_match else filename.replace('.html', '').capitalize()

    # 1. Replace <div class="tool-logo">...</div> with <h1 class="tool-logo">...</h1>
    content = re.sub(r'<div class="tool-logo">(.*?)</div>', r'<h1 class="tool-logo">\1</h1>', content)

    # 2. Inject SEO tags before </head>
    if 'rel="canonical"' not in content:
        seo_tags = f"""
  <link rel="canonical" href="https://akrvid.vercel.app/tools/{filename}" />
  <meta name="description" content="Use the {tool_name} tool on AKR.VID to apply brutalist web-based image and video effects." />
  <meta property="og:title" content="{tool_name} - AKR.VID" />
  <meta property="og:description" content="Use the {tool_name} tool on AKR.VID to apply brutalist web-based image and video effects." />
  <meta property="og:image" content="https://akrvid.vercel.app/images/Tonekit.png" />
  <meta property="og:url" content="https://akrvid.vercel.app/tools/{filename}" />
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "{tool_name}",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web",
    "url": "https://akrvid.vercel.app/tools/{filename}"
  }}
  </script>
</head>"""
        content = content.replace('</head>', seo_tags)

    with open(path, 'w') as f:
        f.write(content)

print("SEO update complete.")
