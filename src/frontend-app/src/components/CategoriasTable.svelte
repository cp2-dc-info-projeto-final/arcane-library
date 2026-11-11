
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { UserEditOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  import ConfirmModal from './ConfirmModal.svelte';
  import api from '$lib/api';
  import type { ApiResponse } from '$lib/api';
  import type { Categorias } from '$lib/models/Categorias';

  let categorias: Categorias[] = [];
  let loading = true;
  let searching = false;
  let error = '';
  let consulta = '';
  let deletingId: number | null = null;
  let confirmOpen = false;
  let confirmTargetId: number | null = null;
  let searchTimer: ReturnType<typeof setTimeout>;
  let searchVersion = 0;

  async function carregarCategorias(filtro = '') {
    const versao = ++searchVersion;

    if (filtro) {
      searching = true;
    } else if (categorias.length === 0) {
      loading = true;
    }

    error = '';

    try {
      const url = filtro
        ? `/categorias?consulta=${encodeURIComponent(filtro)}`
        : '/categorias';

      const res = await api.get(url);
      const body = res.data as ApiResponse<Categorias[]>;

      if (versao !== searchVersion) return;

      if (body.success) {
        categorias = body.data ?? [];
      } else {
        error = body.message || 'Não foi possível carregar as categorias.';
      }
    } catch (e: any) {
      if (versao !== searchVersion) return;

      console.error('Erro ao carregar categorias:', e);
      error =
        e.response?.data?.message ||
        'Não foi possível carregar as categorias. Tente novamente.';
    } finally {
      if (versao === searchVersion) {
        loading = false;
        searching = false;
      }
    }
  }

  function handleSearch(value: string) {
    consulta = value;

    if (searchTimer) clearTimeout(searchTimer);

    searchTimer = setTimeout(() => {
      carregarCategorias(consulta.trim());
    }, 300);
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
    closeConfirm();

    if (id !== null) {
      await handleDelete(id);
    }
  }

  async function handleDelete(id: number) {
    deletingId = id;
    error = '';

    try {
      const res = await api.delete(`/categorias/${id}`);
      const body = res.data as ApiResponse<null>;

      if (!body.success) {
        error = body.message || 'Não foi possível remover a categoria.';
        return;
      }

      await carregarCategorias(consulta.trim());
    } catch (e: any) {
      console.error('Erro ao remover categoria:', e);
      error =
        e.response?.data?.message ||
        'Erro ao remover a categoria. Tente novamente.';
    } finally {
      deletingId = null;
    }
  }

  onMount(() => {
    carregarCategorias();

    return () => {
      if (searchTimer) clearTimeout(searchTimer);
    };
  });
</script>

<svelte:head>
  <title>Categorias | Arcane Library</title>
  <meta
    name="description"
    content="Organize e gerencie as categorias da Arcane Library."
  />
</svelte:head>

<div class="categories-viewport">
  <main class="categories-page">
    <header class="page-header">
      <div class="header-icon">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          class="h-8 w-8"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"
          />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 6h13M8 8v7"
          />
        </svg>
      </div>

      <div class="header-text">
        <p class="eyebrow">ARCANE LIBRARY</p>
        <h1>Categorias</h1>
        <p class="subtitle">
          Organize os assuntos e mantenha sua biblioteca em ordem.
        </p>
      </div>
    </header>

    <section class="toolbar">
      <div class="search-box">
        <svg
          class="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path stroke-linecap="round" d="m16 16 4 4" />
        </svg>

        <input
          id="pesquisa"
          type="search"
          value={consulta}
          oninput={(event) =>
            handleSearch((event.currentTarget as HTMLInputElement).value)}
          placeholder="Buscar categoria pelo nome..."
          aria-label="Buscar categorias pelo nome"
        />

        {#if consulta}
          <button
            type="button"
            class="clear-search"
            onclick={() => handleSearch('')}
            aria-label="Limpar pesquisa"
          >
            ✕
          </button>
        {/if}
      </div>

      <div class="category-count">
        <span class="count-number">{categorias.length}</span>
        <span>{categorias.length === 1 ? 'categoria' : 'categorias'}</span>
      </div>
    </section>

    {#if searching}
      <div class="search-status" role="status">
        Pesquisando categorias...
      </div>
    {/if}

    {#if error}
      <div class="error-box" role="alert">
        <div>
          <strong>Ops! Algo deu errado.</strong>
          <p>{error}</p>
        </div>

        <button
          type="button"
          class="retry-button"
          onclick={() => carregarCategorias(consulta.trim())}
        >
          Tentar novamente
        </button>
      </div>
    {/if}

    {#if loading}
      <div class="empty-state">
        <div class="loading-spinner"></div>
        <p>Carregando categorias...</p>
      </div>
    {:else if !error && categorias.length === 0}
      <div class="empty-state">
        <div class="empty-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            class="h-10 w-10"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"
            />
          </svg>
        </div>

        <h2>
          {consulta
            ? 'Nenhuma categoria encontrada'
            : 'Sua biblioteca está esperando'}
        </h2>

        <p>
          {consulta
            ? 'Tente pesquisar usando outro nome.'
            : 'Quando houver categorias cadastradas, elas aparecerão aqui.'}
        </p>
      </div>
    {:else if !error}
      <section class="category-grid" aria-label="Lista de categorias">
        {#each categorias as categoria (categoria.id_categorias)}
          <article class="category-card">
            <div class="card-top">
              <div class="category-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  class="h-6 w-6"
                  aria-hidden="true"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"
                  />
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M4 6h13"
                  />
                </svg>
              </div>

              <span class="category-id">
                ID #{categoria.id_categorias}
              </span>
            </div>

            <div class="card-content">
              <h2 title={categoria.nome}>{categoria.nome}</h2>
              <p>Categoria da biblioteca</p>
            </div>

            <div class="card-actions">
              <button
                type="button"
                class="action-button edit-button"
                onclick={() => goto(`/categorias/edit/${categoria.id_categorias}`)}
                aria-label={`Editar ${categoria.nome}`}
              >
                <UserEditOutline class="h-5 w-5" />
                <span>Editar</span>
              </button>

              <button
                type="button"
                class="action-button delete-button"
                onclick={() => openConfirm(categoria.id_categorias)}
                disabled={deletingId === categoria.id_categorias}
                aria-label={`Remover ${categoria.nome}`}
              >
                <TrashBinOutline class="h-5 w-5" />
                <span>
                  {deletingId === categoria.id_categorias
                    ? 'Removendo...'
                    : 'Remover'}
                </span>
              </button>
            </div>
          </article>
        {/each}
      </section>
    {/if}
  </main>
</div>

<ConfirmModal
  open={confirmOpen}
  message="Tem certeza que deseja remover esta categoria?"
  confirmText="Remover"
  cancelText="Cancelar"
  onConfirm={handleConfirm}
  onCancel={closeConfirm}
/>

<style>
  /* CENTRALIZAÇÃO GERAL */
  .categories-viewport {
    width: 100%;
    display: flex;
    justify-content: center;
    box-sizing: border-box;
    padding: 0 20px;
  }

  .categories-page {
    --surface: #ffffff;
    --surface-soft: #f9fafb;
    --border: #e5e7eb;
    --text: #111827;
    --muted: #6b7280;
    --violet: #6d28d9;
    --violet-light: #ede9fe;
    --violet-border: #ddd6fe;

    width: 100%;
    max-width: 1100px;
    min-width: 0;
    margin: 0 auto;
    padding: 36px 24px 56px;
    box-sizing: border-box;
    color: var(--text);
  }

  /* CABEÇALHO */
  .page-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 34px;
  }

  .header-icon,
  .category-icon,
  .empty-icon {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    color: var(--violet);
    background: var(--violet-light);
    border: 1px solid var(--violet-border);
    border-radius: 18px;
  }

  .header-icon {
    width: 70px;
    height: 70px;
  }

  .eyebrow {
    margin: 0 0 5px;
    color: #7c3aed;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 2px;
  }

  .header-text h1 {
    margin: 0;
    color: var(--text);
    font-size: clamp(28px, 4vw, 36px);
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -0.8px;
  }

  .subtitle {
    margin: 9px 0 0;
    color: var(--muted);
    font-size: 16px;
    line-height: 1.6;
  }

  /* PESQUISA */
  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 28px;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    max-width: 580px;
    min-height: 54px;
    padding: 0 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: 0 4px 18px rgb(0 0 0 / 4%);
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .search-box:focus-within {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 4px rgb(139 92 246 / 12%);
  }

  .search-icon {
    width: 21px;
    height: 21px;
    flex-shrink: 0;
    color: var(--violet);
  }

  .search-box input {
    width: 100%;
    min-width: 0;
    padding: 13px 0;
    color: var(--text);
    font-size: 16px;
    background: transparent;
    border: 0;
    outline: none;
  }

  .search-box input::placeholder {
    color: #9ca3af;
  }

  .clear-search {
    padding: 5px;
    color: var(--muted);
    font-size: 17px;
    cursor: pointer;
  }

  .clear-search:hover {
    color: var(--violet);
  }

  .category-count {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    color: var(--muted);
    font-size: 14px;
  }

  .count-number {
    display: grid;
    place-items: center;
    min-width: 34px;
    height: 34px;
    padding: 0 8px;
    color: #6d28d9;
    font-size: 15px;
    font-weight: 800;
    background: var(--violet-light);
    border-radius: 11px;
  }

  .search-status {
    margin: -12px 0 18px;
    color: #7c3aed;
    font-size: 14px;
  }

  /* GRADE CENTRALIZADA */
  .category-grid {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: stretch;
    gap: 20px;
    width: 100%;
  }

  .category-card {
    flex: 0 1 calc(50% - 10px);
    min-width: 0;
    padding: 22px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    box-shadow: 0 6px 24px rgb(0 0 0 / 5%);
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  }

  .category-card:hover {
    transform: translateY(-3px);
    border-color: #c4b5fd;
    box-shadow: 0 12px 28px rgb(87 52 140 / 10%);
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .category-icon {
    width: 48px;
    height: 48px;
    border-radius: 15px;
  }

  .category-id {
    padding: 7px 10px;
    color: #6b7280;
    font-size: 12px;
    font-weight: 700;
    background: var(--surface-soft);
    border: 1px solid var(--border);
    border-radius: 9px;
  }

  .card-content {
    padding: 22px 0;
  }

  .card-content h2 {
    overflow-wrap: anywhere;
    margin: 0;
    color: var(--text);
    font-size: 21px;
    line-height: 1.4;
    font-weight: 750;
  }

  .card-content p {
    margin: 7px 0 0;
    color: var(--muted);
    font-size: 14px;
  }

  /* BOTÕES */
  .card-actions {
    display: flex;
    gap: 10px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }

  .action-button {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 43px;
    padding: 9px 12px;
    font-size: 14px;
    font-weight: 700;
    border: 1px solid transparent;
    border-radius: 11px;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
  }

  .action-button:focus-visible,
  .retry-button:focus-visible,
  .clear-search:focus-visible {
    outline: 3px solid #c4b5fd;
    outline-offset: 3px;
  }

  .action-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .edit-button {
    color: #6d28d9;
    background: #f5f3ff;
    border-color: #ddd6fe;
  }

  .edit-button:hover:not(:disabled) {
    background: #ede9fe;
  }

  .delete-button {
    color: #dc2626;
    background: #fef2f2;
    border-color: #fecaca;
  }

  .delete-button:hover:not(:disabled) {
    background: #fee2e2;
  }

  /* ESTADO VAZIO */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 64px 24px;
    text-align: center;
    background: var(--surface);
    border: 1px dashed #d1d5db;
    border-radius: 20px;
  }

  .empty-icon {
    width: 72px;
    height: 72px;
    margin-bottom: 20px;
    border-radius: 22px;
  }

  .empty-state h2 {
    margin: 0;
    color: var(--text);
    font-size: 21px;
    font-weight: 750;
  }

  .empty-state p {
    max-width: 420px;
    margin: 10px 0 0;
    color: var(--muted);
    font-size: 15px;
    line-height: 1.7;
  }

  .loading-spinner {
    width: 34px;
    height: 34px;
    margin-bottom: 16px;
    border: 3px solid #ede9fe;
    border-top-color: #7c3aed;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* ERROS */
  .error-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
    padding: 18px;
    color: #991b1b;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 14px;
  }

  .error-box strong {
    font-size: 15px;
  }

  .error-box p {
    margin: 5px 0 0;
    font-size: 14px;
    line-height: 1.5;
  }

  .retry-button {
    flex-shrink: 0;
    padding: 9px 13px;
    color: #991b1b;
    font-size: 13px;
    font-weight: 700;
    border: 1px solid #fecaca;
    border-radius: 9px;
    cursor: pointer;
  }

  .retry-button:hover {
    background: #fee2e2;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* MODO ESCURO */
  :global(.dark) .categories-page {
    --surface: #1f2937;
    --surface-soft: #111827;
    --border: #374151;
    --text: #f9fafb;
    --muted: #9ca3af;
    --violet: #c4b5fd;
    --violet-light: #2e1065;
    --violet-border: #4c1d95;
  }

  :global(.dark) .eyebrow {
    color: #c4b5fd;
  }

  :global(.dark) .header-icon,
  :global(.dark) .category-icon,
  :global(.dark) .empty-icon {
    color: #c4b5fd;
    background: #2e1065;
    border-color: #4c1d95;
  }

  :global(.dark) .search-box {
    background: #111827;
    border-color: #4b5563;
  }

  :global(.dark) .search-box:focus-within {
    border-color: #8b5cf6;
  }

  :global(.dark) .search-box input {
    color: #f9fafb;
  }

  :global(.dark) .search-box input::placeholder {
    color: #6b7280;
  }

  :global(.dark) .count-number {
    color: #c4b5fd;
    background: #2e1065;
  }

  :global(.dark) .category-card {
    background: #1f2937;
    border-color: #374151;
  }

  :global(.dark) .category-card:hover {
    border-color: #7c3aed;
  }

  :global(.dark) .category-id {
    color: #d1d5db;
    background: #111827;
    border-color: #374151;
  }

  :global(.dark) .card-content h2,
  :global(.dark) .empty-state h2 {
    color: #f9fafb;
  }

  :global(.dark) .card-content p,
  :global(.dark) .empty-state p {
    color: #9ca3af;
  }

  :global(.dark) .card-actions {
    border-color: #374151;
  }

  :global(.dark) .edit-button {
    color: #c4b5fd;
    background: #2e1065;
    border-color: #4c1d95;
  }

  :global(.dark) .edit-button:hover:not(:disabled) {
    background: #4c1d95;
  }

  :global(.dark) .delete-button {
    color: #fca5a5;
    background: #450a0a;
    border-color: #7f1d1d;
  }

  :global(.dark) .delete-button:hover:not(:disabled) {
    background: #7f1d1d;
  }

  :global(.dark) .empty-state {
    background: #1f2937;
    border-color: #4b5563;
  }

  :global(.dark) .loading-spinner {
    border-color: #4c1d95;
    border-top-color: #c4b5fd;
  }

  :global(.dark) .search-status {
    color: #c4b5fd;
  }

  :global(.dark) .error-box {
    color: #fca5a5;
    background: rgb(127 29 29 / 25%);
    border-color: #7f1d1d;
  }

  :global(.dark) .retry-button {
    color: #fca5a5;
    border-color: #7f1d1d;
  }

  :global(.dark) .retry-button:hover {
    background: #450a0a;
  }

  /* RESPONSIVIDADE */
  @media (max-width: 640px) {
    .categories-viewport {
      padding: 0 12px;
    }

    .categories-page {
      padding: 26px 16px 40px;
    }

    .page-header {
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 26px;
    }

    .header-icon {
      width: 54px;
      height: 54px;
      border-radius: 15px;
    }

    .header-icon :global(svg) {
      width: 25px;
      height: 25px;
    }

    .subtitle {
      font-size: 14px;
    }

    .toolbar {
      align-items: stretch;
      flex-direction: column;
      gap: 14px;
    }

    .category-count {
      align-self: flex-start;
    }

    .category-grid {
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }

    .category-card {
      width: 100%;
      flex-basis: auto;
      padding: 18px;
      border-radius: 16px;
    }

    .card-content h2 {
      font-size: 19px;
    }

    .error-box {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  /* ACESSIBILIDADE */
  @media (prefers-reduced-motion: reduce) {
    .category-card,
    .action-button,
    .search-box {
      transition: none;
    }

    .loading-spinner {
      animation-duration: 1.8s;
    }
  }
</style>
