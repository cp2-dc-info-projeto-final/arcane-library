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
    let error = '';
    let consulta = '';

    let abrirModalDelete = false;
    let emprestimoParaDeletar: EmprestimoTabela | null = null;

    onMount(async () => {
        await filtrarEmprestimos();
    });

    async function filtrarEmprestimos() {
        loading = true;
        error = '';

        try {
            const params = new URLSearchParams();

            if (consulta.trim()) {
                params.append('consulta', consulta.trim());
            }

            const res = await api.get(`/emprestimos?${params.toString()}`);
            const body = res.data as ApiResponse<EmprestimoTabela[]>;

            if (body?.success) {
                emprestimos = body.data ?? [];
            } else {
                error = body?.message || 'Erro ao carregar empréstimos.';
                emprestimos = [];
            }
        } catch (e: any) {
            console.error('Erro ao carregar empréstimos:', e);
            const body = e.response?.data as ApiResponse<EmprestimoTabela[]> | undefined;
            error = body?.message || 'Erro ao carregar empréstimos.';
            emprestimos = [];
        } finally {
            loading = false;
        }
    }

    async function limparFiltros() {
        consulta = '';
        await filtrarEmprestimos();
    }

    function abrirDelete(emprestimo: EmprestimoTabela) {
        emprestimoParaDeletar = emprestimo;
        abrirModalDelete = true;
    }

    function cancelarDelete() {
        abrirModalDelete = false;
        emprestimoParaDeletar = null;
    }

    async function confirmarDelete() {
        if (!emprestimoParaDeletar) return;

        const id = emprestimoParaDeletar.id;
        if (!id) {
            error = 'Não foi possível identificar o empréstimo.';
            return;
        }

        loading = true;
        error = '';

        try {
            await api.delete(`/emprestimos/${id}`);
            abrirModalDelete = false;
            emprestimoParaDeletar = null;
            await filtrarEmprestimos();
        } catch (e: any) {
            console.error('Erro ao deletar empréstimo:', e);
            error = e.response?.data?.message || 'Erro ao deletar empréstimo.';
        } finally {
            loading = false;
        }
    }

    function formatarData(data: string | null | undefined) {
        if (!data) return '—';
        const dataFormatada = new Date(data);
        return dataFormatada.toLocaleString('pt-BR');
    }

    function formatarStatus(status: string) {
        switch (status) {
            case 'ativo': return 'Ativo';
            case 'devolvido': return 'Devolvido';
            case 'atrasado': return 'Atrasado';
            default: return status;
        }
    }

    function corStatus(status: string) {
        switch (status) {
            case 'ativo': return 'bg-blue-100 text-blue-800';
            case 'devolvido': return 'bg-green-100 text-green-800';
            case 'atrasado': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }
</script>

<!-- BUSCA -->
<div class="w-full max-w-6xl mx-auto px-4 mb-6">
    <div class="mb-4">
        <label for="pesquisa" class="block mb-2 text-sm font-medium text-black-900">
            Buscar empréstimos
        </label>
        <input
            type="text"
            id="pesquisa"
            bind:value={consulta}
            placeholder="Digite o título do livro, usuário ou e-mail..."
            class="w-full p-2 text-sm border border-gray-300 rounded-lg"
        />
    </div>

    <div class="flex gap-2">
        <Button size="sm" color="blue" onclick={filtrarEmprestimos} disabled={loading}>Buscar</Button>
        <Button size="sm" color="light" onclick={limparFiltros} disabled={loading}>Limpar filtros</Button>
    </div>
</div>

<!-- LISTA VERTICAL DE CARDS (centralizada) -->
<div class="w-full max-w-6xl mx-auto px-4">
    {#if error}
        <div class="mb-4 p-4 text-sm text-red-500 bg-red-100 rounded">{error}</div>
    {/if}

    {#if loading}
        <div class="flex justify-center p-8"><Spinner /></div>
    {:else if emprestimos.length === 0}
        <div class="text-center p-8 text-black-900">Nenhum empréstimo encontrado.</div>
    {:else}
        <!-- Contêiner centralizado -->
        <div class="w-full max-w-2xl mx-auto my-8">
            <!-- Lista vertical centralizada -->
            <div class="flex flex-col items-center gap-4">
                {#each emprestimos as emprestimo}
                    <!-- Card de empréstimo -->
                    <div class="w-full max-w-md p-0 overflow-hidden shadow-lg border border-green-200 rounded-lg bg-white">
                        <!-- Cabeçalho -->
                        <div class="px-4 pt-4 pb-2 bg-green-100 text-left flex items-center justify-between">
                            <div class="min-w-0">
                                <div class="text-base font-semibold text-gray-800 truncate">
                                    {emprestimo.livro ?? `Livro #${emprestimo.id_livro}`}
                                </div>
                                <div class="text-xs text-gray-400">
                                    ID: {emprestimo.id}
                                </div>
                                <div class="mt-1">
                                    <span class={`px-2 py-0.5 text-xs rounded-full ${corStatus(emprestimo.status_emprestimo)}`}>
                                        {formatarStatus(emprestimo.status_emprestimo)}
                                    </span>
                                </div>
                            </div>
                            <div class="flex gap-2 flex-shrink-0">
                                <!-- Botão editar -->
                                <button
                                    class="p-2 rounded border border-primary-200 hover:border-primary-400 transition bg-transparent"
                                    title="Editar"
                                    on:click={() => goto(`/emprestimos/edit/${emprestimo.id}`)}
                                >
                                    <UserEditOutline class="w-4 h-4 text-primary-500" />
                                </button>
                                <!-- Botão remover -->
                                <button
                                    title="Remover"
                                    class="p-2 rounded border border-red-100 hover:border-red-300 transition bg-transparent"
                                    on:click={() => abrirDelete(emprestimo)}
                                    disabled={loading}
                                >
                                    <TrashBinOutline class="w-4 h-4 text-red-400" />
                                </button>
                            </div>
                        </div>

                        <!-- Corpo -->
                        <div class="px-4 pb-3 pt-2 flex flex-col gap-1.5 text-left">
                            <!-- Usuário -->
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"/>
                                </svg>
                                <span class="text-gray-700 text-sm truncate">
                                    {emprestimo.usuario ?? `Usuário #${emprestimo.id_usuario}`}
                                </span>
                            </div>

                            <!-- Data de empréstimo -->
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/>
                                </svg>
                                <span class="text-gray-700 text-sm truncate">
                                    <strong>Empréstimo:</strong> {formatarData(emprestimo.data_de_emprestimo)}
                                </span>
                            </div>

                            <!-- Data de devolução -->
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/>
                                </svg>
                                <span class="text-gray-700 text-sm truncate">
                                    <strong>Devolução:</strong> {formatarData(emprestimo.data_fim_emprestimo)}
                                </span>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>

<!-- MODAL DE EXCLUSÃO -->
<Modal bind:open={abrirModalDelete} size="sm">
    <div class="p-6">
        <h3 class="text-lg font-semibold mb-4">
            Deseja deletar este empréstimo?
        </h3>

        <p class="mb-3 text-gray-600 text-sm">
            Livro:
            <strong>
                {emprestimoParaDeletar?.livro ?? `Livro #${emprestimoParaDeletar?.id_livro}`}
            </strong>
        </p>

        <p class="mb-6 text-gray-600 text-sm">
            Usuário:
            <strong>
                {emprestimoParaDeletar?.usuario ?? `Usuário #${emprestimoParaDeletar?.id_usuario}`}
            </strong>
        </p>

        <div class="flex gap-2 justify-end">
            <Button color="light" onclick={cancelarDelete} disabled={loading}>
                Cancelar
            </Button>
            <Button color="red" onclick={confirmarDelete} disabled={loading}>
                {loading ? 'Deletando...' : 'Deletar'}
            </Button>
        </div>
    </div>
</Modal>