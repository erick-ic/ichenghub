// Keep editor previews and server rendering consistent. Unsupported languages
// remain readable code blocks instead of aborting the whole Markdown render.
export const codeHighlightOptions = {
  ignoreMissing: true,
  defaultLanguage: 'text',
};
