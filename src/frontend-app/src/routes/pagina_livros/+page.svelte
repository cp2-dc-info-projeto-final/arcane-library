
<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import api from '$lib/api';
    import { getCurrentUser } from '$lib/auth';

    type Usuario = {
        id: number | string;
        login: string;
        foto?: string | null;
    };

    type Comentario = {
        id: number;
        livro_id: number;
        usuario_id: number;
        login: string;
        foto?: string | null;
        conteudo: string;
        criado_em: string;
        curtidas?: number;
        descurtidas?: number;
        likes?: number;
        dislikes?: number;
        minha_reacao?: string | null;
        comentario_pai_id?: number | null; 
        respostas?: Comentario[]; 
        // Biel acrescentou isso
        mencoes?: {
        login: string;
        usuario_id: number;
        }[];
    };

    let idLivro = $derived(page.url.searchParams.get('id'));

    let livro = $state<any>(null);
    let usuario = $state<Usuario | null>(null);

    let comentarios = $state<Comentario[]>([]);
    let carregando = $state(true);
    let carregandoComentarios = $state(false);
    let enviando = $state(false);

    let erro = $state('');
    let erroComentarios = $state('');

    let novoComentario = $state('');
    let respostaTexto = $state('');
    let respondendoId = $state<number | null>(null);
    
        
        
        function irParaUsuario(login: string, comentario: Comentario) {
    const mencionado = comentario.mencoes?.find(
        item =>
            item.login.normalize('NFC').toLowerCase() ===
            login.normalize('NFC').toLowerCase()
    );

    if (!mencionado) {
        console.warn('Menção não encontrada:', {
            login,
            mencoes: comentario.mencoes
        });

        return;
    }

    goto(`/perfil/${mencionado.usuario_id}`);
}

    function extrairDados(resposta: any) {
        return resposta?.data?.data
            ?? resposta?.data?.livro
            ?? resposta?.data?.comentarios
            ?? resposta?.data
            ?? resposta;
    }

    function fotoUsuario(foto?: string | null) {
        if (!foto) return '';

        if (foto.startsWith('http://') || foto.startsWith('https://')) {
            return foto;
        }

        return `http://localhost:3000/uploads/${foto}`;
    }

    function fotoLivro() {
        const foto = livro?.foto ?? livro?.capa;

        if (!foto) return '';

        if (foto.startsWith('http://') || foto.startsWith('https://')) {
            return foto;
        }

        return `http://localhost:3000/uploads/${foto}`;
    }

    function nomeAutor() {
        return livro?.autor
            ?? livro?.nome_autor
            ?? livro?.autor_nome
            ?? livro?.nome
            ?? 'Autor não informado';
    }

    function categoriasLivro() {
        const categorias = livro?.categorias;

        if (!Array.isArray(categorias)) return [];

        return categorias.map((categoria: any) => {
            if (typeof categoria === 'string') return categoria;

            return categoria.nome
                ?? categoria.categoria
                ?? categoria.nome_categoria
                ?? '';
        }).filter(Boolean);
    }

    function quantidadeCurtidas(comentario: Comentario) {
        return Number(comentario.curtidas ?? comentario.likes ?? 0);
    }

    function quantidadeDescurtidas(comentario: Comentario) {
        return Number(comentario.descurtidas ?? comentario.dislikes ?? 0);
    }

    function formatarData(data: string) {
        if (!data) return '';

        return new Date(data).toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        });
    }

    function partesDoComentario(texto: string) {
    return texto.split(/(@[\p{L}\p{N}_]+(?:[.-][\p{L}\p{N}_]+)*)/gu);
}

    async function carregarLivro() {
        if (!idLivro) {
            erro = 'Nenhum livro foi selecionado.';
            carregando = false;
            return;
        }

        try {
            carregando = true;
            erro = '';

            const resposta = await api.get(`/livros/${idLivro}`);
            livro = extrairDados(resposta);

            if (Array.isArray(livro)) {
                livro = livro[0] ?? null;
            }

            if (!livro) {
                erro = 'Livro não encontrado.';
            }
        } catch (error: any) {
            console.error('Erro ao carregar livro:', error);

            erro = error?.response?.data?.message
                ?? 'Não foi possível carregar as informações do livro.';
        } finally {
            carregando = false;
        }
    }

    async function carregarComentarios() {
        if (!idLivro) return;

        try {
            carregandoComentarios = true;
            erroComentarios = '';

            const resposta = await api.get(
                `/comentarios/livro/${idLivro}`
            );

            const dados = extrairDados(resposta);

            comentarios = Array.isArray(dados)
                ? dados
                : dados?.comentarios ?? [];
        } catch (error: any) {
            console.error('Erro ao carregar comentários:', error);

            erroComentarios = error?.response?.data?.message
                ?? 'Não foi possível carregar os comentários.';
        } finally {
            carregandoComentarios = false;
        }
    }

    async function enviarComentario() {
        if (!novoComentario.trim()) return;

        try {
            enviando = true;

            await api.post(`/comentarios/livro/${idLivro}`, {
                conteudo: novoComentario.trim(),
                comentario_pai_id: null
            });

            novoComentario = '';
            await carregarComentarios();
        } catch (error: any) {
            console.error('Erro ao enviar comentário:', error);

            alert(
                error?.response?.data?.message
                ?? 'Não foi possível publicar seu comentário.'
            );
        } finally {
            enviando = false;
        }
    }

    function iniciarResposta(comentarioId: number) {
        respondendoId = respondendoId === comentarioId
            ? null
            : comentarioId;

        respostaTexto = '';
    }

    async function enviarResposta(comentarioId: number) {
        if (!respostaTexto.trim()) return;

        try {
            enviando = true;

            await api.post(`/comentarios/livro/${idLivro}`, {
                conteudo: respostaTexto.trim(),
                comentario_pai_id: comentarioId
            });

            respostaTexto = '';
            respondendoId = null;

            await carregarComentarios();
        } catch (error: any) {
            console.error('Erro ao enviar resposta:', error);

            alert(
                error?.response?.data?.message
                ?? 'Não foi possível enviar sua resposta.'
            );
        } finally {
            enviando = false;
        }
    }

    async function reagir(comentarioId: number, tipo: 'like' | 'dislike') {
        try {
            await api.post(`/comentarios/${comentarioId}/reacao`, {
                tipo
            });

            await carregarComentarios();
        } catch (error: any) {
            console.error('Erro ao reagir:', error);

            alert(
                error?.response?.data?.message
                ?? 'Não foi possível registrar sua reação.'
            );
        }
    }

    async function excluirComentario(comentarioId: number) {
        const confirmar = confirm(
            'Tem certeza de que deseja excluir este comentário?'
        );

        if (!confirmar) return;

        try {
            await api.delete(`/comentarios/${comentarioId}`);
            await carregarComentarios();
        } catch (error: any) {
            console.error('Erro ao excluir comentário:', error);

            alert(
                error?.response?.data?.message
                ?? 'Não foi possível excluir o comentário.'
            );
        }
    }

    function comentarioDoUsuario(comentario: Comentario) {
        return usuario && String(usuario.id) === String(comentario.usuario_id);
    }

    function irParaAutor() {
        if (livro?.id_autor) {
            goto(`/pagina_autores?id=${livro.id_autor}`);
        }
    }

    onMount(async () => {
        try {
            usuario = await getCurrentUser();
        } catch (error) {
            console.error('Não foi possível identificar o usuário:', error);
        }

        await carregarLivro();
        await carregarComentarios();
    });
</script>

<svelte:head>
    <title>{livro?.titulo ?? 'Detalhes do livro'} | Arcane Library</title>
    <meta
        name="description"
        content={livro?.sinopse ?? 'Confira os detalhes deste livro.'}
    />
</svelte:head>

<main class="pagina">
    {#if carregando}
        <div class="estado">
            <div class="spinner"></div>
            <p>Carregando informações do livro...</p>
        </div>
    {:else if erro}
        <div class="estado">
            <h2>Não foi possível abrir o livro</h2>
            <p>{erro}</p>
            <button class="botao-voltar" onclick={() => goto('/livros')}>
                Voltar para os livros
            </button>
        </div>
    {:else if livro}
        <div class="container">
            <button class="voltar" onclick={() => goto('/livros')}>
                ← Voltar para os livros
            </button>

            <section class="conteudo">
                <div class="coluna-capa">
                    {#if fotoLivro()}
                        <img
                            class="capa"
                            src={fotoLivro()}
                            alt={`Capa de ${livro.titulo}`}
                        />
                    {:else}
                        <div class="capa-sem-imagem">
                            <span>📚</span>
                            <p>Sem capa disponível</p>
                        </div>
                    {/if}
                </div>

                <div class="coluna-informacoes">
                    <span class="subtitulo">DETALHES DA OBRA</span>

                    <h1>{livro.titulo}</h1>

                    <div class="linha"></div>

                    <h2>Sinopse</h2>

                    <p class="sinopse">
                        {livro.sinopse || 'Este livro ainda não possui uma sinopse cadastrada.'}
                    </p>

                    <div class="categorias">
                        <h3>Categorias</h3>

                        {#if categoriasLivro().length > 0}
                            <div class="lista-categorias">
                                {#each categoriasLivro() as categoria}
                                    <span class="categoria">{categoria}</span>
                                {/each}
                            </div>
                        {:else}
                            <p class="sem-categoria">
                                Nenhuma categoria cadastrada.
                            </p>
                        {/if}
                    </div>
                </div>

                <aside class="coluna-detalhes">
                    <h2>Informações do livro</h2>ApiResponse

                    <div class="detalhe">
                        <span>Autor</span>
                        <button class="autor" onclick={irParaAutor}>
                            {nomeAutor()}
                        </button>
                    </div>

                    <div class="detalhe">
                        <span>Editora</span>
                        <strong>{livro.editora || 'Não informada'}</strong>
                    </div>

                    <div class="detalhe">
                        <span>Ano de publicação</span>
                        <strong>{livro.ano_publicacao ?? livro.ano ?? 'Não informado'}</strong>
                    </div>

                    <div class="detalhe">
                        <span>ISBN</span>
                        <strong>{livro.isbn || 'Não informado'}</strong>
                    </div>

                    <div class="detalhe">
                        <span>ID do livro</span>
                        <strong>{livro.id}</strong>
                    </div>
                </aside>
            </section>

            <!-- ÁREA DE COMENTÁRIOS -->
            <section class="area-comentarios">
                <div class="cabecalho-comentarios">
                    <div>
                        <span class="subtitulo">COMUNIDADE</span>
                        <h2>Comentários</h2>
                        <p>Compartilhe sua opinião sobre esta obra.</p>
                    </div>

                    <span class="contador">
                        {comentarios.length}
                        {comentarios.length === 1 ? 'comentário' : 'comentários'}
                    </span>
                </div>

                <div class="formulario-comentario">
                    {#if usuario}
                        <div class="usuario-avatar">
                            {#if usuario.foto}
                                <img
                                    src={fotoUsuario(usuario.foto)}
                                    alt="Sua foto de perfil"
                                />
                            {:else}
                                <span>{usuario.login?.charAt(0).toUpperCase()}</span>
                            {/if}
                        </div>

                        <div class="campo-comentario">
                            <textarea
                                bind:value={novoComentario}
                                maxlength="2000"
                                placeholder="O que você achou deste livro? Você pode mencionar alguém usando @login."
                            ></textarea>

                            <div class="acoes-formulario">
                                <span>{novoComentario.length}/2000</span>

                                <button
                                    class="botao-publicar"
                                    onclick={enviarComentario}
                                    disabled={enviando || !novoComentario.trim()}
                                >
                                    {enviando ? 'Publicando...' : 'Publicar comentário'}
                                </button>
                            </div>
                        </div>
                    {:else}
                        <div class="aviso-login">
                            <p>Entre na sua conta para participar da conversa.</p>
                            <button onclick={() => goto('/login')}>
                                Fazer login
                            </button>
                        </div>
                    {/if}
                </div>

                <div class="lista-comentarios">
                    {#if carregandoComentarios}
                        <div class="carregando-comentarios">
                            <div class="spinner"></div>
                            <p>Carregando comentários...</p>
                        </div>
                    {:else if erroComentarios}
                        <p class="mensagem-vazia">{erroComentarios}</p>
                        <button
                            class="botao-recarregar"
                            onclick={carregarComentarios}
                        >
                            Tentar novamente
                        </button>
                    {:else if comentarios.length === 0}
                        <div class="mensagem-vazia">
                            <span>💬</span>
                            <h3>Nenhum comentário ainda</h3>
                            <p>Seja a primeira pessoa a comentar sobre este livro!</p>
                        </div>
                    {:else}
                        {#each comentarios as comentario (comentario.id)}
                            <article class="comentario">
                                <div class="avatar">
                                    {#if comentario.foto}
                                        <img
                                            src={fotoUsuario(comentario.foto)}
                                            alt={`Foto de ${comentario.login}`}
                                        />
                                    {:else}
                                        <span>
                                            {comentario.login?.charAt(0).toUpperCase() ?? '?'}
                                        </span>
                                    {/if}
                                </div>

                                <div class="comentario-conteudo">
                                    <div class="comentario-topo">
                                        <div class="identificacao">
                                            <strong>{comentario.login ?? 'Usuário'}</strong>
                                            <span>{formatarData(comentario.criado_em)}</span>
                                        </div>

                                        {#if comentarioDoUsuario(comentario)}
                                            <button
                                                class="botao-excluir"
                                                onclick={() => excluirComentario(comentario.id)}
                                                title="Excluir comentário"
                                            >
                                                Excluir
                                            </button>
                                        {/if}
                                    </div>

                                    <p class="texto-comentario">
                                        {#each partesDoComentario(comentario.conteudo) as parte}
                                        <!-- Biel mudou isso -->
                                            {#if parte.startsWith('@')}
                                            <button
                                                type="button"
                                            class="mencao"
                                            onclick={() => irParaUsuario(parte.slice(1), comentario)}>
                                            {parte}
                                        </button>
                                    {:else}
                                        {parte}
                                    {/if}
                                        {/each}
                                    </p>

                                    <div class="acoes-comentario">
                                        <button
                                            class:selecionado={comentario.minha_reacao === 'like'}
                                            onclick={() => reagir(comentario.id, 'like')}
                                            disabled={!usuario}
                                            title="Curtir"
                                        >
                                            <span>👍</span>
                                            {quantidadeCurtidas(comentario)}
                                        </button>

                                        <button
                                            class:selecionado={comentario.minha_reacao === 'dislike'}
                                            onclick={() => reagir(comentario.id, 'dislike')}
                                            disabled={!usuario}
                                            title="Não curtir"
                                        >
                                            <span>👎</span>
                                            {quantidadeDescurtidas(comentario)}
                                        </button>

                                        {#if usuario}
                                            <button
                                                class="responder"
                                                onclick={() => iniciarResposta(comentario.id)}
                                            >
                                                Responder
                                            </button>
                                        {/if}
                                    </div>

                                    {#if respondendoId === comentario.id}
                                        <div class="formulario-resposta">
                                            <textarea
                                                bind:value={respostaTexto}
                                                maxlength="2000"
                                                placeholder={`Responder a @${comentario.login ?? 'Usuário'}...`}
                                            ></textarea>

                                            <div class="acoes-resposta">
                                                <button
                                                    class="cancelar"
                                                    onclick={() => iniciarResposta(comentario.id)}
                                                >
                                                    Cancelar
                                                </button>

                                                <button
                                                    class="botao-publicar"
                                                    onclick={() => enviarResposta(comentario.id)}
                                                    disabled={enviando || !respostaTexto.trim()}
                                                >
                                                    Enviar resposta
                                                </button>
                                            </div>
                                        </div>
                                    {/if}

                                    {#if comentario.respostas?.length}
                                        <div class="respostas">
                                            {#each comentario.respostas as resposta (resposta.id)}
                                                <div class="resposta">
                                                    <div class="avatar avatar-menor">
                                                        {#if resposta.foto}
                                                            <img
                                                                src={fotoUsuario(resposta.foto)}
                                                                alt={`Foto de ${resposta.login}`}
                                                            />
                                                        {:else}
                                                            <span>
                                                                {resposta.login?.charAt(0).toUpperCase() ?? '?'}
                                                            </span>
                                                        {/if}
                                                    </div>

                                                    <div class="resposta-conteudo">
                                                        <div class="comentario-topo">
                                                            <div class="identificacao">
                                                                <strong>{resposta.login}</strong>
                                                                <span>{formatarData(resposta.criado_em)}</span>
                                                            </div>

                                                            {#if comentarioDoUsuario(resposta)}
                                                                <button
                                                                    class="botao-excluir"
                                                                    onclick={() => excluirComentario(resposta.id)}
                                                                >
                                                                    Excluir
                                                                </button>
                                                            {/if}
                                                        </div>

                                                        <p class="texto-comentario">
                                                            {#each partesDoComentario(resposta.conteudo) as parte}
                                                            <!-- mudei isso -->
                                                            {#if parte.startsWith('@')}
                                                            <button
                                                                type="button"
                                                                class="mencao"
                                                                onclick={() => irParaUsuario(parte.slice(1), resposta)}
                                                            >
                                                                {parte}
                                                            </button>
                                                        {:else}
                                                            {parte}
                                                        {/if}
                                                            {/each}
                                                        </p>

                                                        <div class="acoes-comentario">
                                                            <button
                                                                class:selecionado={resposta.minha_reacao === 'like'}
                                                                onclick={() => reagir(resposta.id, 'like')}
                                                                disabled={!usuario}
                                                            >
                                                                👍 {quantidadeCurtidas(resposta)}
                                                            </button>

                                                            <button
                                                                class:selecionado={resposta.minha_reacao === 'dislike'}
                                                                onclick={() => reagir(resposta.id, 'dislike')}
                                                                disabled={!usuario}
                                                            >
                                                                👎 {quantidadeDescurtidas(resposta)}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            </article>
                        {/each}
                    {/if}
                </div>
            </section>
        </div>
    {/if}
</main>

<style>
   
/* TEMA CLARO - PADRÃO */

:global(body) {
    margin: 0;
    background: #ffffff;
    color: #1f2937;
    transition: background 0.2s, color 0.2s;
}

.pagina {
    --fundo: #ffffff;
    --fundo-secundario: #f9fafb;
    --fundo-card: #f3f4f6;
    --fundo-input: #ffffff;
    --texto: #1f2937;
    --texto-principal: #111827;
    --texto-secundario: #6b7280;
    --texto-comentario: #374151;
    --destaque: #7c3aed;
    --destaque-claro: #a78bfa;
    --destaque-fundo: #f3e8ff;
    --linha: #e5e7eb;
    --borda: #d1d5db;
    --sombra: rgba(0, 0, 0, 0.10);
    --cor-erro: #dc7070;

    min-height: 100vh;
    padding: 35px 20px 70px;
    background: var(--fundo);
    color: var(--texto);
    box-sizing: border-box;
    transition: background 0.2s, color 0.2s;
}

/* TEMA ESCURO - ATIVADO PELO BOTÃO DO SITE */

:global(.dark) .pagina {
    --fundo: #11151a;
    --fundo-secundario: #1a2029;
    --fundo-card: #252b35;
    --fundo-input: #131820;
    --texto: #e5e7eb;
    --texto-principal: #ffffff;
    --texto-secundario: #9da4af;
    --texto-comentario: #d0d3d9;
    --destaque: #b78ae9;
    --destaque-claro: #d6b6ff;
    --destaque-fundo: rgba(126, 75, 180, 0.13);
    --linha: #343943;
    --borda: #343b47;
    --sombra: rgba(0, 0, 0, 0.45);
    --cor-erro: #d98282;

    background:
        radial-gradient(
            ellipse at top left,
            rgba(126, 75, 180, 0.12),
            transparent 42%
        ),
        var(--fundo);
    color: var(--texto);
}

/* CONTEÚDO PRINCIPAL */

.container {
    width: 100%;
    max-width: 1250px;
    margin: 0 auto;
}

.voltar {
    border: none;
    background: transparent;
    color: var(--destaque);
    font-size: 14px;
    cursor: pointer;
    margin-bottom: 30px;
    padding: 8px 0;
}

.voltar:hover {
    color: var(--destaque-claro);
}

.conteudo {
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr) 260px;
    gap: 35px;
    align-items: start;
}

.coluna-capa {
    display: flex;
    justify-content: center;
}

.capa {
    width: 100%;
    max-width: 240px;
    height: 350px;
    object-fit: cover;
    border-radius: 12px;
    box-shadow: 0 12px 35px var(--sombra);
}

.capa-sem-imagem {
    width: 100%;
    max-width: 240px;
    height: 350px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 12px;
    background: var(--fundo-card);
    color: var(--texto-secundario);
    border: 1px solid var(--borda);
}

.capa-sem-imagem span {
    font-size: 55px;
}

.subtitulo {
    color: var(--destaque);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 2px;
}

.coluna-informacoes h1 {
    margin: 12px 0 8px;
    font-size: clamp(28px, 4vw, 38px);
    line-height: 1.2;
    color: var(--texto-principal);
}

.linha {
    height: 1px;
    background: var(--linha);
    margin: 25px 0;
}

.coluna-informacoes h2 {
    font-size: 21px;
    margin-bottom: 12px;
    color: var(--texto-principal);
}

.sinopse {
    color: var(--texto-secundario);
    font-size: 15px;
    line-height: 1.9;
    white-space: pre-line;
}

.categorias {
    margin-top: 30px;
}

.categorias h3 {
    font-size: 16px;
    margin-bottom: 13px;
    color: var(--texto-principal);
}

.lista-categorias {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
}

.categoria {
    padding: 7px 13px;
    border: 1px solid var(--destaque);
    border-radius: 20px;
    color: var(--destaque);
    background: var(--destaque-fundo);
    font-size: 12px;
}

.sem-categoria {
    color: var(--texto-secundario);
    font-size: 13px;
}

/* INFORMAÇÕES DO LIVRO */

.coluna-detalhes {
    padding: 22px;
    border: 1px solid var(--borda);
    border-radius: 12px;
    background: var(--fundo-secundario);
    transition: background 0.2s, border 0.2s;
}

.coluna-detalhes h2 {
    margin: 0 0 22px;
    font-size: 17px;
    color: var(--texto-principal);
}

.detalhe {
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 13px 0;
    border-bottom: 1px solid var(--linha);
}

.detalhe:last-child {
    border-bottom: none;
}

.detalhe span {
    color: var(--texto-secundario);
    font-size: 12px;
}

.detalhe strong {
    color: var(--texto);
    font-size: 14px;
    overflow-wrap: anywhere;
}

.detalhe .autor {
    align-self: flex-start;
    border: none;
    background: transparent;
    color: var(--destaque);
    font-size: 14px;
    font-weight: 600;
    padding: 0;
    text-align: left;
    overflow-wrap: anywhere;
    cursor: pointer;
}

.detalhe .autor:hover {
    color: var(--destaque-claro);
    text-decoration: underline;
}

/* COMENTÁRIOS */

.area-comentarios {
    margin-top: 65px;
    padding-top: 35px;
    border-top: 1px solid var(--borda);
}

.cabecalho-comentarios {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    margin-bottom: 28px;
}

.cabecalho-comentarios h2 {
    margin: 8px 0 5px;
    font-size: 28px;
    color: var(--texto-principal);
}

.cabecalho-comentarios p {
    margin: 0;
    color: var(--texto-secundario);
    font-size: 14px;
}

.contador {
    padding: 8px 13px;
    border-radius: 20px;
    background: var(--fundo-card);
    color: var(--destaque);
    font-size: 12px;
    white-space: nowrap;
}

/* FORMULÁRIO */

.formulario-comentario {
    display: flex;
    gap: 15px;
    padding: 20px;
    border: 1px solid var(--borda);
    border-radius: 12px;
    background: var(--fundo-secundario);
}

.usuario-avatar,
.avatar {
    width: 36px;
    height: 36px;
    min-width: 36px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: #67428e;
    color: white;
    font-weight: 700;
}

.usuario-avatar img,
.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.avatar.avatar-menor {
    width: 33px;
    height: 33px;
    min-width: 33px;
    font-size: 12px;
}

.campo-comentario {
    flex: 1;
    min-width: 0;
}

textarea {
    width: 100%;
    min-height: 90px;
    padding: 13px;
    resize: vertical;
    border: 1px solid var(--borda);
    border-radius: 8px;
    outline: none;
    background: var(--fundo-input);
    color: var(--texto);
    font: inherit;
    font-size: 14px;
    box-sizing: border-box;
}

textarea:focus {
    border-color: var(--destaque);
    box-shadow: 0 0 0 2px rgba(155, 107, 207, 0.12);
}

textarea::placeholder {
    color: var(--texto-secundario);
}

.acoes-formulario,
.acoes-resposta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-top: 12px;
}

.acoes-formulario span {
    color: var(--texto-secundario);
    font-size: 12px;
}

.botao-publicar {
    padding: 10px 17px;
    border: none;
    border-radius: 7px;
    background: #8151b2;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
}

.botao-publicar:hover:not(:disabled) {
    background: #9869c8;
}

.botao-publicar:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.aviso-login {
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    gap: 15px;
    color: var(--texto);
}

.aviso-login button,
.botao-voltar {
    padding: 10px 15px;
    border: none;
    border-radius: 7px;
    background: #8151b2;
    color: white;
    cursor: pointer;
}

/* LISTA DE COMENTÁRIOS */

.lista-comentarios {
    margin-top: 25px;
}

.comentario {
    display: flex;
    gap: 14px;
    padding: 23px 0;
    border-bottom: 1px solid var(--linha);
}

.comentario-conteudo,
.resposta-conteudo {
    flex: 1;
    min-width: 0;
}

.comentario-topo {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
}

.identificacao {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
}

.identificacao strong {
    color: var(--texto-principal);
    font-size: 14px;
}

.identificacao span {
    color: var(--texto-secundario);
    font-size: 11px;
}

.texto-comentario {
    margin: 12px 0;
    color: var(--texto-comentario);
    font-size: 14px;
    line-height: 1.7;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
}

/* mudei a classe mencao */
.mencao {
    display: inline;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--destaque);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
}

.mencao:hover {
    text-decoration: underline;
}

.acoes-comentario {
    display: flex;
    align-items: center;
    gap: 16px;
}

.acoes-comentario button {
    padding: 5px 0;
    border: none;
    background: transparent;
    color: var(--texto-secundario);
    font-size: 12px;
    cursor: pointer;
}

.acoes-comentario button:hover:not(:disabled),
.acoes-comentario button.selecionado {
    color: var(--destaque);
}

.acoes-comentario button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.acoes-comentario .responder {
    color: var(--destaque);
    font-weight: 600;
}

.botao-excluir {
    padding: 5px 8px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: var(--cor-erro);
    font-size: 11px;
    cursor: pointer;
}

.botao-excluir:hover {
    background: rgba(217, 130, 130, 0.1);
}

/* RESPOSTAS */

.formulario-resposta {
    margin-top: 15px;
    padding: 14px;
    border-radius: 8px;
    background: var(--fundo-card);
}

.formulario-resposta textarea {
    min-height: 65px;
}

.acoes-resposta {
    justify-content: flex-end;
}

.cancelar {
    border: none;
    background: transparent;
    color: var(--texto-secundario);
    cursor: pointer;
}

.respostas {
    margin-top: 18px;
    margin-left: 5px;
    padding-left: 18px;
    border-left: 2px solid var(--destaque);
}

.resposta {
    display: flex;
    gap: 12px;
    padding: 12px 0;
}

/* ESTADOS E MENSAGENS */

.mensagem-vazia {
    padding: 35px 15px;
    text-align: center;
    color: var(--texto-secundario);
}

.mensagem-vazia span {
    font-size: 30px;
}

.mensagem-vazia h3 {
    margin: 12px 0 5px;
    color: var(--texto-principal);
}

.mensagem-vazia p {
    font-size: 13px;
}

.botao-recarregar {
    display: block;
    margin: 0 auto;
    padding: 9px 15px;
    border: 1px solid var(--destaque);
    border-radius: 7px;
    background: transparent;
    color: var(--destaque);
    cursor: pointer;
}

.estado,
.carregando-comentarios {
    min-height: 250px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 15px;
    color: var(--texto-secundario);
    text-align: center;
}

.spinner {
    width: 35px;
    height: 35px;
    border: 3px solid var(--linha);
    border-top-color: var(--destaque);
    border-radius: 50%;
    animation: girar 0.8s linear infinite;
}

@keyframes girar {
    to {
        transform: rotate(360deg);
    }
}

/* RESPONSIVIDADE */

@media (max-width: 950px) {
    .conteudo {
        grid-template-columns: 200px minmax(0, 1fr);
    }

    .capa,
    .capa-sem-imagem {
        height: 300px;
    }

    .coluna-detalhes {
        grid-column: 1 / -1;
    }
}

@media (max-width: 650px) {
    .pagina {
        padding: 20px 14px 45px;
    }

    .conteudo {
        grid-template-columns: 1fr;
        gap: 25px;
    }

    .coluna-capa {
        justify-content: center;
    }

    .capa,
    .capa-sem-imagem {
        max-width: 210px;
        height: 300px;
    }

    .coluna-informacoes h1 {
        font-size: 27px;
    }

    .cabecalho-comentarios {
        align-items: flex-start;
    }

    .formulario-comentario {
        padding: 13px;
        gap: 10px;
    }

    .usuario-avatar {
        width: 35px;
        height: 35px;
    }

    .comentario {
        gap: 10px;
    }

    .avatar {
        width: 35px;
        height: 35px;
    }

    .respostas {
        padding-left: 10px;
    }

    .acoes-formulario {
        align-items: flex-end;
    }

    .botao-publicar {
        font-size: 12px;
        padding: 9px 11px;
    }
}
 
    
</style>
