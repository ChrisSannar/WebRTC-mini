import fs from "fs";
import path from "path";

function fixImports(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      fixImports(fullPath);
    } else if (file.endsWith(".js") && !file.endsWith(".map")) {
      let content = fs.readFileSync(fullPath, "utf8");
      const original = content;

      // Fix 1: Directory imports like './config' should become './config/index.js'
      content = content.replace(
        /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g,
        (match, prefix, importPath, suffix) => {
          const hasExt = /\.\w+$/.test(importPath);

          if (!hasExt) {
            // Check if this is a directory with index.js
            const dirPath = path.join(dir, importPath);
            const indexPath = path.join(dirPath, "index.js");

            try {
              if (fs.statSync(indexPath).isFile()) {
                // It's a directory import - add /index.js
                return `${prefix}${importPath}/index.js${suffix}`;
              }
            } catch (e) {
              // Not a directory, check if it's a file without extension
              const filePath = path.join(dir, importPath + ".js");
              try {
                if (fs.statSync(filePath).isFile()) {
                  return `${prefix}${importPath}.js${suffix}`;
                }
              } catch (e2) {
                // Neither file nor directory, leave as is
              }
            }
          }
          return match;
        },
      );

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed: ${fullPath}`);
      }
    }
  }
}

fixImports("packages/webrtc/dist");
fixImports("apps/example/dist");

console.log("Done fixing imports");
