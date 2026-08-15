import { writable } from 'svelte/store';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface Theme {
	name: Season;
	label: string;
	primaryColor: string;
	secondaryColor: string;
	accentColor: string;
	navbarColor: string;
	navbarTextColor: string;
}

export const themes: Record<Season, Theme> = {
	spring: {
		name: 'spring',
		label: 'Primavera 🌸',
		primaryColor: '#1f7459',
		secondaryColor: '#fbbf24',
		accentColor: '#ec4899',
		navbarColor: '#065f46',
		navbarTextColor: '#ffffff'
	},
	summer: {
		name: 'summer',
		label: 'Verão ☀️',
		primaryColor: '#1d0925',
		secondaryColor: '#06b6d4',
		accentColor: '#f97316',
		navbarColor: '#0369a1',
		navbarTextColor: '#ffffff'
	},
	autumn: {
		name: 'autumn',
		label: 'Outono 🍂',
		primaryColor: '#1a0505',
		secondaryColor: '#f97316',
		accentColor: '#b45309',
		navbarColor: '#7c2d12',
		navbarTextColor: '#fef3c7'
	},
	winter: {
		name: 'winter',
		label: 'Inverno ❄️',
		primaryColor: '#0ea5e9',
		secondaryColor: '#60a5fa',
		accentColor: '#1e224b',
		navbarColor: '#1e3a8a',
		navbarTextColor: '#ffffff'
	}
};

function createThemeStore() {
	const storedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
	const initialTheme: Season = (storedTheme as Season) || 'spring';

	const { subscribe, set } = writable<Season>(initialTheme);

	return {
		subscribe,
		set: (theme: Season) => {
			set(theme);
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('theme', theme);
			}
			applyTheme(theme);
		}
	};
}

export function applyTheme(theme: Season) {
	const themeConfig = themes[theme];
	const root = document.documentElement;

	// Defina as variáveis CSS para as cores do tema.
	root.style.setProperty('--color-primary-500', themeConfig.primaryColor);
	root.style.setProperty('--color-secondary-500', themeConfig.secondaryColor);
	root.style.setProperty('--color-accent-500', themeConfig.accentColor);
	root.style.setProperty('--navbar-color', themeConfig.navbarColor);
	root.style.setProperty('--navbar-text-color', themeConfig.navbarTextColor);

	// Remover todas as classes de tema
	Object.keys(themes).forEach((t) => {
		root.classList.remove(`theme-${t}`);
	});

	// Adicionar nova classe de tema
	root.classList.add(`theme-${theme}`);

	// Acione o refluxo para uma transição suave.
	void root.offsetHeight;
}

export const themeStore = createThemeStore();