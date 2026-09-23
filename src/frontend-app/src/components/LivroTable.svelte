<script lang="ts">
    import { onMount } from 'svelte';
    import { Button, Spinner, Modal } from 'flowbite-svelte';
    import { TrashBinOutline, UserEditOutline } from 'flowbite-svelte-icons';
    import { type User } from "$lib/auth";
    import { goto } from '$app/navigation';
    import api from '$lib/api';
    import type { ApiResponse } from '$lib/api';
    import type { Livro } from '$lib/models/Livros';

    let user: User | null = null;
    let hasToken = false;
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

    async function filtrarLivros() {
        loading = true;
        error = '';

        try {
            const params = new URLSearchParams();

            if (consulta.trim()) {
                params.append('consulta', consulta.trim());
            }

            if (categoriasSelecionadas.length > 0) {
                params.append('categorias', categoriasSelecionadas.join(','));
            }

            const res = await api.get(`/livros?${params.toString()}`);
            const body = res.data as ApiResponse<Livro[]>;

            if (body?.success) {
                livros = body.data ?? [];
            } else {
                error = body?.message || 'Erro ao carregar livros.';
                livros = [];
            }
        } catch (e: any) {
            console.error('Erro ao carregar livros:', e);
            const body = e.response?.data as ApiResponse<Livro[]> | undefined;
            error = body?.message || 'Erro ao carregar livros.';
            livros = [];
        } finally {
            loading = false;
        }
    }

    function toggleCategoria(idCategoria: number) {
        if (categoriasSelecionadas.includes(idCategoria)) {
            categoriasSelecionadas = categoriasSelecionadas.filter(
                id => id !== idCategoria
            );
        } else {
            categoriasSelecionadas = [...categoriasSelecionadas, idCategoria];
        }
    }

    async function limparFiltros() {
        consulta = '';
        categoriasSelecionadas = [];
        await filtrarLivros();
    }

    function abrirDelete(livro: Livro) {
        livroParaDeletar = livro;
        abrirModalDelete = true;
    }

    function cancelarDelete() {
        abrirModalDelete = false;
        livroParaDeletar = null;
    }

    async function confirmarDelete() {
        if (!livroParaDeletar) return;

        const id = livroParaDeletar.id;
        if (!id) {
            error = 'Não foi possível identificar o livro.';
            return;
        }

        loading = true;
        error = '';

        try {
            await api.delete(`/livros/${id}`);
            abrirModalDelete = false;
            livroParaDeletar = null;
            await filtrarLivros();
        } catch (e: any) {
            error = e.response?.data?.message || 'Erro ao deletar livro.';
        } finally {
            loading = false;
        }
    }
</script>

<!-- FILTROS -->
<div class="w-full max-w-6xl mx-auto px-4 mb-6">
    <div class="mb-4">
        <label for="pesquisa" class="block mb-2 text-sm font-medium text-black-900">
            Buscar livros
        </label>
        <input
            type="text"
            id="pesquisa"
            bind:value={consulta}
            placeholder="Digite o título do livro..."
            class="w-full p-2 text-sm border border-gray-300 rounded-lg"
        />
    </div>

    <div class="mb-10">
        <span class="block mb-2 text-sm font-medium text-black-900">Categorias</span>
        <div class="flex flex-wrap gap-2">
            {#each categorias as categoria}
                <button
                    type="button"
                    onclick={() => toggleCategoria(categoria.id_categorias)}
                    class={`px-3 py-1.5 rounded-lg border text-sm transition ${
                        categoriasSelecionadas.includes(categoria.id_categorias)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                >
                    {#if categoriasSelecionadas.includes(categoria.id_categorias)}✓{/if}
                    {categoria.nome}
                </button>
            {/each}
        </div>
    </div>

    <div class="flex gap-2">
        <Button size="sm" color="blue" onclick={filtrarLivros} disabled={loading}>Buscar</Button>
        <Button size="sm" color="light" onclick={limparFiltros} disabled={loading}>Limpar filtros</Button>
    </div>

    {#if categoriasSelecionadas.length > 0}
        <div class="mt-4">
            <span class="text-sm text-black-900">Categorias selecionadas:</span>
            <div class="flex flex-wrap gap-2 mt-2">
                {#each categoriasSelecionadas as idCategoria}
                    {@const categoriaSelecionada = categorias.find(
                        c => c.id_categorias === idCategoria
                    )}
                    {#if categoriaSelecionada}
                        <span class="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                            {categoriaSelecionada.nome}
                        </span>
                    {/if}
                {/each}
            </div>
        </div>
    {/if}
</div>

<!-- LISTA VERTICAL DE CARDS (centralizada) -->
<div class="w-full max-w-6xl mx-auto px-4">
    {#if error}
        <div class="mb-4 p-4 text-sm text-red-500 bg-red-100 rounded">{error}</div>
    {/if}

    {#if loading}
        <div class="flex justify-center p-8"><Spinner /></div>
    {:else if livros.length === 0}
        <div class="text-center p-8 text-black-900">Nenhum livro encontrado.</div>
    {:else}
        <!-- Contêiner centralizado -->
        <div class="w-full max-w-2xl mx-auto my-8">
            <!-- Lista vertical centralizada -->
            <div class="flex flex-col items-center gap-4">
                {#each livros as livro}
                    <!-- Card de livro -->
                    <div class="w-full max-w-md p-0 overflow-hidden shadow-lg border border-green-200 rounded-lg bg-white">
                        <!-- Cabeçalho -->
                        <div class="px-4 pt-4 pb-2 bg-green-100 text-left flex items-center justify-between">
                            <div class="min-w-0">
                                <div class="text-base font-semibold text-gray-800 truncate">
                                    {livro.titulo}
                                </div>
                                <div class="text-xs text-gray-400">
                                    ID: {livro.id}
                                </div>
                                <div class="text-xs text-gray-500">
                                    Ano: {livro.ano_de_publicacao}
                                </div>
                            </div>
                            <div class="flex gap-2 flex-shrink-0">
                                <!-- Editar -->
                                <button
                                    class="p-2 rounded border border-primary-200 hover:border-primary-400 transition bg-transparent"
                                    title="Editar"
                                    onclick={() => goto(`/livros/edit/${livro.id}`)}
                                >
                                    <UserEditOutline class="w-4 h-4 text-primary-500" />
                                </button>
                                <!-- Remover -->
                                <button
                                    title="Remover"
                                    class="p-2 rounded border border-red-100 hover:border-red-300 transition bg-transparent"
                                    onclick={() => abrirDelete(livro)}
                                    disabled={loading}
                                >
                                    <TrashBinOutline class="w-4 h-4 text-red-400" />
                                </button>
                            </div>
                        </div>

                        <!-- Corpo -->
                        <div class="px-4 pb-3 pt-2 flex flex-col gap-1.5 text-left">
                            <!-- Categorias -->
                            <div class="flex items-start gap-2">
                                <svg class="w-4 h-4 text-primary-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5a2 2 0 0 1 1.414.586l7 7a2 2 0 0 1 0 2.828l-7 7a2 2 0 0 1-2.828 0l-7-7A2 2 0 0 1 3 12V7a4 4 0 0 1 4-4z"/>
                                </svg>
                                {#if livro.categorias && livro.categorias.length > 0}
                                    <div class="flex flex-wrap gap-1">
                                        {#each livro.categorias as categoria}
                                            <span class="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                                                {categoria.nome}
                                            </span>
                                        {/each}
                                    </div>
                                {:else}
                                    <span class="text-gray-500 text-sm">Sem categoria</span>
                                {/if}
                            </div>

                            <!-- Autor -->
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"/>
                                </svg>
                                <span class="text-gray-700 text-sm truncate">{livro.autor}</span>
                            </div>

                            <!-- Editora -->
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                </svg>
                                <span class="text-gray-700 text-sm truncate">{livro.editora}</span>
                            </div>

                            <!-- ISBN -->
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
                                </svg>
                                <span class="text-gray-700 text-sm truncate">{livro.isbn}</span>
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
            Deseja deletar "{livroParaDeletar?.titulo}"?
        </h3>

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