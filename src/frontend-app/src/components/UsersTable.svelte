
<script lang="ts">
  import { onMount } from 'svelte';
  import { Badge } from 'flowbite-svelte';
  import { UserEditOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import { goto } from '$app/navigation';
  import ConfirmModal from './ConfirmModal.svelte';
  import api from '$lib/api';
  import type { ApiResponse } from '$lib/api';
  import type { User } from '$lib/models/User';

  let users: User[] = [];
  let loading = true;
  let error = '';
  let deletingId: number | null = null;
  let confirmOpen = false;
  let confirmTargetId: number | null = null;
  let consulta = '';

  onMount(() => {
    carregarUsuarios();
  });

  async function carregarUsuarios() {
    loading = true;
    error = '';

    try {
      const params = new URLSearchParams();

      if (consulta.trim()) {
        params.set('consulta', consulta.trim());
      }

      const query = params.toString();
      const res = await api.get(
        query ? `/users?${query}` : '/users'
      );

      const body = res.data as ApiResponse<User[]>;

      if (body.success) {
        users = body.data ?? [];
      } else {
        error = body.message || 'Não foi possível carregar os usuários.';
        users = [];
      }
    } catch (e: any) {
      console.error('Erro ao carregar usuários:', e);

      const body = e.response?.data as ApiResponse<User[]> | undefined;
      error = body?.message || 'Erro ao carregar usuários.';
      users = [];
    } finally {
      loading = false;
    }
  }

  async function filtrarUsuario() {
    await carregarUsuarios();
  }

  async function limparPesquisa() {
    consulta = '';
    await carregarUsuarios();
  }

  function openConfirm(id: number) {
    confirmTargetId = id;
    confirmOpen = true;
  }

  function closeConfirm() {
    if (deletingId !== null) return;

    confirmOpen = false;
    confirmTargetId = null;
  }

  async function handleConfirm() {
    if (confirmTargetId === null || deletingId !== null) return;

    const id = confirmTargetId;

    confirmOpen = false;
    confirmTargetId = null;

    await handleDelete(id);
  }

  function handleCancel() {
    closeConfirm();
  }

  async function handleDelete(id: number) {
    deletingId = id;
    error = '';

    try {
      const res = await api.delete(`/users/${id}`);
      const body = res.data as ApiResponse<null>;

      if (body.success === false) {
        error = body.message || 'Não foi possível remover o usuário.';
        return;
      }

      users = users.filter((user) => user.id !== id);
    } catch (e: any) {
      console.error('Erro ao deletar usuário:', e);

      const body = e.response?.data as ApiResponse<null> | undefined;
      error = body?.message || 'Erro ao remover usuário.';
    } finally {
      deletingId = null;
    }
  }
</script>

<svelte:head>
  <title>Usuários | Arcane Library</title>
  <meta
    name="description"
    content="Gerencie os usuários cadastrados na Arcane Library."
  />
</svelte:head>

<div class="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6">

  <!-- CABEÇALHO -->
  <header class="space-y-4">
    <div class="flex items-center gap-3">
      <div
        class="flex h-12 w-12 shrink-0 items-center justify-center
               rounded-2xl bg-violet-100 text-violet-700
               dark:bg-violet-950 dark:text-violet-300"
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
            d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M14 3.13a4 4 0 0 1 0 7.75M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
          />
        </svg>
      </div>

      <div class="min-w-0">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          Usuários
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Gerencie as contas e os acessos da sua biblioteca.
        </p>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <span
        class="inline-flex items-center gap-2 rounded-full bg-violet-100
               px-3 py-1.5 text-xs font-semibold text-violet-800
               dark:bg-violet-950 dark:text-violet-300"
      >
        <span class="h-2 w-2 rounded-full bg-violet-500"></span>
        {users.length} {users.length === 1 ? 'usuário encontrado' : 'usuários encontrados'}
      </span>

      <span
        class="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold
               text-red-700 dark:bg-red-950/50 dark:text-red-300"
      >
        {users.filter((user) => user.role === 'admin').length}
        {users.filter((user) => user.role === 'admin').length === 1
          ? 'administrador'
          : 'administradores'}
      </span>
    </div>
  </header>

  <!-- PESQUISA -->
  <form
    class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm
           dark:border-gray-700 dark:bg-gray-800 sm:p-5"
    onsubmit={(event) => {
      event.preventDefault();
      filtrarUsuario();
    }}
  >
    <label
      for="pesquisa"
      class="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
    >
      Buscar usuários
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
          placeholder="Pesquise por login ou e-mail..."
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
          class="flex-1 rounded-xl bg-violet-700 px-5 py-3 text-sm
                 font-semibold text-white transition hover:bg-violet-800
                 focus:outline-none focus:ring-4 focus:ring-violet-300
                 disabled:cursor-not-allowed disabled:opacity-60
                 dark:focus:ring-violet-900 sm:flex-none"
        >
          Buscar
        </button>

        <button
          type="button"
          onclick={limparPesquisa}
          disabled={loading}
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

  <!-- ERRO -->
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

      <span class="min-w-0 flex-1">{error}</span>

      <button
        type="button"
        onclick={carregarUsuarios}
        class="shrink-0 font-semibold underline underline-offset-2"
      >
        Tentar novamente
      </button>
    </div>
  {/if}

  <!-- CARREGAMENTO -->
  {#if loading}
    <div
      class="flex flex-col items-center justify-center gap-3 rounded-2xl
             border border-gray-200 bg-white py-16
             dark:border-gray-700 dark:bg-gray-800"
      aria-live="polite"
    >
      <div
        class="h-9 w-9 animate-spin rounded-full border-4
               border-violet-200 border-t-violet-700
               dark:border-violet-950 dark:border-t-violet-400"
      ></div>

      <p class="text-sm text-gray-500 dark:text-gray-400">
        Carregando usuários...
      </p>
    </div>

  {:else if !error && users.length === 0}
    <!-- LISTA VAZIA -->
    <div
      class="flex flex-col items-center justify-center rounded-2xl
             border border-dashed border-gray-300 bg-white px-6 py-16
             text-center dark:border-gray-700 dark:bg-gray-800"
    >
      <div
        class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl
               bg-violet-100 text-violet-700
               dark:bg-violet-950 dark:text-violet-300"
      >
        <svg
          class="h-8 w-8"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m16 0v-2a4 4 0 0 0-3-3.87M14 3.13a4 4 0 0 1 0 7.75M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
          />
        </svg>
      </div>

      <h2 class="text-lg font-bold text-gray-900 dark:text-white">
        Nenhum usuário encontrado
      </h2>

      <p class="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        {consulta.trim()
          ? 'Não encontramos contas com essa pesquisa. Tente outro login ou e-mail.'
          : 'Ainda não há usuários cadastrados para exibir.'}
      </p>

      {#if consulta.trim()}
        <button
          type="button"
          onclick={limparPesquisa}
          class="mt-5 rounded-xl bg-violet-700 px-4 py-2.5
                 text-sm font-semibold text-white transition hover:bg-violet-800"
        >
          Limpar pesquisa
        </button>
      {/if}
    </div>

  {:else if !error}
    <!-- CARTÕES DE USUÁRIOS -->
    <section aria-label="Lista de usuários">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">
          Contas cadastradas
        </h2>

        <span class="text-sm text-gray-500 dark:text-gray-400">
          {users.length} resultado(s)
        </span>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {#each users as user (user.id)}
          <article
            class="group overflow-hidden rounded-2xl border border-gray-200
                   bg-white shadow-sm transition duration-200
                   hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md
                   dark:border-gray-700 dark:bg-gray-800
                   dark:hover:border-violet-700"
          >
            <!-- CABEÇALHO DO CARTÃO -->
            <div
              class="flex items-start gap-3 border-b border-gray-100
                     bg-gradient-to-r from-violet-50 to-white p-4
                     dark:border-gray-700 dark:from-violet-950/40
                     dark:to-gray-800"
            >
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center
                       rounded-xl bg-violet-200 text-lg font-bold
                       text-violet-800 dark:bg-violet-900 dark:text-violet-200"
                aria-hidden="true"
              >
                {user.login?.trim().charAt(0).toUpperCase() || '?'}
              </div>

              <div class="min-w-0 flex-1">
                <h3 class="break-words text-base font-bold text-gray-900 dark:text-white">
                  {user.login}
                </h3>

                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Registro #{user.id}
                </p>

                <div class="mt-2">
                  {#if user.role === 'admin'}
                    <Badge color="red" class="text-xs">
                      Administrador
                    </Badge>
                  {:else}
                    <Badge color="purple" class="text-xs">
                      {user.role || 'Usuário'}
                    </Badge>
                  {/if}
                </div>
              </div>

              <!-- AÇÕES -->
              <div class="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  aria-label={`Editar usuário ${user.login}`}
                  title="Editar usuário"
                  onclick={() => goto(`/users/edit/${user.id}`)}
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
                  aria-label={`Remover usuário ${user.login}`}
                  title="Remover usuário"
                  onclick={() => openConfirm(user.id)}
                  disabled={deletingId !== null}
                  class="inline-flex h-9 w-9 items-center justify-center
                         rounded-lg border border-red-200 bg-white
                         text-red-600 transition hover:bg-red-50
                         focus:outline-none focus:ring-2 focus:ring-red-200
                         disabled:cursor-not-allowed disabled:opacity-50
                         dark:border-red-900 dark:bg-gray-800
                         dark:text-red-400 dark:hover:bg-red-950"
                >
                  {#if deletingId === user.id}
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

            <!-- INFORMAÇÕES -->
            <div class="p-4">
              <p
                class="mb-2 text-xs font-semibold uppercase tracking-wider
                       text-gray-400 dark:text-gray-500"
              >
                E-mail
              </p>

              <div class="flex min-w-0 items-start gap-3">
                <div
                  class="flex h-9 w-9 shrink-0 items-center justify-center
                         rounded-lg bg-gray-100 text-gray-600
                         dark:bg-gray-700 dark:text-gray-300"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect width="18" height="14" x="3" y="5" rx="2" />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="m3 7 9 6 9-6"
                    />
                  </svg>
                </div>

                <p class="min-w-0 break-all pt-2 text-sm text-gray-700 dark:text-gray-300">
                  {user.email || 'E-mail não informado'}
                </p>
              </div>
            </div>
          </article>
        {/each}
      </div>
    </section>
  {/if}
</div>

<!-- MODAL DE CONFIRMAÇÃO -->
<ConfirmModal
  open={confirmOpen}
  message="Tem certeza que deseja remover este usuário? Essa ação pode não ser reversível."
  confirmText="Remover usuário"
  cancelText="Cancelar"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>