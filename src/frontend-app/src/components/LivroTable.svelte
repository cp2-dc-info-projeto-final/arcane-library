
<script lang="ts">
    import { onMount } from 'svelte';
    import { Button, Spinner, Modal } from 'flowbite-svelte';
    import { TrashBinOutline, UserEditOutline } from 'flowbite-svelte-icons';
    import { goto } from '$app/navigation';
    import api from '$lib/api';
    import type { ApiResponse } from '$lib/api';
    import type { Livro } from '$lib/models/Livros';

    interface Categoria {
        id_categorias: number;
        nome: string;
    }

    let livros: Livro[] = [];
    let categorias: Categoria[] = [];

    let loading = true;
    let deleting = false;
    let error = '';
    let consulta = '';

    let abrirModalDelete = false;
    let livroParaDeletar: Livro | null = null;

    let categoriasSelecionadas: number[] = [];

    onMount(async () => {
        await carregarCategorias();
        await filtrarLivros();
    });

    async function carregarCategorias() {
        try {
            const res = await api.get('/categorias');
            const body = res.data as ApiResponse<Categoria[]>;

            categorias = body?.success ? body.data ?? [] : [];
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
                params.set('consulta', consulta.trim());
            }

            if (categoriasSelecionadas.length > 0) {
                params.set('categorias', categoriasSelecionadas.join(','));
            }

            const query = params.toString();
            const res = await api.get(
                query ? `/livros?${query}` : '/livros'
            );

            const body = res.data as ApiResponse<Livro[]>;

            if (body?.success) {
                livros = body.data ?? [];
            } else {
                error = body?.message || 'Não foi possível carregar os livros.';
                livros = [];
            }
        } catch (e: any) {
            console.error('Erro ao carregar livros:', e);

            const body = e.response?.data as ApiResponse<Livro[]> | undefined;
            error = body?.message || 'Erro ao carregar os livros.';
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
        if (deleting) return;

        abrirModalDelete = false;
        livroParaDeletar = null;
    }

    async function confirmarDelete() {
        if (!livroParaDeletar || deleting) return;

        const id = livroParaDeletar.id;

        if (!id) {
            error = 'Não foi possível identificar o livro.';
            return;
        }

        deleting = true;
        error = '';

        try {
            const res = await api.delete(`/livros/${id}`);
            const body = res.data as ApiResponse<null>;

            if (body && body.success === false) {
                error = body.message || 'Não foi possível excluir o livro.';
                return;
            }

            abrirModalDelete = false;
            livroParaDeletar = null;

            await filtrarLivros();
        } catch (e: any) {
            console.error('Erro ao deletar livro:', e);

            error =
                e.response?.data?.message ||
                'Erro ao excluir o livro. Tente novamente.';
        } finally {
            deleting = false;
        }
    }
</script>

<svelte:head>
    <title>Livros | Arcane Library</title>
    <meta
        name="description"
        content="Explore, pesquise e gerencie os livros da Arcane Library."
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
                        d="M12 7v14m0-14C10.5 5.5 8.5 5 5 5v14c3.5 0 5.5.5 7 2m0-14c1.5-1.5 3.5-2 7-2v14c-3.5 0-5.5.5-7 2"
                    />
                </svg>
            </div>

            <div class="min-w-0">
                <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                    Acervo de livros
                </h1>
                <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Descubra histórias, explore categorias e gerencie seu acervo.
                </p>
            </div>
        </div>

        <div class="flex flex-wrap gap-2">
            <span
                class="inline-flex items-center gap-2 rounded-full
                       bg-violet-100 px-3 py-1.5 text-xs font-semibold
                       text-violet-800 dark:bg-violet-950 dark:text-violet-300"
            >
                <span class="h-2 w-2 rounded-full bg-violet-500"></span>
                {livros.length} {livros.length === 1 ? 'livro encontrado' : 'livros encontrados'}
            </span>

            {#if categoriasSelecionadas.length > 0}
                <span
                    class="rounded-full bg-gray-100 px-3 py-1.5 text-xs
                           font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                    {categoriasSelecionadas.length}
                    {categoriasSelecionadas.length === 1 ? 'categoria selecionada' : 'categorias selecionadas'}
                </span>
            {/if}
        </div>
    </header>

    <!-- PAINEL DE FILTROS -->
    <form
        class="space-y-5 rounded-2xl border border-gray-200 bg-white
               p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5"
        onsubmit={(event) => {
            event.preventDefault();
            filtrarLivros();
        }}
    >
        <div>
            <label
                for="pesquisa"
                class="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
            >
                Buscar no acervo
            </label>

            <div class="relative">
                <svg
                    class="pointer-events-none absolute left-3 top-1/2
                           h-5 w-5 -translate-y-1/2 text-gray-400"
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
                    placeholder="Digite o título do livro..."
                    class="w-full rounded-xl border border-gray-300 bg-gray-50
                           py-3 pl-10 pr-4 text-sm text-gray-900 outline-none
                           transition placeholder:text-gray-400
                           focus:border-violet-500 focus:ring-2 focus:ring-violet-200
                           dark:border-gray-600 dark:bg-gray-900 dark:text-white
                           dark:placeholder:text-gray-500 dark:focus:ring-violet-900"
                />
            </div>
        </div>

        <div>
            <div class="mb-3 flex items-center justify-between gap-3">
                <label class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    Filtrar por categoria
                </label>

                {#if categoriasSelecionadas.length > 0}
                    <button
                        type="button"
                        onclick={() => categoriasSelecionadas = []}
                        class="text-xs font-semibold text-violet-700
                               hover:underline dark:text-violet-300"
                    >
                        Limpar categorias
                    </button>
                {/if}
            </div>

            {#if categorias.length > 0}
                <div class="flex flex-wrap gap-2">
                    {#each categorias as categoria (categoria.id_categorias)}
                        <button
                            type="button"
                            aria-pressed={categoriasSelecionadas.includes(categoria.id_categorias)}
                            onclick={() => toggleCategoria(categoria.id_categorias)}
                            class={`inline-flex items-center gap-2 rounded-xl border
                                    px-3 py-2 text-sm font-medium transition
                                    focus:outline-none focus:ring-2 focus:ring-violet-300
                                    ${
                                        categoriasSelecionadas.includes(categoria.id_categorias)
                                            ? 'border-violet-700 bg-violet-700 text-white shadow-sm'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-violet-300 hover:bg-violet-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                                    }`}
                        >
                            {#if categoriasSelecionadas.includes(categoria.id_categorias)}
                                <svg
                                    class="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m5 12 4 4L19 6" />
                                </svg>
                            {/if}
                            {categoria.nome}
                        </button>
                    {/each}
                </div>
            {:else}
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma categoria disponível para filtrar.
                </p>
            {/if}
        </div>

        <div class="flex flex-col gap-2 border-t border-gray-100 pt-4
                    dark:border-gray-700 sm:flex-row">
            <Button
                type="submit"
                color="purple"
                disabled={loading}
                class="sm:flex-none"
            >
                Buscar livros
            </Button>

            <Button
                type="button"
                color="light"
                disabled={loading}
                onclick={limparFiltros}
                class="sm:flex-none"
            >
                Limpar filtros
            </Button>
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

            <span class="flex-1">{error}</span>

            <button
                type="button"
                onclick={filtrarLivros}
                class="shrink-0 font-semibold underline underline-offset-2"
            >
                Tentar novamente
            </button>
        </div>
    {/if}

    <!-- LISTAGEM -->
    {#if loading}
        <div
            class="flex flex-col items-center justify-center gap-3
                   rounded-2xl border border-gray-200 bg-white py-16
                   dark:border-gray-700 dark:bg-gray-800"
            aria-live="polite"
        >
            <Spinner color="purple" size="8" />
            <p class="text-sm text-gray-500 dark:text-gray-400">
                Carregando acervo...
            </p>
        </div>

    {:else if !error && livros.length === 0}
        <div
            class="flex flex-col items-center justify-center rounded-2xl
                   border border-dashed border-gray-300 bg-white px-6 py-16
                   text-center dark:border-gray-700 dark:bg-gray-800"
        >
            <div
                class="mb-4 flex h-16 w-16 items-center justify-center
                       rounded-2xl bg-violet-100 text-violet-700
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
                Nenhum livro encontrado
            </h2>

            <p class="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                Tente pesquisar por outro título ou remover os filtros selecionados.
            </p>

            {#if consulta.trim() || categoriasSelecionadas.length > 0}
                <button
                    type="button"
                    onclick={limparFiltros}
                    class="mt-5 rounded-xl bg-violet-700 px-4 py-2.5
                           text-sm font-semibold text-white transition
                           hover:bg-violet-800"
                >
                    Ver todos os livros
                </button>
            {/if}
        </div>

    {:else if !error}
        <section aria-label="Livros do acervo">
            <div class="mb-4 flex items-center justify-between gap-3">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                    Livros do acervo
                </h2>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                    {livros.length} resultado(s)
                </span>
            </div>

            <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {#each livros as livro (livro.id)}
                    <article
                        class="group flex min-w-0 flex-col overflow-hidden rounded-2xl
                               border border-gray-200 bg-white shadow-sm transition
                               duration-200 hover:-translate-y-0.5 hover:border-violet-300
                               hover:shadow-md dark:border-gray-700 dark:bg-gray-800
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
                                       rounded-xl bg-violet-200 text-violet-800
                                       dark:bg-violet-900 dark:text-violet-200"
                                aria-hidden="true"
                            >
                                <svg
                                    class="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.7"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
                                    />
                                </svg>
                            </div>

                            <div class="min-w-0 flex-1">
                                <h3
                                    class="break-words text-base font-bold leading-snug
                                           text-gray-900 dark:text-white"
                                >
                                    {livro.titulo}
                                </h3>

                                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    Registro #{livro.id}
                                    {#if livro.ano_de_publicacao}
                                        <span class="mx-1">·</span>
                                        {livro.ano_de_publicacao}
                                    {/if}
                                </p>
                            </div>

                            <div class="flex shrink-0 items-center gap-1.5">
                                <button
                                    type="button"
                                    aria-label={`Editar ${livro.titulo}`}
                                    title="Editar livro"
                                    onclick={() => goto(`/livros/edit/${livro.id}`)}
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
                                    aria-label={`Remover ${livro.titulo}`}
                                    title="Remover livro"
                                    onclick={() => abrirDelete(livro)}
                                    disabled={deleting}
                                    class="inline-flex h-9 w-9 items-center justify-center
                                           rounded-lg border border-red-200 bg-white
                                           text-red-600 transition hover:bg-red-50
                                           focus:outline-none focus:ring-2 focus:ring-red-200
                                           disabled:cursor-not-allowed disabled:opacity-50
                                           dark:border-red-900 dark:bg-gray-800
                                           dark:text-red-400 dark:hover:bg-red-950"
                                >
                                    <TrashBinOutline class="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <!-- INFORMAÇÕES -->
                        <div class="flex flex-1 flex-col gap-4 p-4">
                            <!-- Categorias -->
                            <div>
                                <p
                                    class="mb-2 text-xs font-semibold uppercase
                                           tracking-wider text-gray-400 dark:text-gray-500"
                                >
                                    Categorias
                                </p>

                                {#if livro.categorias && livro.categorias.length > 0}
                                    <div class="flex flex-wrap gap-1.5">
                                        {#each livro.categorias as categoria}
                                            <span
                                                class="max-w-full break-words rounded-lg
                                                       border border-violet-100 bg-violet-50
                                                       px-2.5 py-1 text-xs font-medium
                                                       text-violet-800
                                                       dark:border-violet-900 dark:bg-violet-950/60
                                                       dark:text-violet-300"
                                            >
                                                {categoria.nome}
                                            </span>
                                        {/each}
                                    </div>
                                {:else}
                                    <span
                                        class="text-sm text-gray-500 dark:text-gray-400"
                                    >
                                        Sem categoria
                                    </span>
                                {/if}
                            </div>

                            <div class="h-px bg-gray-100 dark:bg-gray-700"></div>

                            <!-- Autor -->
                            <div class="flex min-w-0 items-start gap-3">
                                <div
                                    class="mt-0.5 flex h-8 w-8 shrink-0 items-center
                                           justify-center rounded-lg bg-gray-100
                                           text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                >
                                    <svg
                                        class="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="1.8"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"
                                        />
                                    </svg>
                                </div>

                                <div class="min-w-0 flex-1">
                                    <p class="text-xs text-gray-400 dark:text-gray-500">
                                        Autor
                                    </p>
                                    <p class="break-words text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {livro.autor || 'Não informado'}
                                    </p>
                                </div>
                            </div>

                            <!-- Editora -->
                            <div class="flex min-w-0 items-start gap-3">
                                <div
                                    class="mt-0.5 flex h-8 w-8 shrink-0 items-center
                                           justify-center rounded-lg bg-gray-100
                                           text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                >
                                    <svg
                                        class="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="1.8"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
                                        />
                                    </svg>
                                </div>

                                <div class="min-w-0 flex-1">
                                    <p class="text-xs text-gray-400 dark:text-gray-500">
                                        Editora
                                    </p>
                                    <p class="break-words text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {livro.editora || 'Não informada'}
                                    </p>
                                </div>
                            </div>

                            <!-- ISBN -->
                            <div class="flex min-w-0 items-start gap-3">
                                <div
                                    class="mt-0.5 flex h-8 w-8 shrink-0 items-center
                                           justify-center rounded-lg bg-gray-100
                                           text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                >
                                    <svg
                                        class="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-width="1.8"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                                        />
                                    </svg>
                                </div>

                                <div class="min-w-0 flex-1">
                                    <p class="text-xs text-gray-400 dark:text-gray-500">
                                        ISBN
                                    </p>
                                    <p class="break-all text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {livro.isbn || 'Não informado'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </article>
                {/each}
            </div>
        </section>
    {/if}
</div>

<!-- MODAL DE EXCLUSÃO -->
<Modal bind:open={abrirModalDelete} size="sm">
    <div class="p-6">
        <div
            class="mb-4 flex h-12 w-12 items-center justify-center
                   rounded-xl bg-red-100 text-red-600
                   dark:bg-red-950 dark:text-red-400"
        >
            <TrashBinOutline class="h-6 w-6" />
        </div>

        <h3 class="text-lg font-bold text-gray-900 dark:text-white">
            Excluir livro?
        </h3>

        <p class="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            Você está prestes a excluir
            <strong class="text-gray-900 dark:text-white">
                {livroParaDeletar?.titulo}
            </strong>.
            Essa ação pode não ser reversível.
        </p>

        {#if error}
            <p class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
            </p>
        {/if}

        <div class="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
            <Button
                color="light"
                onclick={cancelarDelete}
                disabled={deleting}
            >
                Cancelar
            </Button>

            <Button
                color="red"
                onclick={confirmarDelete}
                disabled={deleting}
            >
                {#if deleting}
                    <span class="flex items-center gap-2">
                        <span
                            class="h-4 w-4 animate-spin rounded-full
                                   border-2 border-white/40 border-t-white"
                        ></span>
                        Excluindo...
                    </span>
                {:else}
                    Confirmar exclusão
                {/if}
            </Button>
        </div>
    </div>
</Modal>