<script lang="ts">
	import { Modal, Button, Badge } from 'flowbite-svelte';
	import { PaletteOutline } from 'flowbite-svelte-icons';
	import { themeStore, themes, type Season } from '$lib/themeStore';
	
	let openModal = false;
	let currentTheme: Season = 'spring';

	themeStore.subscribe((theme) => {
		currentTheme = theme;
	});

	function handleThemeChange(theme: Season) {
		themeStore.set(theme);
		currentTheme = theme;
	}

	function getThemeEmoji(season: Season): string {
		const emojis: Record<Season, string> = {
			spring: '🌸',
			summer: '☀️',
			autumn: '🍂',
			winter: '❄️'
		};
		return emojis[season];
	}
</script>

<div>
	<!-- Theme Toggle Button -->
	<button
		on:click={() => (openModal = true)}
		class="flex items-center gap-2 px-3 py-1 rounded text-black-100 hover:text-yellow-300 hover:opacity-80 transition-all font-medium"
		title="Trocar tema"
	>
		<PaletteOutline class="w-5 h-5" color="black" />
		<span class="hidden sm:inline text-sm">Tema</span>
	</button>

	<!-- Theme Modal -->
	<Modal bind:open={openModal} size="lg" title="Escolha seu Tema" outsideclose>
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			{#each Object.entries(themes) as [key, theme] (key)}
				<button
					on:click={() => handleThemeChange(key as Season)}
					class="p-4 rounded-lg border-2 transition-all {currentTheme === key
						? 'border-black-900 dark:border-white bg-black-50 dark:bg-black-700 shadow-lg'
						: 'border-black-300 dark:border-black-600 hover:border-black-500 dark:hover:border-black-400'}"
				>
					<div class="text-center">
						<div class="text-3xl mb-2">{getThemeEmoji(key as Season)}</div>
						<p class="font-semibold text-sm text-black-900 dark:text-white mb-2">{theme.label}</p>

						<!-- Color Palette Preview -->
						<div class="flex gap-1 justify-center mb-2">
							<div
								class="w-6 h-6 rounded-full border border-black-300"
								style="background-color: {theme.primaryColor};"
								title={theme.primaryColor}
							></div>
							<div
								class="w-6 h-6 rounded-full border border-black-300"
								style="background-color: {theme.secondaryColor};"
								title={theme.secondaryColor}
							></div>
							<div
								class="w-6 h-6 rounded-full border border-black-300"
								style="background-color: {theme.accentColor};"
								title={theme.accentColor}
							></div>
							<div
								class="w-6 h-6 rounded-full border-2 border-black-400"
								style="background-color: {theme.navbarColor};"
								title="Cor da Navbar"
							></div>
						</div>

						{#if currentTheme === key}
							<Badge color="green" class="text-xs">Ativo</Badge>
						{/if}
					</div>
				</button>
			{/each}
		</div>

		<!-- Current Theme Colors -->
		<div class="mt-6 p-4 bg-black-100 dark:bg-black-800 rounded-lg">
			<h3 class="font-semibold text-black-900 dark:text-white mb-3">Cores do Tema Atual:</h3>
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<span class="text-sm text-black-700 dark:text-black-300">Cor Primária:</span>
					<div class="flex items-center gap-2">
						<div
							class="w-8 h-8 rounded border border-black-300"
							style="background-color: {themes[currentTheme].primaryColor};"
						></div>
						<code class="text-xs bg-black-200 dark:bg-black-700 px-2 py-1 rounded">
							{themes[currentTheme].primaryColor}
						</code>
					</div>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-black-700 dark:text-black-300">Cor Secundária:</span>
					<div class="flex items-center gap-2">
						<div
							class="w-8 h-8 rounded border border-black-300"
							style="background-color: {themes[currentTheme].secondaryColor};"
						></div>
						<code class="text-xs bg-black-200 dark:bg-black-700 px-2 py-1 rounded">
							{themes[currentTheme].secondaryColor}
						</code>
					</div>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-black-700 dark:text-black-300">Cor de Destaque:</span>
					<div class="flex items-center gap-2">
						<div
							class="w-8 h-8 rounded border border-black-300"
							style="background-color: {themes[currentTheme].accentColor};"
						></div>
						<code class="text-xs bg-black-200 dark:bg-black-700 px-2 py-1 rounded">
							{themes[currentTheme].accentColor}
						</code>
					</div>
				</div>
				<div class="flex items-center justify-between pt-2 border-t border-black-300 dark:border-black-600">
					<span class="text-sm text-black-700 dark:text-black-300 font-semibold">Cor da Navbar:</span>
					<div class="flex items-center gap-2">
						<div
							class="w-8 h-8 rounded border-2 border-black-400"
							style="background-color: {themes[currentTheme].navbarColor};"
						></div>
						<code class="text-xs bg-black-200 dark:bg-black-700 px-2 py-1 rounded">
							{themes[currentTheme].navbarColor}
						</code>
					</div>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-black-700 dark:text-black-300">Navbar Hover:</span>
					<div class="flex items-center gap-2">
						<div
							class="w-8 h-8 rounded border border-black-300"
							style="background-color: {themes[currentTheme].navbarHoverColor};"
						></div>
						<code class="text-xs bg-black-200 dark:bg-black-700 px-2 py-1 rounded">
							{themes[currentTheme].navbarHoverColor}
						</code>
					</div>
				</div>
			</div>
		</div>

		<svelte:fragment slot="footer">
			<Button on:click={() => (openModal = false)}>Fechar</Button>
		</svelte:fragment>
	</Modal>
</div>

<style>
	:global(.theme-spring) {
		--color-primary-500: #1f7459;
		--color-secondary-500: #fbbf24;
		--color-accent-500: #ec4899;
		--color-navbar-500: #053528;
		--color-navbar-hover-500: #03fe5f;
	}

	:global(.theme-summer) {
		--color-primary-500: #1d0925;
		--color-secondary-500: #06b6d4;
		--color-accent-500: #f97316;
		--color-navbar-500: #0369a1;
		--color-navbar-hover-500: #0284c7;
	}

	:global(.theme-autumn) {
		--color-primary-500: #1a0505;
		--color-secondary-500: #f97316;
		--color-accent-500: #b45309;
		--color-navbar-500: #7c2d12;
		--color-navbar-hover-500: #9a3412;
	}

	:global(.theme-winter) {
		--color-primary-500: #0ea5e9;
		--color-secondary-500: #60a5fa;
		--color-accent-500: #1e224b;
		--color-navbar-500: #1e3a8a;
		--color-navbar-hover-500: #1e40af;
	}
</style>
