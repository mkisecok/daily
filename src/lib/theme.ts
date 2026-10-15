export type Theme = 'light' | 'dark';

/** value rendered into `<html data-theme>` before the user has ever chosen */
export const THEME_AUTO = 'auto';
export const THEME_COOKIE = 'theme';

export type ThemeSetting = Theme | typeof THEME_AUTO;

export function parseTheme(value: string | undefined): ThemeSetting {
	if (value === 'light' || value === 'dark') return value;
	return THEME_AUTO;
}
