export const WHATSAPP_PALETTE = {
  primary: '#0C8466',
  primaryMuted: 'rgba(12, 132, 102, 0.08)',
  primaryBorder: 'rgba(12, 132, 102, 0.25)',
  primaryDisabled: '#AEBAC1',
  tabInactive: '#8E8E93',
  tabBackground: '#FFFFFF',
  sendHighlight: '#0C8466',
  toggleActive: '#DDE2E8',
  headerText: '#141414',
  cardBorder: '#EAEBED',
};

export const HEADER_TITLE_STYLE = {
  color: '#141414',
  fontWeight: '600' as const,
};

export const createThemedToggleStyles = ({
  background = WHATSAPP_PALETTE.tabBackground,
  border = WHATSAPP_PALETTE.primary,
  text = WHATSAPP_PALETTE.primary,
  backgroundActive = WHATSAPP_PALETTE.toggleActive,
  borderActive = WHATSAPP_PALETTE.primary,
  textActive,
  borderRadius = 20,
}: {
  background?: string;
  border?: string;
  text?: string;
  backgroundActive?: string;
  borderActive?: string;
  textActive?: string;
  borderRadius?: number;
}) => ({
  base: {
    backgroundColor: background,
    borderColor: border,
    borderWidth: 1,
    borderRadius,
  },
  active: {
    backgroundColor: backgroundActive,
    borderColor: borderActive,
  },
  text: {
    color: text,
  },
  textActive: {
    color: textActive ?? text,
  },
});
