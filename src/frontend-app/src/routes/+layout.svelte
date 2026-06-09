

<script lang="ts">
	import '../app.css';
	import Menu from '../components/Menu.svelte';
	import { onMount } from 'svelte';
	import { themeStore, applyTheme } from '$lib/themeStore';
	import type { Season } from '$lib/themeStore';

	let { children } = $props();
	let currentTheme: Season;

	onMount(() => {
		themeStore.subscribe((theme) => {
			currentTheme = theme;
			applyTheme(theme);
		});
	});
</script>


	<main class="flex theme-background flex-col items-center justify-center min-h-screen w-full">
		<Menu />
		<div class="w-full max-w-3xl px-4 md:px-8">
			{@render children()}
		</div>
	</main>



<style>
	:global(html) {
		transition: background 0.5s ease;
	}

	:global(main) {
		transition: background 0.5s ease;
	}
</style>
