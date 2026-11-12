
<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Spinner, Modal } from 'flowbite-svelte';
  import { TrashBinOutline, UserEditOutline } from 'flowbite-svelte-icons';
  import { goto } from '$app/navigation';
  import api from '$lib/api';
  import type { ApiResponse } from '$lib/api';
  import type { Emprestimos } from '$lib/models/Emprestimos';

  interface EmprestimoTabela extends Emprestimos {
    usuario?: string;
    email_usuario?: string;
    livro?: string;
  }

  let emprestimos: EmprestimoTabela[] = [];
  let loading = true;
  let deleting = false;
  let error = '';
  let consulta = '';

  let abrirModalDelete = false;
  let emprestimoParaDeletar: EmprestimoTabela | null = null;

  let buscaTimeout: ReturnType<typeof setTimeout>;
  let requisicaoAtual = 0;

  onMount(() => {
    filtrarEmprestimos(true);

    return () => {
      clearTimeout(buscaTimeout);
    };
  });

  async function filtrarEmprestimos(mostrarLoading = false) {
    const requisicao = ++requisicaoAtual;

    if (mostrarLoading) {
      loading = true;
    }

    error = '';

    try {
      const params = new URLSearchParams();

      if (consulta.trim()) {
        params.append('consulta', consulta.trim());
      }

      const query = params.toString();

      const res = await api.get(
        query ? `/emprestimos?${query}` : '/emprestimos'
      );

      // Impede respostas antigas de sobrescreverem pesquisas recentes
      if (requisicao !== requisicaoAtual) return;

      const body = res.data as ApiResponse<EmprestimoTabela[]>;

      if (body?.success) {
        emprestimos = body.data ?? [];
      } else {
        error = body?.message || 'Erro ao carregar empréstimos.';
        emprestimos = [];
      }
    } catch (e: any) {
      if (requisicao !== requisicaoAtual) return;

      console.error('Erro ao carregar empréstimos:', e);

      const body = e.response?.data as ApiResponse<EmprestimoTabela[]> | undefined;

      error = body?.message || 'Não foi possível carregar os empréstimos.';
      emprestimos = [];
    } finally {
      if (requisicao === requisicaoAtual) {
        loading = false;
      }
    }
  }

  // Pesquisa automática enquanto digita
  function pesquisarEmTempoReal() {
    clearTimeout(buscaTimeout);

    buscaTimeout = setTimeout(() => {
      filtrarEmprestimos();
    }, 300);
  }

  async function limparFiltros() {
    clearTimeout(buscaTimeout);
    consulta = '';
    await filtrarEmprestimos();
  }

  function abrirDelete(emprestimo: EmprestimoTabela) {
    emprestimoParaDeletar = emprestimo;
    abrirModalDelete = true;
  }

  function cancelarDelete() {
    if (deleting) return;

    abrirModalDelete = false;
    emprestimoParaDeletar = null;
  }

  async function confirmarDelete() {
    if (!emprestimoParaDeletar || deleting) return;

    const id = emprestimoParaDeletar.id;

    if (!id) {
      error = 'Não foi possível identificar o empréstimo.';
      return;
    }

    deleting = true;
    error = '';

    try {
      const res = await api.delete(`/emprestimos/${id}`);
      const body = res.data as ApiResponse<null> | undefined;

      if (body && body.success === false) {
        error = body.message || 'Não foi possível excluir o empréstimo.';
        return;
      }

      abrirModalDelete = false;
      emprestimoParaDeletar = null;

      await filtrarEmprestimos();
    } catch (e: any) {
      console.error('Erro ao deletar empréstimo:', e);
      error = e.response?.data?.message || 'Erro ao excluir empréstimo.';
    } finally {
      deleting = false;
    }
  }

  function formatarData(data: string | null | undefined) {
    if (!data) return 'Não informada';

    const valor = String(data);
    const dataISO = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (dataISO) {
      const [, ano, mes, dia] = dataISO;
      return `${dia}/${mes}/${ano}`;
    }

    const dataFormatada = new Date(valor);

    if (Number.isNaN(dataFormatada.getTime())) return 'Data inválida';

    return dataFormatada.toLocaleDateString('pt-BR');
  }

  function formatarStatus(status: string) {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'devolvido': return 'Devolvido';
      case 'atrasado': return 'Atrasado';
      default: return status || 'Indefinido';
    }
  }

  function iconeStatus(status: string) {
    switch (status) {
      case 'ativo': return '●';
      case 'devolvido': return '✓';
      case 'atrasado': return '!';
      default: return '•';
    }
  }

  $: totalAtivos = emprestimos.filter(
    (item) => item.status_emprestimo === 'ativo'
  ).length;

  $: totalDevolvidos = emprestimos.filter(
    (item) => item.status_emprestimo === 'devolvido'
  ).length;

  $: totalAtrasados = emprestimos.filter(
    (item) => item.status_emprestimo === 'atrasado'
  ).length;
</script>

<svelte:head>
  <title>Empréstimos | Arcane Library</title>
  <meta
    name="description"
    content="Consulte e gerencie os empréstimos da Arcane Library."
  />
</svelte:head>

<div class="loans-page">
  <!-- Cabeçalho -->
  <header class="page-header">
    <div class="header-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.7" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
        <path stroke-linecap="round" stroke-linejoin="round"
          d="M4 6h13M9 8v7" />
      </svg>
    </div>

    <div class="header-text">
      <p class="eyebrow">ARCANE LIBRARY</p>
      <h1>Empréstimos</h1>
      <p class="subtitle">
        Acompanhe os livros emprestados e mantenha tudo organizado.
      </p>
    </div>
  </header>

  <!-- Indicadores -->
  <section class="stats-grid" aria-label="Resumo dos empréstimos">
    <div class="stat-card">
      <div class="stat-icon total-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="1.8" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
        </svg>
      </div>
      <div>
        <p>Total listado</p>
        <strong>{emprestimos.length}</strong>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon active-icon">●</div>
      <div>
        <p>Ativos</p>
        <strong>{totalAtivos}</strong>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon returned-icon">✓</div>
      <div>
        <p>Devolvidos</p>
        <strong>{totalDevolvidos}</strong>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icon late-icon">!</div>
      <div>
        <p>Atrasados</p>
        <strong>{totalAtrasados}</strong>
      </div>
    </div>
  </section>

  <!-- Pesquisa -->
  <section class="search-panel">
    <div class="search-heading">
      <div>
        <h2>Consultar empréstimos</h2>
        <p>Pesquise pelo livro, usuário ou e-mail.</p>
      </div>
    </div>

    <form
      class="search-form"
      onsubmit={(event) => {
        event.preventDefault();
        clearTimeout(buscaTimeout);
        filtrarEmprestimos();
      }}
    >
      <div class="search-field">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path stroke-linecap="round" d="m16 16 4 4" />
        </svg>

        <input
          id="pesquisa"
          type="search"
          bind:value={consulta}
          oninput={pesquisarEmTempoReal}
          placeholder="Ex.: título do livro, login ou e-mail..."
          aria-label="Buscar empréstimos"
        />
      </div>

      <button type="submit" class="search-button">
        Buscar
      </button>

      <button
        type="button"
        class="clear-button"
        onclick={limparFiltros}
      >
        Limpar
      </button>
    </form>
  </section>

  {#if error}
    <div class="error-box" role="alert">
      <div>
        <strong>Não foi possível concluir a operação</strong>
        <p>{error}</p>
      </div>

      <button
        type="button"
        class="retry-button"
        onclick={() => filtrarEmprestimos(true)}
      >
        Tentar novamente
      </button>
    </div>
  {/if}

  <!-- Lista -->
  <section class="list-section">
    <div class="list-heading">
      <div>
        <h2>Registros de empréstimos</h2>
        <p>
          {emprestimos.length}
          {emprestimos.length === 1 ? 'registro encontrado' : 'registros encontrados'}
        </p>
      </div>
    </div>

    {#if loading}
      <div class="state-card">
        <Spinner size="8" color="purple" />
        <p>Carregando empréstimos...</p>
      </div>
    {:else if emprestimos.length === 0}
      <div class="state-card">
        <div class="empty-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="1.7" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
          </svg>
        </div>
        <h3>Nenhum empréstimo encontrado</h3>
        <p>
          {consulta
            ? 'Tente outro termo de pesquisa ou limpe os filtros.'
            : 'Os empréstimos cadastrados aparecerão aqui.'}
        </p>

        {#if consulta}
          <button type="button" class="clear-button empty-clear" onclick={limparFiltros}>
            Limpar pesquisa
          </button>
        {/if}
      </div>
    {:else}
      <div class="loans-grid">
        {#each emprestimos as emprestimo (emprestimo.id)}
          <article class="loan-card">
            <div class="loan-card-header">
              <div class="book-symbol">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  stroke-width="1.7" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h13" />
                </svg>
              </div>

              <span class={`status-badge status-${emprestimo.status_emprestimo}`}>
                <span>{iconeStatus(emprestimo.status_emprestimo)}</span>
                {formatarStatus(emprestimo.status_emprestimo)}
              </span>
            </div>

            <div class="loan-book">
              <p class="item-overline">LIVRO</p>
              <h3 title={emprestimo.livro ?? `Livro #${emprestimo.id_livro}`}>
                {emprestimo.livro ?? `Livro #${emprestimo.id_livro}`}
              </h3>
              <p class="record-id">Empréstimo #{emprestimo.id}</p>
            </div>

            <div class="loan-details">
              <div class="detail-row">
                <div class="detail-icon user-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.8" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" />
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M4.5 21a7.5 7.5 0 0 1 15 0" />
                  </svg>
                </div>
                <div class="detail-text">
                  <span>Usuário</span>
                  <strong>{emprestimo.usuario ?? `Usuário #${emprestimo.id_usuario}`}</strong>
                  {#if emprestimo.email_usuario}
                    <small>{emprestimo.email_usuario}</small>
                  {/if}
                </div>
              </div>

              <div class="detail-row">
                <div class="detail-icon date-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.8" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="16" rx="2" />
                    <path stroke-linecap="round" d="M16 3v4M8 3v4M3 10h18" />
                  </svg>
                </div>
                <div class="detail-text">
                  <span>Data do empréstimo</span>
                  <strong>{formatarData(emprestimo.data_de_emprestimo)}</strong>
                </div>
              </div>

              <div class="detail-row">
                <div class="detail-icon return-detail">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="1.8" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round"
                      d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 3v5h5" />
                  </svg>
                </div>
                <div class="detail-text">
                  <span>Data de devolução</span>
                  <strong>{formatarData(emprestimo.data_fim_emprestimo)}</strong>
                </div>
              </div>
            </div>

            <div class="card-actions">
              <button
                type="button"
                class="edit-button"
                onclick={() => goto(`/emprestimos/edit/${emprestimo.id}`)}
                aria-label={`Editar empréstimo ${emprestimo.id}`}
                disabled={loading || deleting}
              >
                <UserEditOutline class="h-5 w-5" />
                <span>Editar</span>
              </button>

              <button
                type="button"
                class="delete-button"
                onclick={() => abrirDelete(emprestimo)}
                aria-label={`Excluir empréstimo ${emprestimo.id}`}
                disabled={loading || deleting}
              >
                <TrashBinOutline class="h-5 w-5" />
                <span>Excluir</span>
              </button>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </section>
</div>

<!-- Modal de exclusão -->
<Modal bind:open={abrirModalDelete} size="md">
  <div class="delete-modal">
    <div class="modal-icon">
      <TrashBinOutline class="h-7 w-7" />
    </div>

    <h2>Excluir empréstimo?</h2>
    <p class="modal-description">
      Esta ação removerá o registro selecionado. Confirme se deseja continuar.
    </p>

    <div class="modal-record">
      <span>Livro</span>
      <strong>
        {emprestimoParaDeletar?.livro ??
          `Livro #${emprestimoParaDeletar?.id_livro ?? ''}`}
      </strong>

      <span>Usuário</span>
      <strong>
        {emprestimoParaDeletar?.usuario ??
          `Usuário #${emprestimoParaDeletar?.id_usuario ?? ''}`}
      </strong>
    </div>

    <div class="modal-actions">
      <Button color="light" onclick={cancelarDelete} disabled={deleting}>
        Cancelar
      </Button>

      <Button color="red" onclick={confirmarDelete} disabled={deleting}>
        {#if deleting}
          Excluindo...
        {:else}
          <TrashBinOutline class="mr-2 inline h-4 w-4" />
          Excluir empréstimo
        {/if}
      </Button>
    </div>
  </div>
</Modal>

<style>
.loans-page {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 34px 24px 56px;
    color: #111827;
}

/* CABEÇALHO */
.page-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 28px;
}

.header-icon {
    display: grid;
    place-items: center;
    width: 68px;
    height: 68px;
    flex-shrink: 0;
    color: #6d28d9;
    background: #ede9fe;
    border: 1px solid #ddd6fe;
    border-radius: 19px;
}

.header-icon svg {
    width: 32px;
    height: 32px;
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
    color: #111827;
    font-size: clamp(28px, 4vw, 36px);
    font-weight: 800;
    letter-spacing: -0.7px;
    line-height: 1.2;
}

.subtitle {
    margin: 9px 0 0;
    color: #6b7280;
    font-size: 15px;
    line-height: 1.6;
}

/* INDICADORES */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 15px;
    margin-bottom: 27px;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 13px;
    min-width: 0;
    padding: 18px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 17px;
    box-shadow: 0 5px 18px rgb(0 0 0 / 4%);
}

.stat-icon {
    display: grid;
    place-items: center;
    width: 43px;
    height: 43px;
    flex-shrink: 0;
    font-size: 18px;
    font-weight: 800;
    border-radius: 13px;
}

.stat-icon svg {
    width: 23px;
    height: 23px;
}

.total-icon {
    color: #6d28d9;
    background: #ede9fe;
}

.active-icon {
    color: #15803d;
    background: #dcfce7;
}

.returned-icon {
    color: #1d4ed8;
    background: #dbeafe;
}

.late-icon {
    color: #b91c1c;
    background: #fee2e2;
}

.stat-card p {
    margin: 0 0 5px;
    color: #6b7280;
    font-size: 12px;
}

.stat-card strong {
    color: #111827;
    font-size: 25px;
    font-weight: 800;
    line-height: 1.2;
}

/* PESQUISA */
.search-panel {
    margin-bottom: 32px;
    padding: 23px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 19px;
    box-shadow: 0 6px 22px rgb(0 0 0 / 4%);
}

.search-heading h2,
.list-heading h2 {
    margin: 0;
    color: #111827;
    font-size: 19px;
    font-weight: 800;
}

.search-heading p,
.list-heading p {
    margin: 6px 0 0;
    color: #6b7280;
    font-size: 13px;
    line-height: 1.5;
}

.search-form {
    display: flex;
    gap: 10px;
    margin-top: 18px;
}

.search-field {
    display: flex;
    align-items: center;
    flex: 1;
    gap: 11px;
    min-width: 0;
    min-height: 48px;
    padding: 0 14px;
    background: #f9fafb;
    border: 1px solid #d1d5db;
    border-radius: 11px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.search-field:focus-within {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 4px rgb(139 92 246 / 12%);
}

.search-field svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: #9ca3af;
}

.search-field input {
    width: 100%;
    min-width: 0;
    padding: 12px 0;
    color: #111827;
    font-size: 14px;
    background: transparent;
    border: 0;
    outline: none;
}

.search-field input::placeholder {
    color: #9ca3af;
}

.search-button,
.clear-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0 19px;
    font-size: 14px;
    font-weight: 700;
    border-radius: 11px;
    cursor: pointer;
    transition: background 0.2s;
}

.search-button {
    color: #ffffff;
    background: #6d28d9;
    border: 1px solid #6d28d9;
}

.search-button:hover:not(:disabled) {
    background: #5b21b6;
}

.clear-button {
    color: #374151;
    background: #ffffff;
    border: 1px solid #d1d5db;
}

.clear-button:hover:not(:disabled) {
    background: #f3f4f6;
}

.search-button:disabled,
.clear-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* ERROS */
.error-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 24px;
    padding: 17px;
    color: #991b1b;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 13px;
}

.error-box strong {
    font-size: 14px;
}

.error-box p {
    margin: 5px 0 0;
    font-size: 13px;
    line-height: 1.6;
}

.retry-button {
    flex-shrink: 0;
    padding: 9px 12px;
    color: #991b1b;
    font-size: 13px;
    font-weight: 700;
    border: 1px solid #fecaca;
    border-radius: 9px;
}

.retry-button:hover:not(:disabled) {
    background: #fee2e2;
}

/* LISTAGEM */
.list-section {
    margin-top: 10px;
}

.list-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 18px;
}

.loans-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
}

.loan-card {
    min-width: 0;
    overflow: hidden;
    padding: 21px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 19px;
    box-shadow: 0 6px 22px rgb(0 0 0 / 5%);
    transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.loan-card:hover {
    transform: translateY(-3px);
    border-color: #c4b5fd;
    box-shadow: 0 12px 27px rgb(0 0 0 / 8%);
}

.loan-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.book-symbol {
    display: grid;
    place-items: center;
    width: 47px;
    height: 47px;
    flex-shrink: 0;
    color: #6d28d9;
    background: #ede9fe;
    border-radius: 14px;
}

.book-symbol svg {
    width: 25px;
    height: 25px;
}

/* STATUS */
.status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    font-size: 12px;
    font-weight: 750;
    border-radius: 999px;
}

.status-ativo {
    color: #166534;
    background: #dcfce7;
}

.status-devolvido {
    color: #1e40af;
    background: #dbeafe;
}

.status-atrasado {
    color: #991b1b;
    background: #fee2e2;
}

/* LIVRO E DETALHES */
.loan-book {
    margin-top: 19px;
}

.item-overline {
    margin: 0 0 5px;
    color: #9ca3af;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.5px;
}

.loan-book h3 {
    overflow-wrap: anywhere;
    margin: 0;
    color: #111827;
    font-size: 20px;
    font-weight: 800;
    line-height: 1.4;
}

.record-id {
    margin: 6px 0 0;
    color: #6b7280;
    font-size: 12px;
}

.loan-details {
    display: flex;
    flex-direction: column;
    gap: 17px;
    margin-top: 22px;
    padding: 19px 0;
    border-top: 1px solid #f3f4f6;
    border-bottom: 1px solid #f3f4f6;
}

.detail-row {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    min-width: 0;
}

.detail-icon {
    display: grid;
    place-items: center;
    width: 35px;
    height: 35px;
    flex-shrink: 0;
    border-radius: 11px;
}

.detail-icon svg {
    width: 19px;
    height: 19px;
}

.user-detail {
    color: #6d28d9;
    background: #ede9fe;
}

.date-detail {
    color: #4b5563;
    background: #f3f4f6;
}

.return-detail {
    color: #4b5563;
    background: #f3f4f6;
}

.detail-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    padding-top: 1px;
}

.detail-text > span {
    color: #9ca3af;
    font-size: 12px;
}

.detail-text strong {
    overflow-wrap: anywhere;
    color: #1f2937;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.5;
}

.detail-text small {
    overflow-wrap: anywhere;
    color: #6b7280;
    font-size: 12px;
}

/* BOTÕES */
.card-actions {
    display: flex;
    gap: 10px;
    margin-top: 17px;
}

.edit-button,
.delete-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    gap: 8px;
    min-height: 42px;
    padding: 9px 12px;
    font-size: 13px;
    font-weight: 750;
    border: 1px solid transparent;
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s;
}

.edit-button {
    color: #6d28d9;
    background: #ffffff;
    border-color: #ddd6fe;
}

.edit-button:hover:not(:disabled) {
    background: #ede9fe;
}

.delete-button {
    color: #dc2626;
    background: #ffffff;
    border-color: #fecaca;
}

.delete-button:hover:not(:disabled) {
    background: #fef2f2;
}

.edit-button:disabled,
.delete-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

/* CARREGAMENTO E ESTADO VAZIO */
.state-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 55px 22px;
    text-align: center;
    background: #ffffff;
    border: 1px dashed #d1d5db;
    border-radius: 19px;
}

.state-card p {
    margin: 14px 0 0;
    color: #6b7280;
    font-size: 14px;
}

.state-card h3 {
    margin: 18px 0 0;
    color: #111827;
    font-size: 19px;
    font-weight: 800;
}

.state-card h3 + p {
    max-width: 410px;
    margin-top: 8px;
    line-height: 1.7;
}

.empty-icon {
    display: grid;
    place-items: center;
    width: 68px;
    height: 68px;
    color: #6d28d9;
    background: #ede9fe;
    border-radius: 20px;
}

.empty-icon svg {
    width: 35px;
    height: 35px;
}

.empty-clear {
    margin-top: 17px;
}

/* MODAL */
.delete-modal {
    padding: 10px 4px 2px;
    text-align: center;
}

.modal-icon {
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    margin: 0 auto 17px;
    color: #dc2626;
    background: #fee2e2;
    border-radius: 18px;
}

.delete-modal h2 {
    margin: 0;
    color: #111827;
    font-size: 22px;
    font-weight: 800;
}

.modal-description {
    margin: 10px auto 21px;
    max-width: 370px;
    color: #6b7280;
    font-size: 14px;
    line-height: 1.7;
}

.modal-record {
    display: grid;
    grid-template-columns: 90px minmax(0, 1fr);
    gap: 10px 14px;
    padding: 16px;
    text-align: left;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 13px;
}

.modal-record span {
    color: #6b7280;
    font-size: 13px;
}

.modal-record strong {
    overflow-wrap: anywhere;
    color: #1f2937;
    font-size: 13px;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 24px;
}

/* RESPONSIVIDADE */
@media (max-width: 900px) {
    .stats-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .loans-grid {
        grid-template-columns: minmax(0, 1fr);
    }
}

@media (max-width: 600px) {
    .loans-page {
        padding: 24px 14px 38px;
    }

    .page-header {
        align-items: flex-start;
        gap: 13px;
    }

    .header-icon {
        width: 53px;
        height: 53px;
        border-radius: 15px;
    }

    .header-icon svg {
        width: 26px;
        height: 26px;
    }

    .subtitle {
        font-size: 14px;
    }

    .stats-grid {
        gap: 10px;
    }

    .stat-card {
        gap: 10px;
        padding: 13px;
        border-radius: 14px;
    }

    .stat-icon {
        width: 37px;
        height: 37px;
        border-radius: 11px;
    }

    .stat-card p {
        font-size: 11px;
    }

    .stat-card strong {
        font-size: 22px;
    }

    .search-panel {
        padding: 18px;
        border-radius: 16px;
    }

    .search-form {
        flex-wrap: wrap;
    }

    .search-field {
        flex-basis: 100%;
    }

    .search-button,
    .clear-button {
        flex: 1;
    }

    .loan-card {
        padding: 17px;
        border-radius: 16px;
    }

    .loan-book h3 {
        font-size: 18px;
    }

    .error-box {
        align-items: flex-start;
        flex-direction: column;
    }

    .modal-actions {
        flex-wrap: wrap;
    }
}

/* MODO ESCURO */
:global(.dark) .loans-page {
    color: #f9fafb;
}

:global(.dark) .header-icon {
    color: #c4b5fd;
    background: #2e1065;
    border-color: #4c1d95;
}

:global(.dark) .eyebrow {
    color: #c4b5fd;
}

:global(.dark) .header-text h1,
:global(.dark) .search-heading h2,
:global(.dark) .list-heading h2,
:global(.dark) .loan-book h3,
:global(.dark) .stat-card strong,
:global(.dark) .state-card h3,
:global(.dark) .delete-modal h2 {
    color: #ffffff;
}

:global(.dark) .subtitle,
:global(.dark) .search-heading p,
:global(.dark) .list-heading p,
:global(.dark) .stat-card p,
:global(.dark) .record-id,
:global(.dark) .detail-text > span,
:global(.dark) .detail-text small,
:global(.dark) .state-card p,
:global(.dark) .modal-description {
    color: #9ca3af;
}

:global(.dark) .stat-card,
:global(.dark) .search-panel,
:global(.dark) .loan-card,
:global(.dark) .state-card {
    background: #1f2937;
    border-color: #374151;
}

:global(.dark) .total-icon,
:global(.dark) .book-symbol,
:global(.dark) .user-detail,
:global(.dark) .empty-icon {
    color: #c4b5fd;
    background: #2e1065;
}

:global(.dark) .active-icon {
    color: #86efac;
    background: #14532d;
}

:global(.dark) .returned-icon {
    color: #93c5fd;
    background: #1e3a8a;
}

:global(.dark) .late-icon {
    color: #fca5a5;
    background: #7f1d1d;
}

:global(.dark) .search-field {
    background: #111827;
    border-color: #4b5563;
}

:global(.dark) .search-field:focus-within {
    border-color: #8b5cf6;
    box-shadow: 0 0 0 4px rgb(139 92 246 / 15%);
}

:global(.dark) .search-field input {
    color: #ffffff;
}

:global(.dark) .search-field input::placeholder {
    color: #6b7280;
}

:global(.dark) .search-field svg {
    color: #9ca3af;
}

:global(.dark) .search-button {
    color: #ffffff;
    background: #6d28d9;
    border-color: #6d28d9;
}

:global(.dark) .search-button:hover:not(:disabled) {
    background: #5b21b6;
}

:global(.dark) .clear-button {
    color: #d1d5db;
    background: #374151;
    border-color: #4b5563;
}

:global(.dark) .clear-button:hover:not(:disabled) {
    background: #4b5563;
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

:global(.dark) .retry-button:hover:not(:disabled) {
    background: #450a0a;
}

:global(.dark) .loan-card:hover {
    border-color: #6d28d9;
}

:global(.dark) .status-ativo {
    color: #86efac;
    background: #14532d;
}

:global(.dark) .status-devolvido {
    color: #93c5fd;
    background: #1e3a8a;
}

:global(.dark) .status-atrasado {
    color: #fca5a5;
    background: #7f1d1d;
}

:global(.dark) .item-overline {
    color: #9ca3af;
}

:global(.dark) .loan-details {
    border-color: #374151;
}

:global(.dark) .date-detail,
:global(.dark) .return-detail {
    color: #d1d5db;
    background: #374151;
}

:global(.dark) .detail-text strong {
    color: #e5e7eb;
}

:global(.dark) .edit-button {
    color: #c4b5fd;
    background: #1f2937;
    border-color: #4c1d95;
}

:global(.dark) .edit-button:hover:not(:disabled) {
    background: #2e1065;
}

:global(.dark) .delete-button {
    color: #f87171;
    background: #1f2937;
    border-color: #7f1d1d;
}

:global(.dark) .delete-button:hover:not(:disabled) {
    background: #450a0a;
}

:global(.dark) .modal-icon {
    color: #f87171;
    background: #450a0a;
}

:global(.dark) .modal-record {
    background: #111827;
    border-color: #374151;
}

:global(.dark) .modal-record span {
    color: #9ca3af;
}

:global(.dark) .modal-record strong {
    color: #e5e7eb;
}

@media (prefers-reduced-motion: reduce) {
    .loan-card,
    .edit-button,
    .delete-button,
    .search-field {
        transition: none;
    }
}
</style>
