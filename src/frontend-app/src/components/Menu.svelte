<script lang="ts">
  import ThemeModal from './ThemeModal.svelte';
  import {
    Navbar,
    NavBrand,
    NavLi,
    NavUl,
    NavHamburger,
    Heading
  } from "flowbite-svelte";

  import { onMount } from "svelte";
  import { logout, getCurrentUser, getToken, type User } from "$lib/auth";
  import { goto } from "$app/navigation";

  import {
    ArrowRightToBracketOutline,
    EditOutline,
    BookOutline,
    GridOutline,
    UsersOutline,
    PenNibOutline
  } from "flowbite-svelte-icons";

  import { page } from "$app/stores";

  let user: User | null = null;
  let hasToken = false;
  let loadingUser = false;
  let authRequestId = 0;


  /* =====================================================
     AUTENTICAÇÃO
     ===================================================== */

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


  /* =====================================================
     ATUALIZA AUTENTICAÇÃO AO TROCAR DE PÁGINA
     ===================================================== */

  $: if ($page.url.pathname) {
    void updateAuthStatus();
  }


  onMount(() => {
    void updateAuthStatus();
  });


  /* =====================================================
     LOGOUT
     ===================================================== */

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


<!-- =====================================================
     NAVBAR
     ===================================================== -->

<div class="navbar-wrapper">

  <Navbar class="arcane-navbar fixed start-0 top-0 z-50 w-full px-3 py-3 sm:px-6">

    <NavBrand href="/" class="arcane-brand">

      <img
        src="/images/arcaneL.png"
        class="arcane-logo-image"
        alt="Logo Arcane Library"
      />

      <Heading class="arcane-title">
        Arcane Library
      </Heading>

    </NavBrand>


    <NavHamburger />


    <NavUl class="arcane-nav-links">

      <!-- INÍCIO -->

      <NavLi
        href="/"
        class="arcane-nav-link"
      >
        Início
      </NavLi>


      <!-- SOBRE -->

      <NavLi
        href="/about"
        class="arcane-nav-link"
      >
        Sobre
      </NavLi>


      <!-- =================================================
           USUÁRIO LOGADO
           ================================================= -->

      {#if hasToken}

        {#if user}

          <!-- USUÁRIO NORMAL -->

          {#if user.role !== 'admin'}

            <NavLi
              href="/livro_users"
              class="arcane-nav-link"
            >
              <BookOutline class="nav-icon" />
              Livros
            </NavLi>
            <NavLi
              href="/emprestimos_users"
              class="arcane-nav-link"
            >
              <img
                src="/images/emprestimo.png"
                class="nav-icon"
                alt=""
              />
              Empréstimos
            </NavLi>+
          {/if}


          <!-- PERFIL -->

          <NavLi
            href="/editar_perfil"
            class="arcane-nav-link"
          >
            <EditOutline class="nav-icon" />
            Perfil
          </NavLi>


          <!-- =================================================
               MENU ADMIN
               ================================================= -->

          {#if user.role === 'admin'}

            <NavLi
              href="/emprestimos"
              class="arcane-nav-link"
            >
              <img
                src="/images/emprestimo.png"
                class="nav-icon"
                alt=""
              />

              Empréstimos Ad
            </NavLi>


            <NavLi
              href="/autores"
              class="arcane-nav-link"
            >
              <PenNibOutline class="nav-icon" />
              Autores Ad
            </NavLi>


            <NavLi
              href="/livros"
              class="arcane-nav-link"
            >
              <BookOutline class="nav-icon" />
              Livros Ad
            </NavLi>


            <NavLi
              href="/categorias"
              class="arcane-nav-link"
            >
              <GridOutline class="nav-icon" />
              Categorias Ad
            </NavLi>


            <NavLi
              href="/users"
              class="arcane-nav-link"
            >
              <UsersOutline class="nav-icon" />
              Users Ad
            </NavLi>

          {/if}


          <!-- =================================================
               USUÁRIO + LOGOUT
               ================================================= -->

          <NavLi>

            <div class="user-area">

              <span class="user-name">
                Olá, {user.login}
              </span>


              <button
                class="logout-button"
                on:click={handleLogout}
                aria-label="Sair"
              >

                <ArrowRightToBracketOutline class="logout-icon" />

                <span>
                  Sair
                </span>

              </button>

            </div>

          </NavLi>


        {:else if loadingUser}

          <NavLi class="arcane-nav-link">
            Carregando...
          </NavLi>


        {:else}

          <NavLi
            href="/login"
            class="arcane-nav-link"
          >
            Login
          </NavLi>

        {/if}


      {:else}

        <!-- USUÁRIO NÃO LOGADO -->

        <NavLi
          href="/login"
          class="arcane-nav-link"
        >
          Login
        </NavLi>

      {/if}


      <!-- =================================================
           TEMA
           ================================================= -->

      {#if hasToken}

        <NavLi>

          <div class="theme-area">

            <ThemeModal />

          </div>

        </NavLi>

      {/if}

    </NavUl>

  </Navbar>

</div>


<!-- =====================================================
     HOME
     ===================================================== -->

<main class="arcane-home">


  <!-- ===================================================
       HERO
       =================================================== -->

  <section class="library-hero">

    <div class="hero-overlay"></div>


    <div class="library-hero-content">

      <p class="hero-small-title">
        
      </p>


      <h1 class="hero-title">
        ARCANE
        <span>LIBRARY</span>
      </h1>


      <div class="hero-line"></div>


      <p class="hero-description">

        Um refúgio para conhecimento, inspiração
        e descobertas.

        <br />

        Entre em um mundo onde cada livro
        guarda uma nova história.

      </p>


      <div class="hero-buttons">

        <a
          href="/livro_users"
          class="arcane-button"
        >
          Explorar livros
        </a>


        <a
          href="/about"
          class="arcane-button-outline"
        >
          Conheça a biblioteca
        </a>

      </div>

    </div>

  </section>


  <!-- ===================================================
       INTRODUÇÃO
       =================================================== -->

  <section class="intro-section">

    <div class="intro-content">

      <p class="section-label">
        ARCANE LIBRARY
      </p>


      <h2>
        Onde histórias ganham vida
      </h2>


      <div class="gold-line"></div>


      <p>

        A Arcane Library é mais do que uma biblioteca.
        É um espaço dedicado ao conhecimento, à leitura
        e à descoberta.

      </p>


      <p>

        Aqui, cada livro representa uma nova possibilidade:
        aprender algo novo, conhecer diferentes mundos
        e encontrar histórias que permanecem conosco.

      </p>

    </div>

  </section>


  <!-- ===================================================
       DESTAQUES
       =================================================== -->

  <section class="books-section">

    <div class="section-header">

      <p class="section-label">
        EXPLORE
      </p>


      <h2>
        Encontre sua próxima história
      </h2>


      <p>
        Explore nosso catálogo e descubra novos livros.
      </p>

    </div>


    <div class="quick-actions">

      <a
        href="/livro_users"
        class="quick-card"
      >

        <div class="quick-icon">
          <BookOutline />
        </div>


        <div>

          <h3>
            Catálogo
          </h3>

          <p>
            Encontre livros disponíveis
            para empréstimo.
          </p>

        </div>

      </a>


      <a
        href="/emprestimos_users"
        class="quick-card"
      >

        <div class="quick-icon">
          📖
        </div>


        <div>

          <h3>
            Meus empréstimos
          </h3>

          <p>
            Consulte seus livros
            emprestados.
          </p>

        </div>

      </a>


      <a
        href="/about"
        class="quick-card"
      >

        <div class="quick-icon">
          ✦
        </div>


        <div>

          <h3>
            Sobre nós
          </h3>

          <p>
            Conheça a história da
            Arcane Library.
          </p>

        </div>

      </a>

    </div>

  </section>


  <!-- ===================================================
       FRASE FINAL
       =================================================== -->

  <section class="quote-section">

    <div class="quote-decoration">
      ✦
    </div>


    <blockquote>

      "Uma biblioteca não é apenas um lugar
      cheio de livros. É um lugar cheio
      de possibilidades."

    </blockquote>


    <div class="gold-line small"></div>

  </section>


</main>


<!-- =====================================================
     ESTILOS
     ===================================================== -->

<style>

  /* =====================================================
     NAVBAR
     ===================================================== */

  :global(.arcane-navbar) {

    background: rgba(250, 247, 239, 0.97) !important;

    border-bottom:
      1px solid #d6c6a5;

    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.12);

    backdrop-filter:
      blur(12px);

  }


  /* DARK NAVBAR */

  :global(.dark .arcane-navbar) {

    background:
      rgba(8, 13, 20, 0.96) !important;

    border-bottom:
      1px solid #51432e;

    box-shadow:
      0 4px 25px rgba(0, 0, 0, 0.5);

  }


  /* =====================================================
     LOGO
     ===================================================== */

  :global(.arcane-brand) {

    display: flex;

    align-items: center;

    gap: 12px;

  }


  :global(.arcane-logo-image) {

    width: 45px;

    height: 45px;

    object-fit: contain;

    transition:
      transform 0.3s ease;

  }


  :global(.arcane-logo-image:hover) {

    transform:
      scale(1.08);

  }


  :global(.arcane-title) {

    font-family:
      'Baskerville Old Face',
      'Baskerville',
      Georgia,
      serif !important;

    font-size:
      clamp(1.4rem, 2vw, 2rem) !important;

    font-weight:
      700 !important;

    font-style:
      italic;

    letter-spacing:
      0.04em;

    color:
      #10243a !important;

  }


  :global(.dark .arcane-title) {

    color:
      #f1e9d6 !important;

  }


  /* =====================================================
     NAV LINKS
     ===================================================== */

  :global(.arcane-nav-link) {

    display: flex !important;

    align-items: center;

    gap: 6px;

    color:
      #10243a !important;

    font-family:
      'Baskerville Old Face',
      'Baskerville',
      Georgia,
      serif !important;

    font-size:
      1rem !important;

    font-weight:
      600 !important;

    transition:
      color 0.2s ease,
      background-color 0.2s ease;

  }


  :global(.arcane-nav-link:hover) {

    color:
      #967237 !important;

    background:
      rgba(201, 164, 92, 0.12);

  }


  :global(.dark .arcane-nav-link) {

    color:
      #f1e9d6 !important;

  }


  :global(.dark .arcane-nav-link:hover) {

    color:
      #e4c77a !important;

    background:
      rgba(201, 164, 92, 0.10);

  }


  /* =====================================================
     ÍCONES
     ===================================================== */

  :global(.nav-icon) {

    width: 20px;

    height: 20px;

    flex-shrink: 0;

    color:
      #967237;

  }


  :global(.dark .nav-icon) {

    color:
      #c9a45c;

  }


  /* =====================================================
     USUÁRIO
     ===================================================== */

  .user-area {

    display: flex;

    align-items: center;

    gap: 12px;

  }


  .user-name {

    color:
      #10243a;

    font-size:
      0.95rem;

  }


  :global(.dark .user-name) {

    color:
      #f1e9d6;

  }


  /* =====================================================
     LOGOUT
     ===================================================== */

  .logout-button {

    display: flex;

    align-items: center;

    gap: 7px;

    padding:
      9px 16px;

    border:
      1px solid #b58d45;

    border-radius:
      4px;

    background:
      #c9a45c;

    color:
      #080d14;

    font-weight:
      700;

    transition:
      background-color 0.2s ease,
      transform 0.2s ease;

  }


  .logout-button:hover {

    background:
      #e4c77a;

    transform:
      translateY(-1px);

  }


  .logout-icon {

    width:
      17px;

    height:
      17px;

  }


  /* =====================================================
     HOME
     ===================================================== */

  .arcane-home {

    min-height:
      100vh;

    background:
      #f4efe4;

    color:
      #10243a;

  }


  :global(.dark .arcane-home) {

    background:
      #080d14;

    color:
      #f1e9d6;

  }


  /* =====================================================
     HERO
     ===================================================== */

  .library-hero {

    position:
      relative;

    min-height:
      700px;

    display:
      flex;

    align-items:
      center;

    overflow:
      hidden;

    padding:
      120px 7% 80px;

    background-image:
      url("/images/library-light.jpg");

    background-size:
      cover;

    background-position:
      center;

    background-repeat:
      no-repeat;

  }


  /* HERO ESCURO */

  :global(.dark) .library-hero {

    background-image:
      url("/images/library-dark.jpg");

  }


  /* =====================================================
     OVERLAY
     ===================================================== */

  .hero-overlay {

    position:
      absolute;

    inset:
      0;

    background:
      linear-gradient(
        90deg,
        rgba(244, 239, 228, 0.97) 0%,
        rgba(244, 239, 228, 0.82) 32%,
        rgba(244, 239, 228, 0.38) 65%,
        rgba(244, 239, 228, 0.08) 100%
      );

  }


  :global(.dark) .hero-overlay {

    background:
      linear-gradient(
        90deg,
        rgba(8, 13, 20, 0.96) 0%,
        rgba(8, 13, 20, 0.82) 32%,
        rgba(8, 13, 20, 0.42) 65%,
        rgba(8, 13, 20, 0.12) 100%
      );

  }


  /* =====================================================
     HERO CONTENT
     ===================================================== */

  .library-hero-content {

    position:
      relative;

    z-index:
      2;

    max-width:
      680px;

  }


  .hero-small-title {

    margin-bottom:
      12px;

    color:
      #967237;

    font-size:
      0.9rem;

    font-weight:
      700;

    letter-spacing:
      0.25em;

  }


  :global(.dark) .hero-small-title {

    color:
      #e4c77a;

  }


  .hero-title {

    margin:
      0;

    font-family:
      'Baskerville Old Face',
      'Baskerville',
      Georgia,
      serif;

    font-size:
      clamp(4rem, 9vw, 8rem);

    line-height:
      0.82;

    letter-spacing:
      0.08em;

    font-weight:
      700;

    color:
      #10243a;

  }


  .hero-title span {

    display:
      block;

    font-size:
      0.65em;

    margin-top:
      12px;

    letter-spacing:
      0.2em;

  }


  :global(.dark) .hero-title {

    color:
      #f1e9d6;

  }


  .hero-line {

    width:
      120px;

    height:
      2px;

    margin:
      30px 0;

    background:
      #c9a45c;

  }


  .hero-description {

    max-width:
      570px;

    font-size:
      1.2rem;

    line-height:
      1.8;

    color:
      #526171;

  }


  :global(.dark) .hero-description {

    color:
      #c1c4c5;

  }


  /* =====================================================
     HERO BUTTONS
     ===================================================== */

  .hero-buttons {

    display:
      flex;

    flex-wrap:
      wrap;

    gap:
      14px;

    margin-top:
      30px;

  }


  .arcane-button {

    display:
      inline-flex;

    align-items:
      center;

    justify-content:
      center;

    padding:
      13px 25px;

    border:
      1px solid #c9a45c;

    border-radius:
      4px;

    background:
      #c9a45c;

    color:
      #080d14;

    font-weight:
      700;

    text-decoration:
      none;

    transition:
      all 0.25s ease;

  }


  .arcane-button:hover {

    background:
      #e4c77a;

    transform:
      translateY(-2px);

  }


  .arcane-button-outline {

    display:
      inline-flex;

    align-items:
      center;

    justify-content:
      center;

    padding:
      13px 25px;

    border:
      1px solid #967237;

    border-radius:
      4px;

    background:
      rgba(255,255,255,0.08);

    color:
      #10243a;

    font-weight:
      700;

    text-decoration:
      none;

    transition:
      all 0.25s ease;

  }


  :global(.dark) .arcane-button-outline {

    color:
      #f1e9d6;

    border-color:
      #c9a45c;

  }


  .arcane-button-outline:hover {

    background:
      #c9a45c;

    color:
      #080d14;

  }


  /* =====================================================
     INTRO
     ===================================================== */

  .intro-section {

    padding:
      100px 7%;

    background:
      #ebe2d1;

    text-align:
      center;

  }


  :global(.dark) .intro-section {

    background:
      #101923;

  }


  .intro-content {

    max-width:
      800px;

    margin:
      0 auto;

  }


  .section-label {

    color:
      #967237;

    font-size:
      0.8rem;

    font-weight:
      700;

    letter-spacing:
      0.2em;

  }


  :global(.dark) .section-label {

    color:
      #c9a45c;

  }


  .intro-content h2,
  .books-section h2 {

    margin:
      12px 0;

    font-size:
      clamp(2rem, 4vw, 3.2rem);

    color:
      #10243a;

  }


  :global(.dark) .intro-content h2,
  :global(.dark) .books-section h2 {

    color:
      #f1e9d6;

  }


  .intro-content p:not(.section-label) {

    margin:
      18px auto;

    font-size:
      1.1rem;

    line-height:
      1.8;

    color:
      #526171;

  }


  :global(.dark) .intro-content p:not(.section-label) {

    color:
      #aeb5bb;

  }


  /* =====================================================
     LINHA DOURADA
     ===================================================== */

  .gold-line {

    width:
      90px;

    height:
      2px;

    margin:
      20px auto;

    background:
      #c9a45c;

  }


  .gold-line.small {

    width:
      60px;

  }


  


  /* =====================================================
     QUICK CARDS
     ===================================================== */

  .quick-actions {

    display:
      grid;

    grid-template-columns:
      repeat(3, 1fr);

    gap:
      24px;

  }


  .quick-card {

    display:
      flex;

    align-items:
      flex-start;

    gap:
      18px;

    padding:
      28px;

    background:
      #fffaf0;

    border:
      1px solid #d6c6a5;

    border-radius:
      5px;

    color:
      #10243a;

    text-decoration:
      none;

    transition:
      all 0.25s ease;

  }


  :global(.dark) .quick-card {

    background:
      #1b1512;

    border-color:
      #51432e;

    color:
      #f1e9d6;

  }


  .quick-card:hover {

    transform:
      translateY(-5px);

    border-color:
      #c9a45c;

    box-shadow:
      0 12px 30px rgba(0,0,0,0.12);

  }


  .quick-icon {

    display:
      flex;

    align-items:
      center;

    justify-content:
      center;

    width:
      50px;

    height:
      50px;

    flex-shrink:
      0;

    border:
      1px solid #c9a45c;

    border-radius:
      50%;

    color:
      #967237;

    font-size:
      1.4rem;

  }


  .quick-card h3 {

    margin:
      0 0 8px;

    font-size:
      1.3rem;

  }


  .quick-card p {

    margin:
      0;

    line-height:
      1.6;

    color:
      #526171;

  }


  :global(.dark) .quick-card p {

    color:
      #9fa7ae;

  }


  /* =====================================================
     QUOTE
     ===================================================== */

  .quote-section {

    padding:
      100px 7%;

    text-align:
      center;

    background:
      #ebe2d1;

  }


  :global(.dark) .quote-section {

    background:
      #101923;

  }


  .quote-decoration {

    color:
      #c9a45c;

    font-size:
      2rem;

  }


  blockquote {

    max-width:
      800px;

    margin:
      25px auto;

    font-size:
      clamp(1.5rem, 3vw, 2.4rem);

    line-height:
      1.5;

    font-style:
      italic;

    color:
      #10243a;

  }


  :global(.dark) blockquote {

    color:
      #f1e9d6;

  }


  /* =====================================================
     RESPONSIVO
     ===================================================== */

  @media (max-width: 1100px) {

    .quick-actions {

      grid-template-columns:
        1fr;

    }

  }


  @media (max-width: 768px) {

    .library-hero {

      min-height:
        650px;

      padding:
        130px 25px 70px;

      background-position:
        center;

    }


    .hero-title {

      font-size:
        clamp(3.5rem, 15vw, 5rem);

    }


    .hero-description {

      font-size:
        1rem;

    }


    .intro-section,
    .books-section,
    .quote-section {

      padding:
        70px 25px;

    }


    .user-name {

      display:
        none;

    }

  }


  @media (max-width: 480px) {

    .library-hero {

      min-height:
        620px;

      padding:
        120px 20px 60px;

    }


    .hero-buttons {

      flex-direction:
        column;

    }


    .arcane-button,
    .arcane-button-outline {

      width:
        100%;

    }


    .hero-title {

      font-size:
        3.2rem;

    }


    .quick-card {

      padding:
        20px;

    }

  }

</style>