
<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { Spinner, Button } from 'flowbite-svelte';
    import api from '$lib/api';
    import type { ApiResponse } from '$lib/models/ApiResponse';
    import type { Autores } from '$lib/models/Autores';
    import type { Livro } from '$lib/models/Livros';

    type AutorDetalhado = Autores & {
        obras: Livro[];
    };

    let idAutor = $derived(page.url.searchParams.get('id'));

    let autor: AutorDetalhado | null = $state(null);
    let loading = $state(true);
    let error = $state('');

    async function carregarAutor(id: string) {
        loading = true;
        error = '';

        try {
            const response = await api.get(`/autores/${id}`);
            const body = response.data as ApiResponse<AutorDetalhado>;

            if (!body.success || !body.data) {
                throw new Error(body.message || 'Autor não encontrado.');
            }

            autor = body.data;
        } catch (err: any) {
            console.error(err);
            error = err.response?.data?.message ||
                err.message ||
                'Não foi possível carregar as informações do autor.';
            autor = null;
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        const id = idAutor;

        if (id) {
            carregarAutor(id);
        } else {
            autor = null;
            error = 'Nenhum autor foi selecionado.';
            loading = false;
        }
    });

    function abrirLivro(id: number) {
        goto(`/pagina_livros?id=${id}`);
    }
</script>

<svelte:head>
    <title>{autor?.nome ?? 'Detalhes do autor'} | Arcane Library</title>
</svelte:head>

<main class="pagina">
    {#if loading}
        <div class="estado">
            <Spinner size="xl" color="purple" />
            <p>Carregando informações do autor...</p>
        </div>

    {:else if error}
        <div class="estado">
            <h2>{error}</h2>
            <Button color="purple" onclick={() => goto('/autores')}>
                Voltar aos autores
            </Button>
        </div>

    {:else if autor}
        <div class="conteudo">
            <aside class="coluna-foto">
                <div class="foto">
                    {#if autor.foto}
                        <img
                            src={`http://localhost:3000/uploads/${autor.foto}`}
                            alt={`Foto de ${autor.nome}`}
                        />
                    {:else}
                        <div class="sem-foto">
                            <span>{autor.nome.charAt(0).toUpperCase()}</span>
                        </div>
                    {/if}
                </div>

                <Button
                    color="dark"
                    outline
                    class="voltar"
                    onclick={() => goto('/autores')}
                >
                    ← Voltar aos autores
                </Button>
            </aside>

            <section class="informacoes">
                <h1>{autor.nome}</h1>

                {#if autor.pseunonimo}
                    <p class="pseudonimo">
                        Pseudônimo: {autor.pseunonimo}
                    </p>
                {/if}

                <div class="separador"></div>

                <h3>SOBRE O AUTOR</h3>

                <p class="sinopse">
                    {autor.sinopse?.trim() || 'Biografia não cadastrada para este autor.'}
                </p>
            </section>
        </div>

        <section class="obras">
            <div class="titulo-obras">
                <h2>OBRAS DO AUTOR</h2>
                <span>{autor.obras?.length ?? 0} livro(s)</span>
            </div>

            {#if autor.obras?.length}
                <div class="lista-obras">
                    {#each autor.obras as obra}
                        <button
                            class="obra"
                            onclick={() => abrirLivro(obra.id)}
                            type="button"
                        >
                            <div class="capa">
                                {#if obra.foto}
                                    <img
                                        src={`http://localhost:3000/uploads/${obra.foto}`}
                                        alt={`Capa de ${obra.titulo}`}
                                    />
                                {:else}
                                    <div class="sem-capa">
                                        Sem capa
                                    </div>
                                {/if}
                            </div>

                            <h3>{obra.titulo}</h3>

                            <p>
                                {obra.ano_de_publicacao || 'Ano não informado'}
                            </p>
                        </button>
                    {/each}
                </div>
            {:else}
                <p class="sem-obras">
                    Nenhuma obra cadastrada para este autor.
                </p>
            {/if}
        </section>
    {/if}
</main>

<style>
    /* TEMA CLARO - PADRÃO */

    .pagina {
        --fundo: #ffffff;
        --texto: #1f2937;
        --texto-secundario: #4b5563;
        --titulo: #111827;
        --destaque: #7c3aed;
        --linha: #e5e7eb;
        --fundo-foto: #f3f4f6;
        --borda: #d1d5db;
        --fundo-capa: #f3f4f6;

        min-height: 100vh;
        padding: 65px 30px;
        background: var(--fundo);
        color: var(--texto);
        box-sizing: border-box;
        transition: background 0.2s, color 0.2s;
    }

    /* TEMA ESCURO - ATIVADO PELO BOTÃO DO SITE */

    :global(.dark) .pagina {
        --fundo: #11151a;
        --texto: #e5e7eb;
        --texto-secundario: #929bad;
        --titulo: #f5f3ff;
        --destaque: #a78bfa;
        --linha: #39414c;
        --fundo-foto: #252b34;
        --borda: #454e5b;
        --fundo-capa: #252b34;

        background:
            radial-gradient(ellipse at 50% 0%, #292039 0%, transparent 55%),
            var(--fundo);
        color: var(--texto);
    }

    .conteudo {
        width: 100%;
        max-width: 1100px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 220px minmax(0, 1fr);
        gap: 45px;
        align-items: start;
    }

    .coluna-foto {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .foto {
        width: 100%;
        aspect-ratio: 3 / 4;
        overflow: hidden;
        border-radius: 9px;
        background: var(--fundo-foto);
        border: 1px solid var(--borda);
        box-shadow: 0 12px 30px #0002;
    }

    .foto img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .sem-foto {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--destaque);
        font-size: 75px;
        font-weight: bold;
    }

    .voltar {
        width: 100%;
    }

    .informacoes h1 {
        margin: 0 0 12px;
        font-size: 34px;
        font-weight: 700;
        color: var(--titulo);
    }

    .pseudonimo {
        color: var(--destaque);
        font-size: 15px;
    }

    .separador {
        height: 1px;
        background: var(--linha);
        margin: 25px 0;
    }

    .informacoes h3,
    .titulo-obras h2 {
        font-size: 13px;
        letter-spacing: 1.5px;
        color: var(--destaque);
        margin-bottom: 18px;
    }

    .sinopse {
        font-size: 16px;
        line-height: 1.9;
        color: var(--texto-secundario);
        white-space: pre-line;
    }

    .obras {
        max-width: 1100px;
        margin: 65px auto 0;
    }

    .titulo-obras {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    .titulo-obras h2 {
        margin: 0;
    }

    .titulo-obras span {
        color: var(--texto-secundario);
        font-size: 13px;
    }

    .lista-obras {
        display: flex;
        gap: 22px;
        overflow-x: auto;
        padding: 5px 5px 20px;
        scroll-behavior: smooth;
    }

    .obra {
        flex: 0 0 155px;
        width: 155px;
        padding: 0;
        text-align: left;
        border: none;
        background: transparent;
        color: var(--texto);
        cursor: pointer;
    }

    .capa {
        width: 155px;
        aspect-ratio: 2 / 3;
        overflow: hidden;
        border-radius: 7px;
        background: var(--fundo-capa);
        border: 1px solid var(--borda);
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .obra:hover .capa {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px #0002;
    }

    .capa img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .sem-capa {
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--destaque);
        font-size: 13px;
    }

    .obra h3 {
        margin: 12px 0 5px;
        font-size: 14px;
        font-weight: 600;
        line-height: 1.4;
        color: var(--titulo);
    }

    .obra p {
        margin: 0;
        color: var(--texto-secundario);
        font-size: 12px;
    }

    .sem-obras {
        color: var(--texto-secundario);
    }

    .estado {
        min-height: 65vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        text-align: center;
    }

    @media (max-width: 650px) {
        .pagina {
            padding: 30px 18px;
        }

        .conteudo {
            display: flex;
            flex-direction: column;
            gap: 30px;
        }

        .coluna-foto {
            width: 190px;
            align-self: center;
        }

        .informacoes h1 {
            font-size: 27px;
        }

        .obras {
            margin-top: 45px;
        }
    }
</style>
