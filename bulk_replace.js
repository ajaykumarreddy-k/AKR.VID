const fs = require('fs');
const path = require('path');

const baseDir = '/home/prince/ProjectsMain/akr-vid/files/artkit-clone/tools';
const files = fs.readdirSync(baseDir).filter(f => f.endsWith('.html'));

const dockTarget = `  <!-- Floating Navigation Dock -->
  <div class="floating-dock">
    <a href="../index.html" class="dock-item" title="Home">`;

const dockReplace = `  <!-- Floating Navigation Dock -->
  <div class="floating-dock">
    <a href="javascript:history.back()" class="dock-item" title="Back">
      <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
    </a>
    <a href="../index.html#hero" class="dock-item" title="Home">`;

files.forEach(f => {
  const filePath = path.join(baseDir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(dockTarget)) {
    console.log('Replacing in ' + f);
    content = content.replace(dockTarget, dockReplace);
    fs.writeFileSync(filePath, content);
  } else {
    console.log('Target not found in ' + f);
  }
});
console.log('Done');
