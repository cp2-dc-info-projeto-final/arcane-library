<script lang="ts">
  import ThemeModal from './ThemeModal.svelte';
  import { Navbar, NavBrand, NavLi, NavUl, NavHamburger, Heading} from "flowbite-svelte";
  import { onMount } from "svelte";
  import { logout, getCurrentUser, getToken, type User } from "$lib/auth";
  import { goto } from "$app/navigation";
  import { ArrowRightToBracketOutline } from "flowbite-svelte-icons";
  import { page } from "$app/stores";
  import { themeStore, themes, type Season } from "$lib/themeStore";
  
  let user: User | null = null;
  let hasToken = false;
  let loadingUser = false;
  let authRequestId = 0;
  let currentTheme: Season = 'spring';
  let navbarColor = '#d97706';

  // Subscribe to theme changes
  themeStore.subscribe((theme) => {
    currentTheme = theme;
    navbarColor = themes[theme].navbarColor;
  });

  // Verifica token sincronamente (instantâneo)
  async function updateAuthStatus() {
    hasToken = getToken() !== null;

    if (!hasToken) {
      user = null;
      loadingUser = false;
      return;
    }

    if (user || loadingUser) {
      return;
    }

    loadingUser = true;
    const requestId = ++authRequestId;

    try {
      const userData = await getCurrentUser();
      if (requestId !== authRequestId) {
        return;
      }
      user = userData;
      hasToken = userData !== null;
    } catch {
      if (requestId !== authRequestId) {
        return;
      }
      user = null;
      hasToken = false;
    } finally {
      if (requestId === authRequestId) {
        loadingUser = false;
      }
    }
  }

  // Reativo à mudança de página
  $: if ($page.url.pathname) {
    void updateAuthStatus();
  }

  onMount(() => {
    void updateAuthStatus();
  });

  // função para logout (só apaga o token)
  async function handleLogout() {
    try {
      authRequestId += 1;
      await logout();
      user = null;
      hasToken = false;
      loadingUser = false;
      goto('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }
</script>

<div class="relative px-8">
	<Navbar class="fixed start-0 top-0 z-20 w-full px-2 py-3 sm:px-4 transition-all duration-300 shadow-xl navbar-theme" style="background: linear-gradient(135deg, {navbarColor} 0%, color-mix(in srgb, {navbarColor} 80%, black) 100%); backdrop-filter: blur(10px);">
		<NavBrand href="/">
			<img src="/images/arcaneL.png" class="me-4 h-10 sm:h-14 transition-all duration-300 hover:scale-110 drop-shadow-lg" alt="Logo Arcane Library" />
			<Heading class="self-center text-2xl sm:text-3xl font-bold whitespace-nowrap text-amber-100 dark:text-amber-50 arcane-title drop-shadow-md"
				>Arcane Library</Heading
			>
		</NavBrand>
    <NavHamburger />
    <NavUl>
      <NavLi href="/" class="text-base sm:text-lg font-bold px-4 py-2 text-amber-100 dark:text-amber-50 hover:text-yellow-300 hover:opacity-100 focus:text-yellow-400 focus:opacity-100 transition-all rounded-lg">Home</NavLi>
      <NavLi href="/about" class="text-base sm:text-lg font-bold px-4 py-2 text-amber-100 dark:text-amber-50 hover:text-yellow-300 hover:opacity-100 focus:text-yellow-400 focus:opacity-100 transition-all rounded-lg">Sobre</NavLi>
      <NavLi href="/editar_perfil" class="text-base sm:text-lg font-bold px-4 py-2 text-amber-100 dark:text-amber-50 hover:text-yellow-300 hover:opacity-100 focus:text-yellow-400 focus:opacity-100 transition-all rounded-lg">Perfil</NavLi>
      
      {#if hasToken}
        {#if user} <!-- se existir usuário é porque conseguiu logar-->
          {#if user.role === 'admin'} <!-- só exibe menu usuários para admin-->
            <NavLi href="/users" class="text-base sm:text-lg font-bold px-4 py-2 text-amber-100 dark:text-amber-50 hover:text-yellow-300 hover:opacity-100 focus:text-yellow-400 focus:opacity-100 transition-all rounded-lg">Usuários</NavLi>
          {/if}
          <NavLi>
            <div class="flex items-center gap-3">
              <span class="text-amber-100 dark:text-amber-50 px-4 py-2 text-sm sm:text-base">Olá, {user.login}</span>
              <button 
                class="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-lg hover:shadow-xl"
                on:click={handleLogout}
              >
                <ArrowRightToBracketOutline class="w-4 h-4" />
                <span class="hidden sm:inline">Sair</span>
              </button>
            </div>
          </NavLi>
        {:else if loadingUser}
          <NavLi class="text-base sm:text-lg font-bold px-4 py-2 text-amber-100 dark:text-amber-50">Carregando...</NavLi>
        {:else}
          <NavLi href="/login" class="text-base sm:text-lg font-bold px-4 py-2 text-amber-100 dark:text-amber-50 hover:text-yellow-300 hover:opacity-100 focus:text-yellow-400 focus:opacity-100 transition-all rounded-lg">Login</NavLi>
        {/if}
      {:else}
        <!-- se não tem token, exibe botão de login-->
        <NavLi href="/login" class="text-base sm:text-lg font-bold px-4 py-2 text-amber-100 dark:text-amber-50 hover:text-yellow-300 hover:opacity-100 focus:text-yellow-400 focus:opacity-100 transition-all rounded-lg">Login</NavLi>
      {/if}

		<!-- Theme selector button when logged in -->
		{#if hasToken}
			<NavLi>
			<ThemeModal />
			</NavLi>
		{/if}
    </NavUl>
  </Navbar>
</div>

<style>
  :global(.arcane-title) {
    font-family: 'Baskerville Old Face', 'Baskerville', Georgia, serif !important;
    font-style: italic;
    letter-spacing: 0.05em;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  :global(.navbar-theme) {
    border-bottom: 3px solid rgba(255, 255, 255, 0.1);
  }

  :global(.theme-spring) {
    --color-primary-500: #1f7459;
    --color-secondary-500: #fbbf24;
    --color-accent-500: #ec4899;
    --color-navbar-500: #065f46;
    --color-navbar-hover-500: #059669;
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
