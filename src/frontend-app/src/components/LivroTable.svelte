    <script lang="ts">
    import { onMount } from 'svelte';
    import { Button, Table, Spinner, Modal } from 'flowbite-svelte';
    import { TrashBinOutline } from 'flowbite-svelte-icons';
    import { goto } from '$app/navigation';

    import api from '$lib/api';
    import type { ApiResponse } from '$lib/api';
    import type { Livro } from '$lib/models/Livros';

    let livros: Livro[] = [];

    let loading = true;
    let error = '';
    let consulta = '';

    let abrirModalDelete = false;
    let livroParaDeletar: Livro | null = null;

    interface Categoria {
        id_categorias: number;
        nome: string;
    }

    let categorias: Categoria[] = [];
    let categoriasSelecionadas: number[] = [];

    onMount(async () => {
        await carregarCategorias();
        await filtrarLivros();
    });

    // =========================
    // CARREGAR CATEGORIAS
    // =========================

    async function carregarCategorias() {
        try {
            const res = await api.get('/categorias');

            const body = res.data as ApiResponse<Categoria[]>;

            if (body?.success) {
                categorias = body.data ?? [];
            } else {
                categorias = [];
            }
        } catch (e) {
            console.error('Erro ao carregar categorias:', e);
            categorias = [];
        }
    }

    // =========================
    // BUSCAR LIVROS
    // =========================

    async function filtrarLivros() {
        loading = true;
        error = '';

        try {
            const params = new URLSearchParams();

            if (consulta.trim()) {
                params.append('consulta', consulta.trim());
            }

            if (categoriasSelecionadas.length > 0) {
                params.append(
                    'categorias',
                    categoriasSelecionadas.join(',')
                );
            }

            const res = await api.get(
                `/livros?${params.toString()}`
            );

            const body = res.data as ApiResponse<Livro[]>;

            if (body?.success) {
                livros = body.data ?? [];
            } else {
                error =
                    body?.message ||
                    'Erro ao carregar livros.';

                livros = [];
            }
        } catch (e: any) {
            console.error(
                'Erro ao carregar livros:',
                e
            );

            const body = e.response?.data as
                | ApiResponse<Livro[]>
                | undefined;

            error =
                body?.message ||
                'Erro ao carregar livros.';

            livros = [];
        } finally {
            loading = false;
        }
    }

    // =========================
    // SELECIONAR CATEGORIA
    // =========================

    function toggleCategoria(idCategoria: number) {
        if (
            categoriasSelecionadas.includes(
                idCategoria
            )
        ) {
            categoriasSelecionadas =
                categoriasSelecionadas.filter(
                    id => id !== idCategoria
                );
        } else {
            categoriasSelecionadas = [
                ...categoriasSelecionadas,
                idCategoria
            ];
        }
    }

    // =========================
    // LIMPAR FILTROS
    // =========================

    async function limparFiltros() {
        consulta = '';
        categoriasSelecionadas = [];

        await filtrarLivros();
    }

    // =========================
    // EXCLUIR LIVRO
    // =========================

    function abrirDelete(livro: Livro) {
        console.log(
            'Livro selecionado para excluir:',
            livro
        );

        livroParaDeletar = livro;
        abrirModalDelete = true;
    }

    function cancelarDelete() {
        abrirModalDelete = false;
        livroParaDeletar = null;
    }

    async function confirmarDelete() {
        if (!livroParaDeletar) {
            return;
        }

        const id = livroParaDeletar.id;

        if (!id) {
            error =
                'Não foi possível identificar o livro.';
            return;
        }

        loading = true;
        error = '';

        try {
            console.log(
                'Excluindo livro:',
                id
            );

            const res = await api.delete(
                `/livros/${id}`
            );

            console.log(
                'Resposta da exclusão:',
                res.data
            );

            abrirModalDelete = false;
            livroParaDeletar = null;

            await filtrarLivros();
        } catch (e: any) {
            console.error(
                'Erro ao deletar livro:',
                e
            );

            console.error(
                'Status:',
                e.response?.status
            );

            console.error(
                'Resposta:',
                e.response?.data
            );

            error =
                e.response?.data?.message ||
                'Erro ao deletar livro.';
        } finally {
            loading = false;
        }
    }
</script>



<div class="w-full max-w-6xl mx-auto px-4 mb-6">

    <!-- BUSCA POR TEXTO -->
    <div class="mb-4">
        <label
            for="pesquisa"
            class="block mb-2 text-sm font-medium text-black-900"
        >
            Buscar livros
        </label>

        <input
            type="text"
            id="pesquisa"
            bind:value={consulta}
            placeholder="Digite o título do livro..."
            class="w-full p-2 border border-gray-300 rounded-lg"
        />
    </div>

    <!-- CATEGORIAS -->
    <div class="mb-16">

        <span class="block mb-2 text-sm font-medium text-black-900">
            Categorias
        </span>

        <div class="flex flex-wrap gap-2">

            {#each categorias as categoria}

                <button
                    type="button"
                    onclick={() =>
                        toggleCategoria(
                            categoria.id_categorias
                        )
                    }
                    class={`px-3 py-2 rounded-lg border text-sm transition ${
                        categoriasSelecionadas.includes(
                            categoria.id_categorias
                        )
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                >
                    {#if categoriasSelecionadas.includes(
                        categoria.id_categorias
                    )}
                        ✓
                    {/if}

                    {categoria.nome}
                </button>

            {/each}

        </div>
    </div>

    <!-- BOTÕES -->
    <div class="flex gap-2">

        <Button
            color="blue"
            onclick={filtrarLivros}
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

    <!-- CATEGORIAS SELECIONADAS -->
    {#if categoriasSelecionadas.length > 0}

        <div class="mt-4">

            <span class="text-sm text-black-900">
                Categorias selecionadas:
            </span>

            <div class="flex flex-wrap gap-2 mt-2">

                {#each categoriasSelecionadas as idCategoria}

                    {@const categoriaSelecionada =
                        categorias.find(
                            categoria =>
                                categoria.id_categorias ===
                                idCategoria
                        )}

                    {#if categoriaSelecionada}

                        <span
                            class="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full"
                        >
                            {categoriaSelecionada.nome}
                        </span>

                    {/if}

                {/each}

            </div>

        </div>

    {/if}

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

    {:else if livros.length === 0}

        <div class="text-center p-8 text-black-900">
            Nenhum livro encontrado.
        </div>

    {:else}

       <div class="w-full overflow-x-auto max-w-5x5 mx-auto my-10 shadow-lg border border-gray-200 rounded-lg bg-white ">
    <Table class="min-w-[1100px] w-full border ">

<thead>
    <tr>
        <th class="whitespace-nowrap">Capa</th>
        <th class="whitespace-nowrap">Título</th>
        <th class="whitespace-nowrap">Ano</th>
        <th class="whitespace-nowrap">Categoria</th>
        <th class="whitespace-nowrap">Autor</th>
        <th class="whitespace-nowrap">Editora</th>
        <th class="whitespace-nowrap">ISBN</th>
        <th class="whitespace-nowrap">Ações</th>
    </tr>
</thead>
            <tbody>

                {#each livros as livro}

                    <tr>

                        <!-- Capa -->
                        <td>
                            {#if livro.foto}

                                <img
                                    src={`/uploads/${livro.foto}`}
                                    alt={livro.titulo}
                                    class="w-12 h-20 object-cover rounded"
                                />

                            {:else}

                                <div
                                    class="w-12 h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600"
                                >
                                    Sem foto
                                </div>

                            {/if}
                        </td>

                        <!-- Título -->
                        <td>
                            {livro.titulo}
                        </td>

                        <!-- Ano -->
                        <td>
                            {livro.ano_de_publicacao}
                        </td>

                        <!-- Categorias -->
<td>
    {#if livro.categorias && livro.categorias.length > 0}
        <div class="flex flex-wrap gap-1 min-w-[160px]">
            {#each livro.categorias as categoria}
                <span
                    class="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-full whitespace-nowrap"
                >
                    {categoria.nome}
                </span>
            {/each}
        </div>
    {:else}
        <span class="text-gray-500">
            Sem categoria
        </span>
    {/if}
</td>

                        <!-- Autor -->
                        <td>
                            {livro.autor}
                        </td>

                        <!-- Editora -->
                        <td>
                            {livro.editora}
                        </td>

                        <!-- ISBN -->
                        <td>
                            {livro.isbn}
                        </td>

                        <!-- Ações -->
                        <td>

                            <div class="flex gap-2">

                                <!-- EDITAR -->
                                <Button
                                    size="sm"
                                    color="light"
                                    onclick={() =>
                                        goto(`/livros/edit/${livro.id}`)
                                    }
                                >
                                    Editar
                                </Button>

                                <!-- EXCLUIR -->
                                <Button
                                    size="sm"
                                    color="red"
                                    onclick={() =>
                                        abrirDelete(livro)
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

<!-- MODAL DE EXCLUSÃO -->

<Modal
    bind:open={abrirModalDelete}
    size="sm"
>
    <div class="p-6">

        <h3 class="text-lg font-semibold mb-4">
            Deseja deletar
            "{livroParaDeletar?.titulo}"?
        </h3>

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