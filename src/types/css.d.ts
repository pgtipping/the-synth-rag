declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

// Declare Tailwind CSS directives
declare module "tailwindcss" {
  interface TailwindPlugin {
    config: unknown;
    handler: () => void;
  }
  const plugin: TailwindPlugin;
  export = plugin;
}

// Declare PostCSS directives
declare module "postcss" {
  interface PostCSSProcessor {
    process: (css: string, options?: unknown) => Promise<{ css: string }>;
  }
  const postcss: PostCSSProcessor;
  export = postcss;
}
