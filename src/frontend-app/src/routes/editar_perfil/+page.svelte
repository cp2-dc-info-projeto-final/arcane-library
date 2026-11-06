<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  import UserForm from '../../components/UserForm.svelte';
  import api from '$lib/api';
  import type { User } from '$lib/models/User';
  import type { ApiResponse } from '$lib/api';

  let userId: number | null = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      const res = await api.get('/users/me');
      const body = res.data as ApiResponse<User>;

      if (body.success && body.data) {
        userId = body.data.id;
      } else {
        error = body.message || 'Não foi possível carregar seu perfil.';
      }
    } catch (e: any) {
      const body = e.response?.data as ApiResponse<User> | undefined;

      error = body?.message || 'Erro ao carregar seu perfil.';
    } finally {
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Meu perfil | Arcane Library</title>
  <meta
    name="description"
    content="Visualize e atualize seus dados pessoais na Arcane Library."
  />
</svelte:head>

<main class="profile-page min-h-screen px-4 pb-16 pt-24 sm:px-6 sm:pt-28">
  <div class="mx-auto max-w-4xl">

    {#if loading}
      <section class="status-card">
        <div class="loading-spinner"></div>

        <h1 class="mt-5 text-xl font-bold text-gray-900 dark:text-white">
          Carregando seu perfil
        </h1>

        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Estamos buscando suas informações. Só um instante...
        </p>
      </section>

    {:else if error}
      <section class="status-card">
        <div class="status-icon error-icon">!</div>

        <h1 class="mt-4 text-2xl font-extrabold text-gray-900 dark:text-white">
          Não foi possível abrir seu perfil
        </h1>

        <p class="mt-3 max-w-md text-sm leading-7 text-gray-600 dark:text-gray-300">
          {error}
        </p>

        <div class="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            class="secondary-button"
            onclick={() => goto('/')}
          >
            Voltar ao início
          </button>

          <button
            type="button"
            class="primary-button"
            onclick={() => location.reload()}
          >
            Tentar novamente
          </button>
        </div>
      </section>

    {:else if userId !== null}
      <header class="mb-8 text-center">
        <span class="eyebrow">Sua conta</span>

        <h1 class="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Meu perfil
        </h1>

        <p class="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-600 dark:text-gray-400 sm:text-base">
          Mantenha suas informações atualizadas e gerencie seus dados pessoais
          na Arcane Library.
        </p>
      </header>

      <UserForm me="true" id={userId} />

    {:else}
      <section class="status-card">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          Perfil indisponível
        </h1>

        <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
          Não encontramos os dados necessários para abrir seu perfil.
        </p>

        <button
          type="button"
          class="primary-button mt-6"
          onclick={() => goto('/')}
        >
          Voltar ao início
        </button>
      </section>
    {/if}

  </div>
</main>

<style>
  .profile-page {
    background:
      radial-gradient(
        ellipse at 10% 5%,
        rgb(168 85 247 / 0.12),
        transparent 42%
      ),
      radial-gradient(
        ellipse at 90% 45%,
        rgb(139 92 246 / 0.09),
        transparent 38%
      ),
      var(--color-page-background, transparent);
  }

  .status-card {
    display: flex;
    min-height: 320px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid rgb(168 85 247 / 0.2);
    border-radius: 1.5rem;
    background: rgb(255 255 255 / 0.85);
    padding: 2rem 1.25rem;
    text-align: center;
    box-shadow: 0 15px 40px rgb(76 29 149 / 0.06);
    backdrop-filter: blur(14px);
  }

  :global(.dark) .status-card {
    background: rgb(17 24 39 / 0.85);
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    border: 1px solid rgb(168 85 247 / 0.3);
    border-radius: 9999px;
    background: rgb(168 85 247 / 0.08);
    padding: 0.5rem 1rem;
    color: #7e22ce;
    font-size: 0.8rem;
    font-weight: 700;
  }

  :global(.dark) .eyebrow {
    color: #d8b4fe;
  }

  .status-icon {
    display: flex;
    height: 3.5rem;
    width: 3.5rem;
    align-items: center;
    justify-content: center;
    border-radius: 1.25rem;
    font-size: 1.5rem;
    font-weight: 800;
  }

  .error-icon {
    background: rgb(239 68 68 / 0.1);
    color: #dc2626;
  }

  .primary-button,
  .secondary-button {
    display: inline-flex;
    min-height: 2.75rem;
    align-items: center;
    justify-content: center;
    border-radius: 0.8rem;
    padding: 0.75rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 700;
    transition:
      background 150ms ease,
      transform 150ms ease;
  }

  .primary-button {
    background: #6d28d9;
    color: white;
  }

  .primary-button:hover {
    transform: translateY(-1px);
    background: #5b21b6;
  }

  .secondary-button {
    border: 1px solid rgb(156 163 175 / 0.4);
    background: transparent;
    color: #374151;
  }

  .secondary-button:hover {
    background: rgb(156 163 175 / 0.1);
  }

  :global(.dark) .secondary-button {
    color: #e5e7eb;
  }

  .loading-spinner {
    height: 2.5rem;
    width: 2.5rem;
    border: 3px solid rgb(139 92 246 / 0.2);
    border-top-color: #7c3aed;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: none;
    }

    .primary-button,
    .secondary-button {
      transition: none;
    }
  }
</style>

