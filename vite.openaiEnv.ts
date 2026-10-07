/** Never embed VITE_OPENAI_API_KEY in release extension bundles (chrome/firefox build). */
export function viteOpenAiKeyDefine(mode: string): Record<string, string> {
  if (mode === 'development') {
    return {};
  }

  return {
    'import.meta.env.VITE_OPENAI_API_KEY': JSON.stringify(''),
  };
}
