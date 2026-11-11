
<script lang="ts">
	import '../app.css';
	import Menu from '../components/Menu.svelte';
	import { onMount } from 'svelte';
	import { themeStore, applyTheme } from '$lib/themeStore';
  
	let { children } = $props();
  
	onMount(() => {
	  const unsubscribe = themeStore.subscribe((theme) => {
		applyTheme(theme);
	  });
  
	  return unsubscribe;
	});
  </script>
  
  <main class="theme-background min-h-screen w-full">
	<Menu />
  
	<div class="page-content">
	  {@render children()}
	</div>
  </main>
  
  <style>
	:global(html),
	:global(body) {
	  width: 100%;
	  min-height: 100%;
	  margin: 0;
	}
  
	:global(html) {
	  transition: background 0.5s ease;
	}
  
	:global(body) {
	  overflow-x: hidden;
	}
  
	main {
	  width: 100%;
	  min-height: 100vh;
	  transition: background 0.5s ease;
	}
  
	.page-content {
	  width: 100%;
	  min-width: 0;
	  padding-top: 80px;
	  box-sizing: border-box;
	}
  </style>
  