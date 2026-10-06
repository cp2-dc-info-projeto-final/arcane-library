import { writable } from 'svelte/store';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
	name: ThemeMode;
	label: string;
	primaryColor: string;
	secondaryColor: string;
	accentColor: string;
	navbarColor: string;
	navbarTextColor: string;
	backgroundColor: string;
	textColor: string;
}

export const themes: Record<ThemeMode, Theme> = {
	light: {
		name: 'light',
		label: 'Tema claro ☀️',
		primaryColor: '#10243a',
		secondaryColor: '#c9a45c',
		accentColor: '#967237',
		navbarColor: '#f4efe4',
		navbarTextColor: '#10243a',
		backgroundColor: '#f4efe4',
		textColor: '#10243a'
	},

	dark: {
		name: 'dark',
		label: 'Tema escuro 🌙',
		primaryColor: '#f1e9d6',
		secondaryColor: '#c9a45c',
		accentColor: '#e4c77a',
		navbarColor: '#080d14',
		navbarTextColor: '#f1e9d6',
		backgroundColor: '#080d14',
		textColor: '#f1e9d6'
	}
};


function getInitialTheme(): ThemeMode {
	if (typeof localStorage === 'undefined') {
		return 'light';
	}

	const storedTheme = localStorage.getItem('theme');

	if (storedTheme === 'dark' || storedTheme === 'light') {
		return storedTheme;
	}

	return 'light';
}


function createThemeStore() {

	const { subscribe, set } = writable<ThemeMode>(getInitialTheme());


	return {

		subscribe,


		set: (theme: ThemeMode) => {

			set(theme);

			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('theme', theme);
			}

			applyTheme(theme);
		},


		toggle: () => {

			const current =
				document.documentElement.classList.contains('theme-dark')
					? 'dark'
					: 'light';

			const next: ThemeMode =
				current === 'light'
					? 'dark'
					: 'light';

			set(next);

			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('theme', next);
			}

			applyTheme(next);
		}
	};
}


export function applyTheme(theme: ThemeMode) {

	const themeConfig = themes[theme];

	const root = document.documentElement;


	/* ==============================
	   VARIÁVEIS DO TEMA
	   ============================== */

	root.style.setProperty(
		'--color-primary-500',
		themeConfig.primaryColor
	);

	root.style.setProperty(
		'--color-secondary-500',
		themeConfig.secondaryColor
	);

	root.style.setProperty(
		'--color-accent-500',
		themeConfig.accentColor
	);

	root.style.setProperty(
		'--navbar-color',
		themeConfig.navbarColor
	);

	root.style.setProperty(
		'--navbar-text-color',
		themeConfig.navbarTextColor
	);

	root.style.setProperty(
		'--background-color',
		themeConfig.backgroundColor
	);

	root.style.setProperty(
		'--text-color',
		themeConfig.textColor
	);


	/* ==============================
	   REMOVE TEMA ANTIGO
	   ============================== */

	root.classList.remove('theme-light');
	root.classList.remove('theme-dark');
	root.classList.remove('dark');


	/* ==============================
	   APLICA NOVO TEMA
	   ============================== */

	root.classList.add(`theme-${theme}`);


	/*
	 * O Tailwind/Flowbite usa .dark
	 * para vários componentes.
	 */

	if (theme === 'dark') {
		root.classList.add('dark');
	}


	/* ==============================
	   TRANSIÇÃO
	   ============================== */

	void root.offsetHeight;
}


/*
 * Aplica o tema salvo assim que
 * o navegador estiver disponível.
 */

if (typeof document !== 'undefined') {

	const initialTheme = getInitialTheme();

	applyTheme(initialTheme);
}


export const themeStore = createThemeStore();