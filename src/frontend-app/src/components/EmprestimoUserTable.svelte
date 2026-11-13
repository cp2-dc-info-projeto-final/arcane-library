
<script lang="ts">
    import { onMount } from 'svelte';
    import { Spinner } from 'flowbite-svelte';
    import type { ApiResponse } from '$lib/models/ApiResponse';

    interface EmprestimoUsuario {
        id: number;
        id_usuario: number;
        id_livro: number;
        livro: string;
        data_de_emprestimo: string;
        data_fim_emprestimo: string;
        status_emprestimo: string;
    }

    let emprestimos: EmprestimoUsuario[] = [];
    let loading = true;
    let erro = '';

    async function carregarEmprestimos() {
        loading = true;
        erro = '';

        try {
            const response = await api.get<ApiResponse<EmprestimoUsuario[]>>(
                '/emprestimos/meus'
            );

            if (response.data.success) {
                emprestimos = response.data.data ?? [];
            } else {
                erro = response.data.message || 'Não foi possível carregar seus empréstimos.';
            }
        } catch (error) {
            console.error('Erro ao carregar empréstimos:', error);
            erro = 'Ocorreu um erro ao carregar seus empréstimos.';
        } finally {
            loading = false;
        }
    }

    function formatarData(data: string) {
        if (!data) return 'Não informada';

        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }

    function formatarStatus(status: string) {
        const statusFormatado: Record<string, string> = {
            ativo: 'Ativo',
            devolvido: 'Devolvido',
            atrasado: 'Atrasado'
        };

        return statusFormatado[status] || status;
    }

    onMount(carregarEmprestimos);
</script>

<section class="emprestimos-container">
    <div class="cabecalho">
        <div>
            <h2>Meus empréstimos</h2>
            <p>Acompanhe os livros emprestados em sua conta.</p>
        </div>

        <button class="atualizar-btn" onclick={carregarEmprestimos}>
            Atualizar
        </button>
    </div>

    {#if loading}
        <div class="estado">
            <Spinner size="8" />
            <p>Carregando seus empréstimos...</p>
        </div>
    {:else if erro}
        <div class="mensagem erro">
            {erro}
        </div>
    {:else if emprestimos.length === 0}
        <div class="estado vazio">
            <h3>Nenhum empréstimo encontrado</h3>
            <p>Quando um empréstimo for cadastrado para sua conta, ele aparecerá aqui.</p>
        </div>
    {:else}
        <div class="contador">
            {emprestimos.length}
            {emprestimos.length === 1 ? ' empréstimo encontrado' : ' empréstimos encontrados'}
        </div>

        <div class="lista-emprestimos">
            {#each emprestimos as emprestimo (emprestimo.id)}
                <article class="emprestimo-card">
                    <div class="livro-info">
                        <div class="livro-icone">📚</div>

                        <div>
                            <h3>{emprestimo.livro}</h3>
                            <span>Empréstimo #{emprestimo.id}</span>
                        </div>
                    </div>

                    <div class="datas">
                        <div>
                            <span>Data do empréstimo</span>
                            <strong>{formatarData(emprestimo.data_de_emprestimo)}</strong>
                        </div>

                        <div>
                            <span>Data de devolução</span>
                            <strong>{formatarData(emprestimo.data_fim_emprestimo)}</strong>
                        </div>
                    </div>

                    <div class="status-container">
                        <span class="status" class:ativo={emprestimo.status_emprestimo === 'ativo'}
                            class:devolvido={emprestimo.status_emprestimo === 'devolvido'}
                            class:atrasado={emprestimo.status_emprestimo === 'atrasado'}>
                            {formatarStatus(emprestimo.status_emprestimo)}
                        </span>
                    </div>
                </article>
            {/each}
        </div>
    {/if}
</section>

<style>
    .emprestimos-container {
        width: 100%;
        padding: 24px;
        color: #374151;
    }

    .cabecalho {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
    }

    .cabecalho h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #6d28d9;
    }

    .cabecalho p {
        margin-top: 5px;
        color: #6b7280;
    }

    .atualizar-btn {
        padding: 9px 16px;
        border-radius: 8px;
        background: #7c3aed;
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s;
    }

    .atualizar-btn:hover {
        background: #6d28d9;
    }

    .estado {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 200px;
        color: #6b7280;
        text-align: center;
    }

    .vazio h3 {
        color: #374151;
        font-size: 1.1rem;
        font-weight: 700;
    }

    .mensagem {
        padding: 16px;
        border-radius: 8px;
    }

    .erro {
        background: #fee2e2;
        color: #b91c1c;
    }

    .contador {
        margin-bottom: 16px;
        color: #6b7280;
        font-size: 0.9rem;
    }

    .lista-emprestimos {
        display: grid;
        gap: 16px;
    }

    .emprestimo-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 20px;
        padding: 20px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        background: white;
        box-shadow: 0 2px 5px rgb(0 0 0 / 4%);
    }

    .livro-info {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 180px;
    }

    .livro-icone {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 46px;
        height: 46px;
        border-radius: 10px;
        background: #ede9fe;
        font-size: 1.4rem;
    }

    .livro-info h3 {
        font-weight: 700;
        color: #374151;
    }

    .livro-info span,
    .datas span {
        display: block;
        margin-top: 4px;
        color: #9ca3af;
        font-size: 0.8rem;
    }

    .datas {
        display: flex;
        flex-wrap: wrap;
        gap: 28px;
    }

    .datas strong {
        display: block;
        margin-top: 5px;
        color: #4b5563;
        font-size: 0.9rem;
    }

    .status {
        display: inline-block;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
    }

    .status.ativo {
        background: #dbeafe;
        color: #1d4ed8;
    }

    .status.devolvido {
        background: #dcfce7;
        color: #15803d;
    }

    .status.atrasado {
        background: #fee2e2;
        color: #b91c1c;
    }

    :global(.dark) .emprestimos-container {
        color: #e5e7eb;
    }

    :global(.dark) .cabecalho p,
    :global(.dark) .contador {
        color: #9ca3af;
    }

    :global(.dark) .emprestimo-card {
        background: #1f2937;
        border-color: #374151;
    }

    :global(.dark) .livro-info h3,
    :global(.dark) .datas strong,
    :global(.dark) .vazio h3 {
        color: #f3f4f6;
    }

    :global(.dark) .livro-icone {
        background: #4c1d95;
    }

    @media (max-width: 640px) {
        .emprestimos-container {
            padding: 14px;
        }

        .cabecalho {
            align-items: flex-start;
        }

        .emprestimo-card {
            align-items: flex-start;
            flex-direction: column;
        }

        .datas {
            flex-direction: column;
            gap: 14px;
        }
    }
</style>
