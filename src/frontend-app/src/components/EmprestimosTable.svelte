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

        if (isNaN(dataFormatada.getTime())) {
            return data;
        }

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

        <div class="w-full overflow-x-auto max-w-5xl mx-auto my-10 shadow-lg border border-gray-200 rounded-lg bg-white">

            <Table class="min-w-[1100px] w-full border">

                <thead>
                    <tr>
                        <th class="whitespace-nowrap">
                            Livro emprestado
                        </th>

                        <th class="whitespace-nowrap">
                            Usuário
                        </th>

                        <th class="whitespace-nowrap">
                            Data de empréstimo
                        </th>

                        <th class="whitespace-nowrap">
                            Data de devolução
                        </th>

                        <th class="whitespace-nowrap">
                            Status
                        </th>

                        <th class="whitespace-nowrap">
                            Ações
                        </th>
                    </tr>
                </thead>

                <tbody>

                    {#each emprestimos as emprestimo}

                        <tr>

                            <td>
                                {emprestimo.livro ?? `Livro #${emprestimo.id_livro}`}
                            </td>

                            <td>
                                {emprestimo.usuario ?? `Usuário #${emprestimo.id_usuario}`}
                            </td>

                            <td>
                                {formatarData(
                                    emprestimo.data_de_emprestimo
                                )}
                            </td>

                            <td>
                                {formatarData(
                                    emprestimo.data_fim_emprestimo
                                )}
                            </td>

                            <td>
                                {formatarStatus(
                                    emprestimo.status_emprestimo
                                )}
                            </td>

                            <td>

                                <div class="flex gap-2">

                                    <Button
                                        size="sm"
                                        color="light"
                                        onclick={() =>
                                            goto(
                                                `/emprestimos/edit/${emprestimo.id}`
                                            )
                                        }
                                    >
                                        Editar
                                    </Button>

                                    <Button
                                        size="sm"
                                        color="red"
                                        onclick={() =>
                                            abrirDelete(
                                                emprestimo
                                            )
                                        }
                                    >
                                        <TrashBinOutline
                                            class="w-4 h-4"
                                        />
                                    </Button>

                                </div>

                            </td>

                        </tr>

                    {/each}

                </tbody>

            </Table>

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
