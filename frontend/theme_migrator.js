const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        filelist = fs.statSync(path.join(dir, file)).isDirectory()
            ? walkSync(path.join(dir, file), filelist)
            : filelist.concat(path.join(dir, file));
    });
    return filelist;
};

const files = walkSync('./src').filter(f => f.endsWith('.jsx'));

const replacements = [
  // Backgrounds
  { regex: /bg-\[#0d1117\]/g, replacement: 'bg-white dark:bg-[#0d1117]' },
  { regex: /bg-\[#010409\]/g, replacement: 'bg-gray-50 dark:bg-[#010409]' },
  { regex: /bg-\[#161b22\]/g, replacement: 'bg-white dark:bg-[#161b22]' },
  { regex: /bg-\[#21262d\]/g, replacement: 'bg-gray-100 dark:bg-[#21262d]' },
  { regex: /bg-\[#f6f8fa\]/g, replacement: 'bg-gray-50 dark:bg-[#0d1117]' },
  { regex: /bg-\[#24292f\]/g, replacement: 'bg-gray-900 dark:bg-[#161b22]' },
  
  // Hover Backgrounds
  { regex: /hover:bg-\[#30363d\]/g, replacement: 'hover:bg-gray-200 dark:hover:bg-[#30363d]' },
  { regex: /hover:bg-\[#161b22\]/g, replacement: 'hover:bg-gray-50 dark:hover:bg-[#161b22]' },
  { regex: /hover:bg-\[#1a7f37\]/g, replacement: 'hover:bg-green-700 dark:hover:bg-[#2ea043]' },
  
  // Borders
  { regex: /border-\[#30363d\]/g, replacement: 'border-gray-200 dark:border-[#30363d]' },
  { regex: /border-\[rgba\(240,246,252,0\.1\)\]/g, replacement: 'border-gray-300 dark:border-[rgba(240,246,252,0.1)]' },
  { regex: /border-\[#d0d7de\]/g, replacement: 'border-gray-300 dark:border-[#30363d]' },
  
  // Text Colors
  { regex: /text-\[#c9d1d9\]/g, replacement: 'text-gray-900 dark:text-[#c9d1d9]' },
  { regex: /text-\[#8b949e\]/g, replacement: 'text-gray-500 dark:text-[#8b949e]' },
  { regex: /placeholder-\[#8b949e\]/g, replacement: 'placeholder-gray-400 dark:placeholder-[#8b949e]' },
  { regex: /text-\[#24292f\]/g, replacement: 'text-gray-900 dark:text-[#c9d1d9]' },
  
  // Accents (Blue, Green, Red)
  { regex: /text-\[#58a6ff\]/g, replacement: 'text-blue-600 dark:text-[#58a6ff]' },
  { regex: /border-\[#58a6ff\]/g, replacement: 'border-blue-600 dark:border-[#58a6ff]' },
  { regex: /focus:border-\[#58a6ff\]/g, replacement: 'focus:border-blue-500 dark:focus:border-[#58a6ff]' },
  { regex: /text-\[#0969da\]/g, replacement: 'text-blue-600 dark:text-[#58a6ff]' },
  { regex: /focus:border-\[#0969da\]/g, replacement: 'focus:border-blue-500 dark:focus:border-[#58a6ff]' },
  { regex: /focus:ring-\[#0969da\]/g, replacement: 'focus:ring-blue-500 dark:focus:ring-[#58a6ff]' },

  { regex: /bg-\[#238636\]/g, replacement: 'bg-green-600 dark:bg-[#238636]' },
  { regex: /bg-\[#1f883d\]/g, replacement: 'bg-green-600 dark:bg-[#238636]' },
  { regex: /hover:bg-\[#2ea043\]/g, replacement: 'hover:bg-green-700 dark:hover:bg-[#2ea043]' },
  { regex: /text-\[#3fb950\]/g, replacement: 'text-green-600 dark:text-[#3fb950]' },
  { regex: /border-\[#2ea043\]/g, replacement: 'border-green-600 dark:border-[#2ea043]' },
  { regex: /border-\[#3fb950\]/g, replacement: 'border-green-600 dark:border-[#3fb950]' },
  
  { regex: /text-\[#ff7b72\]/g, replacement: 'text-red-600 dark:text-[#ff7b72]' },
  { regex: /border-\[#ff7b72\]/g, replacement: 'border-red-600 dark:border-[#ff7b72]' },
  { regex: /border-\[#f85149\]/g, replacement: 'border-red-600 dark:border-[#f85149]' }
];

let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Safely replace text-white on nav items with dark adaptive text
    // Only in specific contexts to avoid making solid buttons light colored
    content = content.replace(/text-white(?![\w-]| font-medium)/g, 'text-gray-900 dark:text-white');
    
    // Apply all color replacements
    replacements.forEach(({regex, replacement}) => {
        content = content.replace(regex, replacement);
    });

    // Remove document.body.classList additions for forcing dark mode
    content = content.replace(/document\.body\.classList\.add\('dark-page'\);?/g, '');
    content = content.replace(/document\.body\.classList\.remove\('light-page'\);?/g, '');
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedFiles++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Done. Updated ${changedFiles} files.`);
