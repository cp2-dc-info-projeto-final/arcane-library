
<script lang="ts">
  import { onMount } from 'svelte';
  import { UserEditOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import { goto } from '$app/navigation';
  import ConfirmModal from './ConfirmModal.svelte';
  import api from '$lib/api';
  import type { ApiResponse } from '$lib/api';
  import type { Autores } from '$lib/models/Autores';

  let autores: Autores[] = [];
  let loading = true;
  let error = '';
  let deletingId: number | null = null;
  let confirmOpen = false;
  let confirmTargetId: number | null = null;
  let consulta = '';

  onMount(() => {
    carregarAutores();
  });

  async function carregarAutores() {
    loading = true;
    error = '';

    try {
      const params = new URLSearchParams();

      if (consulta.trim()) {
        params.set('consulta', consulta.trim());
      }

      const res = await api.get(
        `/autores${params.size ? `?${params.toString()}` : ''}`
      );

      const body = res.data as ApiResponse<Autores[]>;

      if (body.success) {
        autores = body.data ?? [];
      } else {
        error = body.message || 'Não foi possível carregar os autores.';
      }
    } catch (e: any) {
      console.error('Erro ao carregar autores:', e);

      const body = e.response?.data as ApiResponse<Autores[]> | undefined;
      error = body?.message || 'Erro ao carregar autores.';
    } finally {
      loading = false;
    }
  }

  async function filtrarAutores() {
    await carregarAutores();
  }

  function openConfirm(id: number) {
    confirmTargetId = id;
    confirmOpen = true;
  }

  function closeConfirm() {
    confirmOpen = false;
    confirmTargetId = null;
  }

  async function handleConfirm() {
    const id = confirmTargetId;

    if (id === null) return;

    closeConfirm();
    await handleDelete(id);
  }

  function handleCancel() {
    closeConfirm();
  }

  async function handleDelete(id: number) {
    deletingId = id;
    error = '';

    try {
      const res = await api.delete(`/autores/${id}`);
      const body = res.data as ApiResponse<null>;

      if (!body.success) {
        error = body.message || 'Não foi possível remover o autor.';
        return;
      }

      autores = autores.filter((autor) => autor.id !== id);
    } catch (e: any) {
      console.error('Erro ao deletar autor:', e);

      const body = e.response?.data as ApiResponse<null> | undefined;
      error = body?.message || 'Erro ao remover autor.';
    } finally {
      deletingId = null;
    }
  }
</script>

<svelte:head>
  <title>Autores | Arcane Library</title>
  <meta
    name="description"
    content="Gerencie os autores cadastrados na Arcane Library."
  />
</svelte:head>

<div class="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">
  <!-- Cabeçalho -->
  <header class="flex flex-col gap-2">
    <div class="flex items-center gap-3">
      <div
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl
               bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
      >
        <svg
          class="h-6 w-6"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 7v14m0-14C10.5 5.5 8.5 5 5 5v14c3.5 0 5.5.5 7 2m0-14c1.5-1.5 3.5-2 7-2v14c-3.5 0-5.5.5-7 2"
          />
        </svg>
      </div>

      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          Autores
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Explore e gerencie os autores da biblioteca.
        </p>
      </div>
    </div>

    <div class="mt-2 flex flex-wrap items-center gap-2">
      <span
        class="inline-flex items-center rounded-full bg-violet-100 px-3 py-1
               text-xs font-semibold text-violet-700
               dark:bg-violet-950 dark:text-violet-300"
      >
        {autores.length} {autores.length === 1 ? 'autor cadastrado' : 'autores cadastrados'}
      </span>
    </div>
  </header>

  <!-- Pesquisa -->
  <form
    class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm
           dark:border-gray-700 dark:bg-gray-800 sm:p-5"
    onsubmit={(event) => {
      event.preventDefault();
      filtrarAutores();
    }}
  >
    <label
      for="pesquisa"
      class="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
    >
      Buscar autores
    </label>

    <div class="flex flex-col gap-3 sm:flex-row">
      <div class="relative min-w-0 flex-1">
        <svg
          class="pointer-events-none absolute left-3 top-1/2 h-5 w-5
                 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path stroke-linecap="round" d="m16 16 4 4" />
        </svg>

        <input
          id="pesquisa"
          type="search"
          bind:value={consulta}
          placeholder="Pesquise pelo nome ou pseudônimo..."
          class="w-full rounded-xl border border-gray-300 bg-gray-50
                 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none
                 transition placeholder:text-gray-400
                 focus:border-violet-500 focus:ring-2 focus:ring-violet-200
                 dark:border-gray-600 dark:bg-gray-900 dark:text-white
                 dark:placeholder:text-gray-500 dark:focus:ring-violet-900"
        />
      </div>

      <div class="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          class="inline-flex flex-1 items-center justify-center gap-2
                 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold
                 text-white transition hover:bg-violet-800
                 focus:outline-none focus:ring-4 focus:ring-violet-300
                 disabled:cursor-not-allowed disabled:opacity-60
                 dark:focus:ring-violet-900 sm:flex-none"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path stroke-linecap="round" d="m16 16 4 4" />
          </svg>
          Buscar
        </button>

        <button
          type="button"
          disabled={loading}
          onclick={() => {
            consulta = '';
            carregarAutores();
          }}
          class="rounded-xl border border-gray-300 px-4 py-3 text-sm
                 font-medium text-gray-700 transition hover:bg-gray-100
                 disabled:cursor-not-allowed disabled:opacity-60
                 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          Limpar
        </button>
      </div>
    </div>
  </form>

  <!-- Mensagem de erro -->
  {#if error}
    <div
      role="alert"
      class="flex items-start gap-3 rounded-xl border border-red-200
             bg-red-50 p-4 text-sm text-red-800
             dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
    >
      <svg
        class="mt-0.5 h-5 w-5 shrink-0"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path stroke-linecap="round" d="M12 7v5m0 3h.01" />
      </svg>

      <div class="min-w-0 flex-1">{error}</div>

      <button
        type="button"
        onclick={carregarAutores}
        class="shrink-0 font-semibold underline underline-offset-2"
      >
        Tentar novamente
      </button>
    </div>
  {/if}

  <!-- Carregamento -->
  {#if loading}
    <div
      class="flex flex-col items-center justify-center gap-3 rounded-2xl
             border border-gray-200 bg-white px-4 py-16
             dark:border-gray-700 dark:bg-gray-800"
      aria-live="polite"
    >
      <div
        class="h-9 w-9 animate-spin rounded-full border-4
               border-violet-200 border-t-violet-700
               dark:border-violet-950 dark:border-t-violet-400"
      ></div>
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Carregando autores...
      </p>
    </div>

  {:else if !error && autores.length === 0}
    <!-- Estado vazio -->
    <div
      class="flex flex-col items-center justify-center rounded-2xl
             border border-dashed border-gray-300 bg-white px-6 py-16
             text-center dark:border-gray-700 dark:bg-gray-800"
    >
      <div
        class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl
               bg-violet-100 text-violet-600
               dark:bg-violet-950 dark:text-violet-300"
      >
        <svg
          class="h-8 w-8"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 7v14m0-14C10.5 5.5 8.5 5 5 5v14c3.5 0 5.5.5 7 2m0-14c1.5-1.5 3.5-2 7-2v14c-3.5 0-5.5.5-7 2"
          />
        </svg>
      </div>

      <h2 class="text-lg font-bold text-gray-900 dark:text-white">
        Nenhum autor encontrado
      </h2>
      <p class="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        {consulta.trim()
          ? 'Não encontramos autores com essa pesquisa. Tente outro nome ou limpe os filtros.'
          : 'Ainda não há autores cadastrados na biblioteca.'}
      </p>

      {#if consulta.trim()}
        <button
          type="button"
          onclick={() => {
            consulta = '';
            carregarAutores();
          }}
          class="mt-5 rounded-xl bg-violet-700 px-4 py-2.5
                 text-sm font-semibold text-white transition
                 hover:bg-violet-800"
        >
          Limpar pesquisa
        </button>
      {/if}
    </div>

  {:else if !error}
    <!-- Lista de autores -->
    <section aria-label="Lista de autores">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">
          Autores cadastrados
        </h2>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {autores.length} resultado(s)
        </span>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        {#each autores as autor (autor.id)}
          <article
            class="group overflow-hidden rounded-2xl border border-gray-200
                   bg-white shadow-sm transition duration-200
                   hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md
                   dark:border-gray-700 dark:bg-gray-800
                   dark:hover:border-violet-700"
          >
            <!-- Faixa superior -->
            <div
              class="flex items-start gap-3 border-b border-gray-100
                     bg-gradient-to-r from-violet-50 to-white p-4
                     dark:border-gray-700 dark:from-violet-950/40
                     dark:to-gray-800 sm:p-5"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center
                       rounded-xl bg-violet-200 text-lg font-bold
                       text-violet-800 dark:bg-violet-900 dark:text-violet-200"
                aria-hidden="true"
              >
                {autor.nome?.trim().charAt(0).toUpperCase() || '?'}
              </div>

              <div class="min-w-0 flex-1">
                <h3
                  class="break-words text-base font-bold text-gray-900
                         dark:text-white"
                >
                  {autor.nome}
                </h3>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Registro #{autor.id}
                </p>
              </div>

              <div class="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Editar ${autor.nome}`}
                  title="Editar autor"
                  onclick={() => goto(`/autores/edit/${autor.id}`)}
                  class="inline-flex h-9 w-9 items-center justify-center
                         rounded-lg border border-violet-200 bg-white
                         text-violet-700 transition hover:bg-violet-100
                         focus:outline-none focus:ring-2 focus:ring-violet-300
                         dark:border-violet-900 dark:bg-gray-800
                         dark:text-violet-300 dark:hover:bg-violet-950"
                >
                  <UserEditOutline class="h-4 w-4" />
                </button>

                <button
                  type="button"
                  aria-label={`Remover ${autor.nome}`}
                  title="Remover autor"
                  onclick={() => openConfirm(autor.id)}
                  disabled={deletingId !== null}
                  class="inline-flex h-9 w-9 items-center justify-center
                         rounded-lg border border-red-200 bg-white
                         text-red-600 transition hover:bg-red-50
                         focus:outline-none focus:ring-2 focus:ring-red-200
                         disabled:cursor-not-allowed disabled:opacity-50
                         dark:border-red-900 dark:bg-gray-800
                         dark:text-red-400 dark:hover:bg-red-950"
                >
                  {#if deletingId === autor.id}
                    <span
                      class="h-4 w-4 animate-spin rounded-full border-2
                             border-red-200 border-t-red-600"
                    ></span>
                  {:else}
                    <TrashBinOutline class="h-4 w-4" />
                  {/if}
                </button>
              </div>
            </div>

            <!-- Informações do autor -->
            <div class="p-4 sm:p-5">
              <p
                class="mb-2 text-xs font-semibold uppercase tracking-wider
                       text-gray-400 dark:text-gray-500"
              >
                Pseudônimo
              </p>

              <div class="flex items-center gap-2">
                <svg
                  class="h-5 w-5 shrink-0 text-violet-500 dark:text-violet-400"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0"
                  />
                </svg>

                <span
                  class="break-words text-sm font-medium text-gray-700
                         dark:text-gray-200"
                >
                  {autor.pseunonimo?.trim() || 'Não informado'}
                </span>
              </div>
            </div>
          </article>
        {/each}
      </div>
    </section>
  {/if}
</div>

<!-- Modal de confirmação -->
<ConfirmModal
  open={confirmOpen}
  message="Tem certeza que deseja remover este autor? Essa ação não poderá ser desfeita."
  confirmText="Remover autor"
  cancelText="Cancelar"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>