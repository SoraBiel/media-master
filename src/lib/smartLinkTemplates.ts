export interface SmartLinkTemplateConfig {
  id: string;
  name: string;
  description: string;
  background_color: string;
  text_color: string;
  button_style: string;
  preview: {
    gradient?: string;
  };
}

export const SMART_LINK_TEMPLATES: SmartLinkTemplateConfig[] = [
  {
    id: "minimalist",
    name: "Minimalista",
    description: "Fundo escuro, visual clean e profissional",
    background_color: "#0f0f0f",
    text_color: "#ffffff",
    button_style: "rounded",
    preview: {},
  },
  {
    id: "gradient",
    name: "Gradiente Vibrante",
    description: "Cores modernas com gradiente suave",
    background_color: "#1a1a2e",
    text_color: "#e0e0ff",
    button_style: "pill",
    preview: {
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
  },
  {
    id: "light",
    name: "Clean Light",
    description: "Fundo claro, minimalista e elegante",
    background_color: "#f8f9fa",
    text_color: "#1a1a1a",
    button_style: "rounded",
    preview: {},
  },
];

export const getTemplateById = (id: string): SmartLinkTemplateConfig | undefined => {
  return SMART_LINK_TEMPLATES.find((t) => t.id === id);
};
