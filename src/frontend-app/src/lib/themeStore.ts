import { writable } from 'svelte/store';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface Theme {
	name: Season;
	label: string;
	primaryColor: string;
	secondaryColor: string;
	accentColor: string;
}

export const themes: Record<Season, Theme> = {
	spring: {
		name: 'spring',
		label: 'Primavera 🌸',
		primaryColor: '#10b981',
		secondaryColor: '#fbbf24',
		accentColor: '#ec4899'
	},
	summer: {
		name: 'summer',
		label: 'Verão ☀️',
		primaryColor: '#f59e0b',
		secondaryColor: '#06b6d4',
		accentColor: '#f97316'
	},
	autumn: {
		name: 'autumn',
		label: 'Outono 🍂',
		primaryColor: '#dc2626',
		secondaryColor: '#f97316',
		accentColor: '#b45309'
	},
	winter: {
		name: 'winter',
		label: 'Inverno ❄️',
		primaryColor: '#0ea5e9',
		secondaryColor: '#60a5fa',
		accentColor: '#818cf8'
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
