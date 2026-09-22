<script lang="ts">
    import { onMount } from 'svelte';
    import { Button, Table, Spinner, Modal } from 'flowbite-svelte';
    import { TrashBinOutline } from 'flowbite-svelte-icons';
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

            const res = await api.get(
                `/emprestimos?${params.toString()}`
            );

            const body = res.data as ApiResponse<EmprestimoTabela[]>;

            if (body?.success) {
                emprestimos = body.data ?? [];
            } else {
                error =
                    body?.message ||
                    'Erro ao carregar empréstimos.';

                emprestimos = [];
            }
        } catch (e: any) {
            console.error(
                'Erro ao carregar empréstimos:',
                e
            );

            const body = e.response?.data as
                | ApiResponse<EmprestimoTabela[]>
                | undefined;

            error =
                body?.message ||
                'Erro ao carregar empréstimos.';

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
        if (!emprestimoParaDeletar) {
            return;
        }

        const id = emprestimoParaDeletar.id;

        if (!id) {
            error =
                'Não foi possível identificar o empréstimo.';
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
            console.error(
                'Erro ao deletar empréstimo:',
                e
            );

            error =
                e.response?.data?.message ||
                'Erro ao deletar empréstimo.';
        } finally {
            loading = false;
        }
    }

    function formatarData(data: string | null | undefined) {
        if (!data) {
            return '—';
        }

        const dataFormatada = new Date(data);
        return dataFormatada.toLocaleString('pt-BR');
    }

    function formatarStatus(status: string) {
        switch (status) {
            case 'ativo':
                return 'Ativo';

            case 'devolvido':
                return 'Devolvido';

            case 'atrasado':
                return 'Atrasado';

            default:
                return status;
        }
    }
</script>

<div class="w-full max-w-6xl mx-auto px-4 mb-6">

    <div class="mb-4">
        <label
            for="pesquisa"
            class="block mb-2 text-sm font-medium text-black-900"
        >
            Buscar empréstimos
        </label>

        <input
            type="text"
            id="pesquisa"
            bind:value={consulta}
            placeholder="Digite o título do livro, usuário ou e-mail..."
            class="w-full p-2 border border-gray-300 rounded-lg"
        />
    </div>

    <div class="flex gap-2">

        <Button
            color="blue"
            onclick={filtrarEmprestimos}
            disabled={loading}
        >
            Buscar
        </Button>

        <Button
            color="light"
            onclick={limparFiltros}
            disabled={loading}
        >
            Limpar filtros
        </Button>

    </div>

</div>

<div class="w-full max-w-6xl mx-auto px-4">

    {#if error}
        <div class="mb-4 p-4 text-red-500 bg-red-100 rounded">
            {error}
        </div>
    {/if}

    {#if loading}

        <div class="flex justify-center p-8">
            <Spinner />
        </div>

    {:else if emprestimos.length === 0}

        <div class="text-center p-8 text-black-900">
            Nenhum empréstimo encontrado.
        </div>

    {:else}

        <!-- Alterado 'mx-auto' para 'ml-0 mr-auto' e adicionado 'inline-block align-top' -->
<div class="w-full max-w-5xl ml-0 mr-auto my-10 inline-block align-top shadow-lg border border-gray-200 rounded-lg bg-white overflow-hidden">
    <table class="w-full table-fixed md:table-auto border-collapse">
        
        <!-- Cabeçalho -->
        <thead class="hidden md:table-header-group bg-gray-50 border-b border-gray-200">
            <tr>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Livro emprestado</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuário</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data de empréstimo</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data de devolução</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Ações</th>
            </tr>
        </thead>

        <!-- Corpo da Tabela -->
        <tbody class="block md:table-row-group divide-y divide-gray-200">
            {#each emprestimos as emprestimo}
                <tr class="block md:table-row p-4 mb-4 md:p-0 md:mb-0 bg-white border-b md:border-b-0 last:border-b-0 shadow-sm md:shadow-none rounded-lg md:rounded-none border md:border-transparent max-w-full">
                    
                    <!-- Livro -->
                    <td class="block md:table-cell py-2 md:py-4 px-4 md:px-6 text-sm text-gray-900 break-words max-w-full before:content-['Livro:'] before:font-semibold before:text-gray-500 before:block before:text-xs before:uppercase md:before:hidden">
                        <span class="font-medium md:font-normal block md:inline">{emprestimo.livro ?? `Livro #${emprestimo.id_livro}`}</span>
                    </td>

                    <!-- Usuário -->
                    <td class="block md:table-cell py-2 md:py-4 px-4 md:px-6 text-sm text-gray-700 break-words max-w-full before:content-['Usuário:'] before:font-semibold before:text-gray-500 before:block before:text-xs before:uppercase md:before:hidden">
                        <span class="block md:inline">{emprestimo.usuario ?? `Usuário #${emprestimo.id_usuario}`}</span>
                    </td>

                    <!-- Data Empréstimo -->
                    <td class="block md:table-cell py-2 md:py-4 px-4 md:px-6 text-sm text-gray-600 before:content-['Data_de_Empréstimo:'] before:font-semibold before:text-gray-500 before:block before:text-xs before:uppercase md:before:hidden">
                        <span class="block md:inline">{formatarData(emprestimo.data_de_emprestimo)}</span>
                    </td>

                    <!-- Data Devolução -->
                    <td class="block md:table-cell py-2 md:py-4 px-4 md:px-6 text-sm text-gray-600 before:content-['Data_de_Devolução:'] before:font-semibold before:text-gray-500 before:block before:text-xs before:uppercase md:before:hidden">
                        <span class="block md:inline">{formatarData(emprestimo.data_fim_emprestimo)}</span>
                    </td>

                    <!-- Status -->
                    <td class="block md:table-cell py-2 md:py-4 px-4 md:px-6 text-sm before:content-['Status:'] before:font-semibold before:text-gray-500 before:block before:text-xs before:uppercase md:before:hidden">
                        <span class="inline-block pt-1 md:pt-0">
                            {formatarStatus(emprestimo.status_emprestimo)}
                        </span>
                    </td>

                     
                    <!-- Ações  TEM ALGO FALTANDO AQUI                    -->
                    
                    <td class="block md:table-cell py-3 md:py-4 px-4 md:px-6 text-sm before:content-['Ações:'] before:font-semibold before:text-gray-500 before:block before:text-xs before:uppercase md:before:hidden">
                        <div class="flex flex-wrap md:flex-nowrap gap-2 mt-1 md:mt-0">
                            <Button size="sm" color="light" onclick={() => goto(`/emprestimos/edit/${emprestimo.id}`)}>
                                Editar
                            </Button>
                            <Button size="sm" color="red" onclick={() => abrirDelete(emprestimo)}>
                                <TrashBinOutline class="w-4 h-4" />
                            </Button>
                        </div>
                    </td>

                </tr>
            {/each}
        </tbody>

    </table>
</div>

    {/if}

</div>

<Modal
    bind:open={abrirModalDelete}
    size="sm"
>
    <div class="p-6">

        <h3 class="text-lg font-semibold mb-4">
            Deseja deletar este empréstimo?
        </h3>

        <p class="mb-6 text-gray-600">
            Livro:
            <strong>
                {emprestimoParaDeletar?.livro ??
                    `Livro #${emprestimoParaDeletar?.id_livro}`}
            </strong>
        </p>

        <p class="mb-6 text-gray-600">
            Usuário:
            <strong>
                {emprestimoParaDeletar?.usuario ??
                    `Usuário #${emprestimoParaDeletar?.id_usuario}`}
            </strong>
        </p>

        <div class="flex gap-2 justify-end">

            <Button
                color="light"
                onclick={cancelarDelete}
                disabled={loading}
            >
                Cancelar
            </Button>

            <Button
                color="red"
                onclick={confirmarDelete}
                disabled={loading}
            >
                {loading ? 'Deletando...' : 'Deletar'}
            </Button>

        </div>

    </div>
</Modal>
