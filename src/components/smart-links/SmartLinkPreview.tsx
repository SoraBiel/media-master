import { SmartLinkPage, SmartLinkButton } from "@/hooks/useSmartLinks";

interface SmartLinkPreviewProps {
  page: SmartLinkPage;
  buttons: SmartLinkButton[];
}

const SmartLinkPreview = ({ page, buttons }: SmartLinkPreviewProps) => {
  const getButtonClasses = (style: string) => {
    const baseClasses = "w-full py-2.5 px-4 text-sm font-medium transition-all flex items-center justify-center";
    
    switch (style) {
      case "pill":
        return `${baseClasses} rounded-full`;
      case "square":
        return `${baseClasses} rounded-none`;
      case "outline":
        return `${baseClasses} rounded-lg bg-transparent border-2`;
      case "rounded":
      default:
        return `${baseClasses} rounded-lg`;
    }
  };

  const activeButtons = buttons.filter(b => b.is_active);

  return (
    <div
      className="aspect-[9/16] overflow-hidden flex flex-col items-center p-4"
      style={{ backgroundColor: page.background_color }}
    >
      {/* Profile Section */}
      <div className="text-center space-y-2 pt-8 pb-4">
        {page.avatar_url && (
          <img
            src={page.avatar_url}
            alt={page.title}
            className="w-16 h-16 rounded-full mx-auto object-cover border-2"
            style={{ borderColor: page.text_color + "40" }}
          />
        )}
        <h2
          className="text-lg font-bold"
          style={{ color: page.text_color }}
        >
          {page.title}
        </h2>
        {page.description && (
          <p
            className="text-xs opacity-80 max-w-[200px] mx-auto"
            style={{ color: page.text_color }}
          >
            {page.description}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="w-full space-y-2 flex-1 overflow-y-auto">
        {activeButtons.length === 0 ? (
          <p
            className="text-center text-xs opacity-50 pt-4"
            style={{ color: page.text_color }}
          >
            Adicione botões para visualizar
          </p>
        ) : (
          activeButtons.map((button) => (
            <div
              key={button.id}
              className={`${getButtonClasses(page.button_style)} relative`}
              style={{
                backgroundColor: page.button_style === "outline" 
                  ? "transparent" 
                  : page.text_color,
                color: page.button_style === "outline" 
                  ? page.text_color 
                  : page.background_color,
                borderColor: page.button_style === "outline" 
                  ? page.text_color 
                  : undefined,
                paddingLeft: button.icon ? "2.5rem" : undefined,
              }}
            >
              {button.icon && (
                <img
                  src={button.icon}
                  alt=""
                  className="w-6 h-6 rounded object-cover flex-shrink-0 absolute left-2"
                />
              )}
              <span className="truncate">{button.title}</span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="pt-4 pb-2">
        <span
          className="text-2xs opacity-40"
          style={{ color: page.text_color }}
        >
          Feito com Nexo
        </span>
      </div>
    </div>
  );
};

export default SmartLinkPreview;
