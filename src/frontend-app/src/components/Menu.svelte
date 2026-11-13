
<script lang="ts">
  import ThemeModal from './ThemeModal.svelte';
  import { onMount } from 'svelte';
  import { logout, getCurrentUser, getToken, type User } from '$lib/auth';
  import { goto } from '$app/navigation';

  import {
    ArrowRightToBracketOutline,
    EditOutline,
    BookOutline,
    GridOutline,
    UsersOutline,
    PenNibOutline
  } from 'flowbite-svelte-icons';

  import { page } from '$app/stores';

  let user: User | null = null;
  let hasToken = false;
  let loadingUser = false;
  let authRequestId = 0;
  let menuOpen = false;

  async function updateAuthStatus() {
    hasToken = getToken() !== null;

    if (!hasToken) {
      user = null;
      loadingUser = false;
      return;
    }

    if (user || loadingUser) return;

    loadingUser = true;
    const requestId = ++authRequestId;

    try {
      const userData = await getCurrentUser();

      if (requestId !== authRequestId) return;

      user = userData;
      hasToken = userData !== null;
    } catch {
      if (requestId !== authRequestId) return;

      user = null;
      hasToken = false;
    } finally {
      if (requestId === authRequestId) {
        loadingUser = false;
      }
    }
  }

  $: if ($page.url.pathname) {
    menuOpen = false;
    void updateAuthStatus();
  }

  onMount(() => {
    void updateAuthStatus();
  });

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  async function handleLogout() {
    try {
      authRequestId += 1;
      await logout();

      user = null;
      hasToken = false;
      loadingUser = false;
      menuOpen = false;

      await goto('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  }

  function getFotoUrl(foto: string | null | undefined): string {
  if (!foto) return '';

  if (
    foto.startsWith('data:') ||
    foto.startsWith('http') ||
    foto.startsWith('/')
  ) {
    return foto;
  }

  return `http://localhost:3000/uploads/${foto}`;
    }
</script>

<!-- NAVBAR -->
<header class="arcane-navbar">

  <!-- LOGO -->
  <a href="/" class="arcane-brand">
    <img
      src="/images/arcaneL.png"
      class="arcane-logo-image"
      alt="Logo Arcane Library"
    />

    <span class="arcane-title">
      Arcane Library
    </span>
  </a>

  <!-- BOTÃO HAMBURGUER -->
  <button
    type="button"
    class="arcane-menu-toggle"
    class:active={menuOpen}
    aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
    aria-expanded={menuOpen}
    aria-controls="arcane-navigation"
    onclick={toggleMenu}
  >
    <span></span>
    <span></span>
    <span></span>
  </button>

  <!-- NAVEGAÇÃO -->
  <nav
    id="arcane-navigation"
    class="arcane-navigation"
    class:menu-open={menuOpen}
    aria-label="Navegação principal"
  >
    <ul class="arcane-nav-links">

      <li>
        <a href="/" class="arcane-nav-link">Início</a>
      </li>

      <li>
        <a href="/about" class="arcane-nav-link">Sobre</a>
      </li>

      {#if hasToken}

        {#if user}

          {#if user.role !== 'admin'}

            <li>
              <a href="/livro_users" class="arcane-nav-link">
                <BookOutline class="nav-icon" />
                Livros
              </a>
            </li>

            <li>
              <a href="/emprestimos_users" class="arcane-nav-link">
                <img src="/images/emprestimo.png" class="nav-icon emprestimo-icon" alt="" />
                Empréstimos
              </a>
            </li>

          {/if}

          
          {#if user.role === 'admin'}

            <li>
              <a href="/emprestimos" class="arcane-nav-link">
                <img src="/images/emprestimo.png" class="nav-icon emprestimo-icon" alt="" />
                Empréstimos Ad
              </a>
            </li>

            <li>
              <a href="/autores" class="arcane-nav-link">
                <PenNibOutline class="nav-icon" />
                Autores Ad
              </a>
            </li>

            <li>
              <a href="/livros" class="arcane-nav-link">
                <BookOutline class="nav-icon" />
                Livros Ad
              </a>
            </li>

            <li>
              <a href="/categorias" class="arcane-nav-link">
                <GridOutline class="nav-icon" />
                Categorias Ad
              </a>
            </li>

            <li>
              <a href="/users" class="arcane-nav-link">
                <UsersOutline class="nav-icon" />
                Users Ad
              </a>
            </li>

          {/if}
          <li class="profile-photo-item">
            <a
              href={`/perfil/${user.id}`}
              class="profile-photo-link"
              aria-label="Abrir meu perfil"
              title="Meu perfil"
            >
              {#if user.foto}
                <img
                  src={getFotoUrl(user.foto)}
                  alt={`Foto de ${user.login}`}
                  class="navbar-user-photo"
                />
              {:else}
                <span class="navbar-user-placeholder">
                  {user.login.charAt(0).toUpperCase()}
                </span>
              {/if}
            </a>
          </li>

          <!-- USUÁRIO -->
          <li class="user-menu-item">
            <div class="user-area">

              <span class="user-name">
                Olá, {user.login}
              </span>

              <button
                class="logout-button"
                onclick={handleLogout}
                aria-label="Sair"
              >
                <ArrowRightToBracketOutline class="logout-icon" />
                <span>Sair</span>
              </button>

            </div>
          </li>

        {:else if loadingUser}

          <li class="arcane-nav-link">
            Carregando...
          </li>

        {:else}

          <li>
            <a href="/login" class="arcane-nav-link">Login</a>
          </li>

        {/if}

      {:else}

        <li>
          <a href="/login" class="arcane-nav-link">Login</a>
        </li>

      {/if}

      <!-- TEMA -->
      {#if hasToken}
        <li class="theme-menu-item">
          <div class="theme-area">
            <ThemeModal />
          </div>
        </li>
      {/if}

    </ul>
  </nav>

</header>

<style>
/* TEMA CLARO */
/* ÍCONE DE EMPRÉSTIMOS - TEMA CLARO */
.emprestimo-icon {
  filter: brightness(0);
  transition: filter 0.3s ease;
}

/* ÍCONE DE EMPRÉSTIMOS - TEMA ESCURO */
:global(.dark) .emprestimo-icon {
  filter: brightness(0) invert(1);
}

  /* =====================================
     NAVBAR PRINCIPAL
  ===================================== */

  .arcane-navbar {
    position: fixed;
    inset: 0 0 auto 0;
    z-index: 9999;

    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;

    width: 100%;
    min-height: 64px;
    padding: 8px 24px;

    background: rgba(250, 247, 239, 0.97);
    border-bottom: 1px solid #d6c6a5;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
    backdrop-filter: blur(12px);
  }

  :global(.dark) .arcane-navbar {
    background: rgba(8, 13, 20, 0.97);
    border-bottom-color: #51432e;
    box-shadow: 0 4px 25px rgba(0, 0, 0, 0.5);
  }

  /* =====================================
     LOGO E TÍTULO
  ===================================== */

  .arcane-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    text-decoration: none;
  }

  .arcane-logo-image {
    width: 45px;
    height: 45px;
    flex-shrink: 0;
    object-fit: contain;
    transition: transform 0.3s ease;
  }

  .arcane-logo-image:hover {
    transform: scale(1.08);
  }

  .arcane-title {
    color: #10243a;
    font-family: 'Baskerville Old Face', 'Baskerville', Georgia, serif;
    font-size: clamp(1.25rem, 2vw, 2rem);
    font-style: italic;
    font-weight: 700;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  :global(.dark) .arcane-title {
    color: #f1e9d6;
  }

  /* =====================================
     BOTÃO HAMBURGUER
  ===================================== */

  .arcane-menu-toggle {
    display: inline-flex;
    width: 44px;
    height: 44px;
    flex-shrink: 0;

    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;

    border: 1px solid rgba(181, 141, 69, 0.55);
    border-radius: 8px;
    background: rgba(201, 164, 92, 0.12);

    cursor: pointer;
  }

  .arcane-menu-toggle span {
    display: block;
    width: 21px;
    height: 2px;
    border-radius: 2px;

    background: #10243a;

    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  :global(.dark) .arcane-menu-toggle span {
    background: #f1e9d6;
  }

  .arcane-menu-toggle.active span:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }

  .arcane-menu-toggle.active span:nth-child(2) {
    opacity: 0;
  }

  .arcane-menu-toggle.active span:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }

  /* =====================================
     MENU MOBILE E TELAS MÉDIAS
     VERTICAL
  ===================================== */

  .arcane-navigation {
    display: none;

    position: absolute;
    top: 100%;
    left: 0;
    right: 0;

    width: 100%;
    max-height: calc(100vh - 76px);
    overflow-y: auto;

    padding: 12px 16px 18px;

    background: rgba(250, 247, 239, 0.99);
    border-top: 1px solid rgba(181, 141, 69, 0.35);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.14);
  }

  :global(.dark) .arcane-navigation {
    background: rgba(8, 13, 20, 0.99);
    border-top-color: #51432e;
  }

  .arcane-navigation.menu-open {
    display: block;
  }

  /* Lista vertical */

  .arcane-nav-links {
    display: flex !important;

    flex-direction: column !important;
    flex-wrap: nowrap !important;
    align-items: stretch !important;
    justify-content: flex-start !important;

    width: 100%;
    gap: 2px;

    margin: 0;
    padding: 0;

    list-style: none;
  }

  .arcane-nav-links > li {
    display: block;
    width: 100%;
    flex: 0 0 auto;
  }

  /* Links */

  .arcane-nav-link {
    display: flex;
    width: 100%;
    min-height: 42px;

    align-items: center;
    justify-content: flex-start;
    gap: 8px;

    padding: 10px 12px;

    border-radius: 6px;

    color: #10243a;
    font-family: 'Baskerville Old Face', 'Baskerville', Georgia, serif;
    font-size: 1rem;
    font-weight: 600;

    text-align: left;
    text-decoration: none;
    white-space: normal;

    transition: color 0.2s ease, background-color 0.2s ease;
  }

  .arcane-nav-link:hover {
    color: #967237;
    background: rgba(201, 164, 92, 0.12);
  }

  :global(.dark) .arcane-nav-link {
    color: #f1e9d6;
  }

  :global(.dark) .arcane-nav-link:hover {
    color: #e4c77a;
    background: rgba(201, 164, 92, 0.10);
  }

  /* =====================================
     ÍCONES
  ===================================== */

  .nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: #967237;
  }

  :global(.dark) .nav-icon {
    color: #c9a45c;
  }

  /* =====================================
     USUÁRIO E LOGOUT
  ===================================== */

  .user-area {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
  }

  .user-name {
    color: #10243a;
    font-size: 0.95rem;
    overflow-wrap: anywhere;
  }

  :global(.dark) .user-name {
    color: #f1e9d6;
  }

  .logout-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;

    padding: 9px 16px;

    border: 1px solid #b58d45;
    border-radius: 4px;

    background: #c9a45c;
    color: #080d14;

    font-weight: 700;
    cursor: pointer;

    transition: background-color 0.2s ease, transform 0.2s ease;
  }

  .logout-button:hover {
    background: #e4c77a;
    transform: translateY(-1px);
  }

  .logout-icon {
    width: 17px;
    height: 17px;
  }

  /* =====================================
     SELETOR DE TEMA
  ===================================== */

  .theme-area {
    display: flex;
    align-items: center;
    padding: 8px 12px;
  }

  /* =====================================
     CELULARES PEQUENOS
  ===================================== */

  @media screen and (max-width: 420px) {
    .arcane-navbar {
      padding-left: 12px;
      padding-right: 12px;
    }

    .arcane-logo-image {
      width: 38px;
      height: 38px;
    }

    .arcane-title {
      font-size: 1.2rem;
    }

    .arcane-menu-toggle {
      width: 40px;
      height: 40px;
    }
  }

  /* =====================================
     DESKTOP
     SOMENTE A PARTIR DE 1200px
  ===================================== */

  @media screen and (min-width: 1200px) {

    .arcane-navbar {
      flex-wrap: nowrap;
    }

    /* Esconde hamburguer */

    .arcane-menu-toggle {
      display: none;
    }

    /* Menu horizontal */

    .arcane-navigation,
    .arcane-navigation.menu-open {
      position: static;

      display: block;

      width: auto;
      max-height: none;
      overflow: visible;

      flex: 1 1 auto;

      margin-left: 20px;
      padding: 0;

      border: 0;
      background: transparent;
      box-shadow: none;
    }

    .arcane-nav-links {
      flex-direction: row !important;
      flex-wrap: nowrap !important;
      align-items: center !important;
      justify-content: flex-end !important;

      width: 100%;
      gap: 2px;
    }

    .arcane-nav-links > li {
      display: flex;
      width: auto;
      flex: 0 0 auto;
    }

    .arcane-nav-link {
      width: auto;
      min-height: 0;
      padding: 8px 9px;
      font-size: 0.94rem;
      white-space: nowrap;
    }

    .user-area {
      flex-direction: row;
      align-items: center;
      padding: 0 6px;
    }

    .theme-area {
      padding: 0 6px;
    }
  }

  /* =====================================
     ACESSIBILIDADE
  ===================================== */

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
    }
  }
  /* FOTO DO USUÁRIO NA NAVBAR */

.profile-photo-item {
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-photo-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 43px;
  height: 43px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #c9a45c;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.profile-photo-link:hover {
  transform: scale(1.08);
  border-color: #967237;
}

.navbar-user-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.navbar-user-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #c9a45c;
  color: #10243a;
  font-size: 1.2rem;
  font-weight: bold;
}
</style>
