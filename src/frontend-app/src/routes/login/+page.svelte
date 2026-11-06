
<script lang="ts">
  import { goto } from "$app/navigation";
  import { login as authLogin } from "$lib/auth";

  let login = "";
  let password = "";
  let loading = false;
  let error = "";
  let showPassword = false;

  async function handleLogin() {
    if (!login.trim() || !password) {
      error = "Por favor, preencha todos os campos.";
      return;
    }

    loading = true;
    error = "";

    try {
      const result = await authLogin({ login, password });

      if (result.success) {
        await goto("/");
      } else {
        error = result.message || "Login ou senha incorretos.";
      }
    } catch (err) {
      error = "Não foi possível conectar ao servidor. Tente novamente.";
      console.error("Erro no login:", err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Entrar | Arcane Library</title>
  <meta
    name="description"
    content="Entre na Arcane Library e descubra seu próximo livro favorito."
  />
</svelte:head>

<div class="login-page">
  <!-- Fundo -->
  <div class="background-image"></div>
  <div class="background-overlay"></div>

  <!-- Conteúdo central -->
  <main class="login-container">
    <!-- Painel de apresentação -->
    <section class="welcome-panel">
      <div class="welcome-content">
        <a href="/" class="brand" aria-label="Arcane Library - Início">
          <img
            src="/images/arcaneL.png"
            alt="Logo Arcane Library"
            class="brand-logo"
          />
          <span>ARCANE <span class="brand-highlight">LIBRARY</span></span>
        </a>

        <div class="ornament">
          <span></span>
          <span class="ornament-star">✦</span>
          <span></span>
        </div>

        <p class="eyebrow">UM UNIVERSO DE POSSIBILIDADES</p>

        <h1>
          Cada livro é uma
          <span>nova descoberta.</span>
        </h1>

        <p class="welcome-description">
          Entre em um mundo onde o conhecimento não tem limites.
          Explore histórias, descubra novos autores e encontre
          seu próximo livro favorito.
        </p>

        <div class="welcome-quote">
          <span class="quote-mark">“</span>
          <p>
            Existem mundos inteiros esperando para serem descobertos
            entre as páginas de um livro.
          </p>
        </div>
      </div>

      <p class="panel-footer">CONHECIMENTO • IMAGINAÇÃO • DESCOBERTA</p>
    </section>

    <!-- Painel de login -->
    <section class="form-panel">
      <div class="mobile-brand">
        <img src="/images/arcaneL.png" alt="" />
        <span>ARCANE LIBRARY</span>
      </div>

      <div class="form-heading">
        <p class="form-eyebrow">SUA PRÓXIMA AVENTURA COMEÇA AQUI</p>
        <h2>Bem-vindo de volta</h2>
        <p class="form-description">
          Entre na sua conta para continuar explorando.
        </p>
      </div>

      <form
      onsubmit={(event) => {
        event.preventDefault();
        handleLogin();
      }}
      class="login-form"
    >
        {#if error}
          <div class="error-message" role="alert">
            <span class="error-icon">!</span>
            <span>{error}</span>
          </div>
        {/if}

        <div class="form-group">
          <label for="login">Login ou usuário</label>

          <div class="input-wrapper">
            <svg
              class="field-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="4"></circle>
              <path d="M5 21v-2a7 7 0 0 1 14 0v2"></path>
            </svg>

            <input
              id="login"
              name="login"
              type="text"
              bind:value={login}
              placeholder="Digite seu login"
              autocomplete="username"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div class="form-group">
          <label for="password">Senha</label>

          <div class="input-wrapper">
            <svg
              class="field-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="16" height="11" rx="2"></rect>
              <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>
            </svg>

            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              bind:value={password}
              placeholder="Digite sua senha"
              autocomplete="current-password"
              required
              disabled={loading}
            />

            <button
              type="button"
              class="password-toggle"
              onclick={() => (showPassword = !showPassword)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              disabled={loading}
            >
              {#if showPassword}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="1.7" aria-hidden="true">
                  <path d="M3 3l18 18"></path>
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
                  <path d="M9.9 5.2A11 11 0 0 1 12 5c5 0 9 5 9 7a10 10 0 0 1-3 4"></path>
                  <path d="M6.2 6.2C3.8 7.8 3 10.1 3 12c0 2 4 7 9 7a10 10 0 0 0 4-.8"></path>
                </svg>
              {:else}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="1.7" aria-hidden="true">
                  <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              {/if}
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="submit-button"
          disabled={loading}
        >
          {#if loading}
            <span class="spinner"></span>
            Entrando...
          {:else}
            Entrar na minha conta
            <span class="button-arrow">→</span>
          {/if}
        </button>

        <div class="register-section">
          <p>Ainda não faz parte da nossa biblioteca?</p>
          <a href="/public_user">
            Crie sua conta
            <span>↗</span>
          </a>
        </div>
      </form>

      <div class="form-bottom">
        <span class="bottom-line"></span>
        <span>UM LIVRO PODE MUDAR TUDO</span>
        <span class="bottom-line"></span>
      </div>
    </section>
  </main>

  <footer class="page-footer">
    <span>© Arcane Library</span>
    <span class="footer-separator">✦</span>
    <span>Seu refúgio de conhecimento</span>
  </footer>
</div>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    padding: 0;
    min-height: 100%;
    width: 100%;
  }

  :global(body) {
    overflow-x: hidden;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .login-page {
    --gold: #d5b477;
    --gold-light: #f0dcae;
    --navy: #101827;
    --muted: #a9b0bd;

    position: relative;
    isolation: isolate;
    display: flex;
    min-height: 100vh;
    width: 100%;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 54px 28px 24px;
    overflow: hidden;
    background: #0b1220;
    color: #f8f5ee;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
  }

  .background-image {
    position: fixed;
    inset: 0;
    z-index: -2;
    background-image: url("/images/arcanelibrary.jpeg.jpeg");
    background-size: cover;
    background-position: center;
    transform: scale(1.03);
  }

  .background-overlay {
    position: fixed;
    inset: 0;
    z-index: -1;
    background:
      radial-gradient(ellipse at 20% 30%, rgba(40, 51, 76, 0.36), transparent 55%),
      linear-gradient(135deg, rgba(5, 10, 20, 0.91), rgba(9, 16, 29, 0.78));
  }

  .login-container {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.85fr);
    width: 100%;
    max-width: 1080px;
    min-height: 620px;
    margin: auto;
    overflow: hidden;
    border: 1px solid rgba(213, 180, 119, 0.28);
    border-radius: 18px;
    background: rgba(13, 21, 35, 0.94);
    box-shadow:
      0 30px 90px rgba(0, 0, 0, 0.45),
      0 0 45px rgba(213, 180, 119, 0.05);
    backdrop-filter: blur(18px);
  }

  /* Painel de apresentação */

  .welcome-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 48px 48px 28px;
    overflow: hidden;
    border-right: 1px solid rgba(213, 180, 119, 0.18);
    background:
      linear-gradient(145deg, rgba(20, 32, 50, 0.85), rgba(10, 17, 29, 0.96));
  }

  .welcome-panel::before {
    position: absolute;
    top: -110px;
    right: -110px;
    width: 310px;
    height: 310px;
    border: 1px solid rgba(213, 180, 119, 0.12);
    border-radius: 50%;
    content: "";
    pointer-events: none;
  }

  .welcome-panel::after {
    position: absolute;
    top: -65px;
    right: -65px;
    width: 220px;
    height: 220px;
    border: 1px solid rgba(213, 180, 119, 0.09);
    border-radius: 50%;
    content: "";
    pointer-events: none;
  }

  .welcome-content {
    position: relative;
    z-index: 1;
    margin: auto 0;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    color: #f8f5ee;
    font-size: 17px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-decoration: none;
  }

  .brand-logo {
    width: 46px;
    height: 46px;
    object-fit: contain;
  }

  .brand-highlight {
    color: var(--gold);
  }

  .ornament {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 120px;
    margin: 58px 0 24px;
    color: var(--gold);
  }

  .ornament span:not(.ornament-star) {
    flex: 1;
    height: 1px;
    background: rgba(213, 180, 119, 0.7);
  }

  .ornament-star {
    font-size: 16px;
  }

  .eyebrow,
  .form-eyebrow {
    color: var(--gold);
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.2em;
    line-height: 1.8;
  }

  .eyebrow {
    margin: 0 0 16px;
  }

  .welcome-content h1 {
    max-width: 430px;
    margin: 0;
    color: #fbf8f1;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(34px, 4vw, 49px);
    font-weight: 500;
    line-height: 1.16;
    letter-spacing: -0.035em;
  }

  .welcome-content h1 span {
    display: block;
    color: var(--gold-light);
    font-style: italic;
  }

  .welcome-description {
    max-width: 390px;
    margin: 24px 0 0;
    color: #c0c7d2;
    font-size: 14px;
    line-height: 1.9;
  }

  .welcome-quote {
    display: flex;
    gap: 12px;
    max-width: 390px;
    margin-top: 34px;
    padding-top: 20px;
    border-top: 1px solid rgba(213, 180, 119, 0.2);
  }

  .quote-mark {
    color: var(--gold);
    font-family: Georgia, serif;
    font-size: 38px;
    line-height: 1;
  }

  .welcome-quote p {
    margin: 3px 0 0;
    color: #d7d8dc;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 14px;
    font-style: italic;
    line-height: 1.8;
  }

  .panel-footer {
    margin: 38px 0 0;
    color: #8d96a5;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.16em;
  }

  /* Formulário */

  .form-panel {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 55px clamp(28px, 4vw, 54px);
    background: rgba(14, 22, 36, 0.97);
  }

  .mobile-brand {
    display: none;
  }

  .form-heading {
    margin-bottom: 34px;
  }

  .form-eyebrow {
    margin: 0 0 12px;
    font-size: 9px;
  }

  .form-heading h2 {
    margin: 0;
    color: #fffaf0;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(27px, 3vw, 34px);
    font-weight: 500;
    line-height: 1.3;
  }

  .form-description {
    margin: 12px 0 0;
    color: #aab3c1;
    font-size: 20px;
    line-height: 1.8;
  }

  .login-form {
    display: flex;
    flex-direction: column;
    gap: 23px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .form-group label {
    color: #e7e8ec;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 54px;
    padding: 0 15px;
    border: 1px solid #344052;
    border-radius: 7px;
    background: rgba(6, 12, 23, 0.65);
    transition:
      border-color 0.2s ease,
      box-shadow 0.2s ease,
      background 0.2s ease;
  }

  .input-wrapper:focus-within {
    border-color: var(--gold);
    background: rgba(6, 12, 23, 0.9);
    box-shadow: 0 0 0 3px rgba(213, 180, 119, 0.1);
  }

  .field-icon {
    flex: 0 0 19px;
    width: 19px;
    height: 19px;
    color: #b4a17d;
  }

  .input-wrapper input {
    width: 100%;
    min-width: 0;
    height: 50px;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: #f9fafb;
    font: inherit;
    font-size: 13px;
  }

  .input-wrapper input::placeholder {
    color: #788395;
  }

  .input-wrapper input:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .password-toggle {
    display: flex;
    flex: 0 0 32px;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 6px;
    border: 0;
    border-radius: 5px;
    background: transparent;
    color: #aab3c1;
    cursor: pointer;
    transition: color 0.2s ease, background 0.2s ease;
  }

  .password-toggle:hover {
    background: rgba(213, 180, 119, 0.1);
    color: var(--gold-light);
  }

  .password-toggle svg {
    width: 19px;
    height: 19px;
  }

  .password-toggle:focus-visible,
  .submit-button:focus-visible,
  .register-section a:focus-visible {
    outline: 2px solid var(--gold-light);
    outline-offset: 4px;
  }

  /* Mensagem de erro */

  .error-message {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 13px 14px;
    border: 1px solid rgba(248, 113, 113, 0.35);
    border-radius: 7px;
    background: rgba(127, 29, 29, 0.2);
    color: #fecaca;
    font-size: 12px;
    line-height: 1.6;
  }

  .error-icon {
    display: flex;
    flex: 0 0 20px;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: 1px solid #fca5a5;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 800;
  }

  /* Botão de entrar */

  .submit-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 100%;
    min-height: 54px;
    margin-top: 5px;
    padding: 14px 20px;
    border: 1px solid var(--gold);
    border-radius: 7px;
    background: linear-gradient(110deg, #c4a05e, #e3c78f);
    color: #172033;
    font-family: inherit;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.025em;
    cursor: pointer;
    box-shadow: 0 7px 22px rgba(0, 0, 0, 0.12);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      filter 0.2s ease;
  }

  .submit-button:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.08);
    box-shadow: 0 10px 27px rgba(213, 180, 119, 0.18);
  }

  .submit-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .submit-button:disabled {
    cursor: wait;
    opacity: 0.75;
  }

  .button-arrow {
    font-size: 19px;
    font-weight: 400;
    transition: transform 0.2s ease;
  }

  .submit-button:hover .button-arrow {
    transform: translateX(4px);
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(23, 32, 51, 0.3);
    border-top-color: #172033;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Cadastro e rodapé */

  .register-section {
    padding-top: 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.09);
    text-align: center;
  }

  .register-section p {
    margin: 0 0 10px;
    color: #aab3c1;
    font-size: 12px;
    line-height: 1.7;
  }

  .register-section a {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: var(--gold-light);
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
    transition: color 0.2s ease;
  }

  .register-section a:hover {
    color: #fff0cc;
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  .form-bottom {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 34px;
    color: #758092;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-align: center;
  }

  .bottom-line {
    width: 25px;
    height: 1px;
    background: rgba(213, 180, 119, 0.35);
  }

  .page-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 22px;
    color: rgba(239, 235, 226, 0.72);
    font-size: 10px;
    letter-spacing: 0.04em;
    text-align: center;
  }

  .footer-separator {
    color: var(--gold);
  }

  /* Tablets */

  @media (max-width: 850px) {
    .login-page {
      padding: 35px 20px 22px;
    }

    .login-container {
      grid-template-columns: minmax(0, 0.9fr) minmax(330px, 1fr);
      min-height: 580px;
    }

    .welcome-panel {
      padding: 35px 28px 25px;
    }

    .form-panel {
      padding: 42px 30px;
    }

    .welcome-content h1 {
      font-size: 36px;
    }

    .ornament {
      margin-top: 40px;
    }
  }

  /* Celulares */

  @media (max-width: 650px) {
    .login-page {
      justify-content: flex-start;
      padding: 22px 15px;
    }

    .login-container {
      display: block;
      width: 100%;
      max-width: 430px;
      min-height: auto;
      margin: auto;
      border-radius: 14px;
    }

    .welcome-panel {
      display: none;
    }

    .form-panel {
      padding: 32px 24px;
      border-radius: 14px;
    }

    .mobile-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 30px;
      color: var(--gold-light);
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.1em;
    }

    .mobile-brand img {
      width: 38px;
      height: 38px;
      object-fit: contain;
    }

    .form-heading {
      margin-bottom: 27px;
    }

    .form-heading h2 {
      font-size: 29px;
    }

    .login-form {
      gap: 21px;
    }

    .form-bottom {
      margin-top: 28px;
    }
  }

  @media (max-width: 360px) {
    .form-panel {
      padding: 27px 17px;
    }

    .form-heading h2 {
      font-size: 26px;
    }

    .form-eyebrow {
      font-size: 8px;
      letter-spacing: 0.12em;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      scroll-behavior: auto !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  
/* Melhorar a leitura da página de login */
.login-page {
  font-size: 16px;
}

.welcome-panel p {
  font-size: 17px;
  line-height: 1.7;
}

.login-form label {
  font-size: 16px;
}

.login-form input {
  font-size: 16px;
}

.login-form input::placeholder {
  font-size: 15px;
}

.login-form button {
  font-size: 17px;
}

.error-message {
  font-size: 15px;
  line-height: 1.5;
}
</style>