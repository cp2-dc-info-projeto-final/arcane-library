<script lang="ts">
	import { themeStore } from '$lib/themeStore';
	import { SunOutline, MoonOutline } from 'flowbite-svelte-icons';

	let isDark = false;

	themeStore.subscribe((theme) => {
		isDark = theme === 'dark';
	});


	function toggleTheme() {
		themeStore.toggle();
	}
</script>


<button
	type="button"
	class="theme-toggle"
	on:click={toggleTheme}
	aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
	title={isDark ? 'Tema claro' : 'Tema escuro'}
>
	{#if isDark}

		<SunOutline class="theme-icon" />

	{:else}

		<MoonOutline class="theme-icon" />

	{/if}
</button>


<style>

	.theme-toggle {

		display: flex;

		align-items: center;

		justify-content: center;

		width: 42px;

		height: 42px;

		border: 1px solid #c9a45c;

		border-radius: 50%;

		background: transparent;

		color: #967237;

		cursor: pointer;

		transition:
			transform 0.25s ease,
			background-color 0.25s ease,
			color 0.25s ease;

	}


	.theme-toggle:hover {

		transform: rotate(15deg) scale(1.08);

		background: #c9a45c;

		color: #080d14;

	}


	.theme-icon {

		width: 21px;

		height: 21px;

	}


	:global(.dark) .theme-toggle {

		color: #e4c77a;

		border-color: #c9a45c;

	}


	:global(.dark) .theme-toggle:hover {

		background: #c9a45c;

		color: #080d14;

	}

</style>