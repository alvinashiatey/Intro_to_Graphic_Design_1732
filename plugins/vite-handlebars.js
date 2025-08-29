import fs from "fs/promises";
import path from "path";
import Handlebars from "handlebars";

/**
 * A simple Handlebars plugin for Vite 6
 * @param {Object} options Plugin options
 * @returns {import('vite').Plugin} Vite plugin
 */
export default function handlebarsPlugin(options = {}) {
  const {
    partialDirectory,
    context = {},
    reloadOnPartialChange = true,
    compileOptions = {},
    runtimeOptions = {},
  } = options;

  // Cached partials for use during rendering
  const partials = {};
  // Keep track of HTML files that use partials for HMR
  const templateToPartialsMap = new Map();
  // Template cache
  const templateCache = new Map();

  return {
    name: "vite-plugin-handlebars",

    async configureServer(server) {
      if (reloadOnPartialChange && partialDirectory) {
        server.watcher.on("change", async (changedPath) => {
          const isPartial = changedPath.startsWith(partialDirectory);
          if (isPartial) {
            // Get partial name from path
            const fileName = path.basename(changedPath);
            const partialName = path.parse(fileName).name;

            // Update the partial in the cache
            try {
              const partialContent = await fs.readFile(changedPath, "utf-8");
              Handlebars.registerPartial(partialName, partialContent);

              // Find HTML files using this partial and trigger HMR
              const htmlFilesToReload = [];
              templateToPartialsMap.forEach((usedPartials, htmlFile) => {
                if (usedPartials.includes(partialName)) {
                  htmlFilesToReload.push(htmlFile);
                }
              });

              // Clear the template cache for affected files
              for (const htmlFile of htmlFilesToReload) {
                templateCache.delete(htmlFile);
                server.ws.send({
                  type: "full-reload",
                  path: htmlFile,
                });
              }
            } catch (err) {
              console.error(`Error processing partial ${partialName}:`, err);
            }
          }
        });
      }
    },

    async buildStart() {
      if (!partialDirectory) return;

      // Load all partials from directory
      try {
        // Handle both string and array of directories
        const partialDirs = Array.isArray(partialDirectory)
          ? partialDirectory
          : [partialDirectory];

        for (const dir of partialDirs) {
          const files = await fs.readdir(dir);

          for (const file of files) {
            if (file.endsWith(".hbs") || file.endsWith(".html")) {
              const filePath = path.join(dir, file);
              const fileContent = await fs.readFile(filePath, "utf-8");
              const partialName = path.parse(file).name;

              partials[partialName] = fileContent;
              Handlebars.registerPartial(partialName, fileContent);
            }
          }
        }
      } catch (err) {
        console.error("Error loading Handlebars partials:", err);
      }
    },

    // Register the built-in helpers
    configResolved() {
      // Helper to resolve paths from root
      Handlebars.registerHelper("resolve-from-root", (filePath) => {
        return `/${filePath}`;
      });
    },

    transformIndexHtml: {
      order: "pre",
      async handler(html, { filename }) {
        // Skip if no filename or not an HTML file
        if (!filename || !filename.endsWith(".html")) {
          return html;
        }

        try {
          // Get context for this template
          let templateContext;
          if (typeof context === "function") {
            templateContext = await context(filename);
          } else {
            templateContext = context;
          }

          // Process each context key if it's a function
          for (const key in templateContext) {
            if (typeof templateContext[key] === "function") {
              templateContext[key] = await templateContext[key](filename);
            }
          }

          // Compile the template
          let template = templateCache.get(filename);
          if (!template) {
            template = Handlebars.compile(html, compileOptions);
            templateCache.set(filename, template);
          }

          // Track which partials are used by this template (for HMR)
          if (reloadOnPartialChange) {
            const partialRegex = /{{>\s*([a-zA-Z0-9_-]+)\s*}}/g;
            const usedPartials = [];
            let match;
            while ((match = partialRegex.exec(html)) !== null) {
              usedPartials.push(match[1]);
            }
            templateToPartialsMap.set(filename, usedPartials);
          }

          // Render with context
          return template(templateContext, runtimeOptions);
        } catch (err) {
          console.error(
            `Error processing Handlebars template ${filename}:`,
            err
          );
          return html;
        }
      },
    },
  };
}
