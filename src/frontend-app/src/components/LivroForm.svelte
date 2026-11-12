
<script lang="ts">
  import { Card, Button, Label, Input, Heading, Modal } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import api from '$lib/api';
  import type { ApiFieldError, ApiResponse } from '$lib/api';
  import { goto } from '$app/navigation';
  import { ArrowLeftOutline, FloppyDiskAltOutline } from 'flowbite-svelte-icons';
  import type { Livro, LivroFormData } from '$lib/models/Livros';
  import type { Categorias } from '$lib/models/Categorias';
  import type { Autores } from '$lib/models/Autores';
  import { getToken } from '$lib/auth';

  const API_URL = 'http://localhost:3000';

  export let id: number | null = null;

  let livro: LivroFormData = {
    id: undefined,
    id_autor: 0,
    autor: '',
    categorias: [],
    titulo: '',
    sinopse: '',
    ano_de_publicacao: '',
    editora: '',
    isbn: 0,
    foto: ''
  };

  let categorias: Categorias[] = [];
  let categoriasSelecionadas: Categorias[] = [];
  let pesquisaCategoria = '';

  let autores: Autores[] = [];
  let pesquisaAutor = '';
  let autorSelecionado: Autores | null = null;

  // fotoLivro é usada para exibir a imagem.
  // fotoFile é o arquivo que será enviado ao backend.
  let fotoLivro = '';
  let fotoFile: File | null = null;
  let abrirModalFoto = false;

  let loading = false;
  let error = '';
  let fieldErrors: ApiFieldError[] = [];
  let hasToken = false;

  function errorOf(field: string): string | null {
    return fieldErrors.find((item) => item.field === field)?.message ?? null;
  }

  $: autoresFiltrados = autores.filter((autor) => {
    const pesquisa = pesquisaAutor.toLowerCase().trim();

    if (!pesquisa) return true;

    return (
      autor.nome.toLowerCase().includes(pesquisa) ||
      autor.pseunonimo?.toLowerCase().includes(pesquisa)
    );
  });

  $: categoriasFiltradas = categorias.filter((categoria) => {
    const pesquisa = pesquisaCategoria.toLowerCase().trim();

    if (!pesquisa) return true;

    return categoria.nome.toLowerCase().includes(pesquisa);
  });

  function selecionarCategoria(categoria: Categorias) {
    const idCategoria = Number(categoria.id_categorias);

    if (!Number.isInteger(idCategoria) || idCategoria <= 0) return;
    if (livro.categorias.includes(idCategoria)) return;

    livro.categorias = [...livro.categorias, idCategoria];
    categoriasSelecionadas = [...categoriasSelecionadas, categoria];
    pesquisaCategoria = '';
  }

  function removerCategoria(idCategoria: number) {
    const id = Number(idCategoria);

    livro.categorias = livro.categorias.filter(
      (categoriaId) => Number(categoriaId) !== id
    );

    categoriasSelecionadas = categoriasSelecionadas.filter(
      (categoria) => Number(categoria.id_categorias) !== id
    );
  }

  function selecionarAutor(autor: Autores) {
    autorSelecionado = autor;
    pesquisaAutor = autor.nome;
    livro.id_autor = autor.id;
    livro.autor = autor.nome;
  }

  function limparAutor() {
    autorSelecionado = null;
    pesquisaAutor = '';
    livro.id_autor = 0;
    livro.autor = '';
  }

  // Seleciona e prepara a prévia da capa.
  function selecionarFoto(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error = 'Selecione um arquivo de imagem válido.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error = 'A imagem deve ter no máximo 5 MB.';
      input.value = '';
      return;
    }

    fotoFile = file;
    error = '';

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // A prévia usa Data URL; o envio usa o arquivo original.
        fotoLivro = reader.result;
      }
    };

    reader.onerror = () => {
      error = 'Não foi possível visualizar essa imagem.';
      fotoFile = null;
    };

    reader.readAsDataURL(file);
    abrirModalFoto = false;
  }

  onMount(async () => {
    hasToken = getToken() !== null;

    // Carregar categorias antes de montar as categorias selecionadas.
    try {
      const res = await api.get('/categorias');
      const body = res.data as ApiResponse<Categorias[]>;

      if (body?.success && body.data) {
        categorias = body.data.map((categoria) => ({
          ...categoria,
          id_categorias: Number(categoria.id_categorias)
        }));
      }
    } catch (e) {
      console.error('Erro ao carregar categorias:', e);
    }

    // Carregar autores.
    try {
      const res = await api.get('/autores');
      const body = res.data as ApiResponse<Autores[]>;

      if (body?.success && body.data) {
        autores = body.data;
      }
    } catch (e) {
      console.error('Erro ao carregar autores:', e);
    }

    // Carregar livro quando estiver editando.
    if (id !== null) {
      loading = true;
      error = '';

      try {
        const res = await api.get(`/livros/${id}`);
        const body = res.data as ApiResponse<Livro>;

        if (body?.success && body.data) {
          const livroData = body.data;

          const idsCategorias = (livroData.categorias ?? [])
            .map((categoria: any) => Number(categoria.id_categorias))
            .filter(
              (idCategoria: number) =>
                Number.isInteger(idCategoria) && idCategoria > 0
            );

          livro = {
            id: livroData.id,
            id_autor: livroData.id_autor,
            autor: livroData.autor,
            categorias: idsCategorias,
            titulo: livroData.titulo ?? '',
            sinopse: livroData.sinopse ?? '',
            ano_de_publicacao: livroData.ano_de_publicacao ?? '',
            editora: livroData.editora ?? '',
            isbn: livroData.isbn ?? 0,
            foto: livroData.foto ?? ''
          };

          categoriasSelecionadas = categorias.filter((categoria) =>
            idsCategorias.includes(Number(categoria.id_categorias))
          );

          autorSelecionado =
            autores.find(
              (autor) => Number(autor.id) === Number(livroData.id_autor)
            ) ?? null;

          pesquisaAutor =
            autorSelecionado?.nome ?? livroData.autor ?? '';

          // O banco guarda somente o nome do arquivo.
          // A URL completa é usada para exibir a imagem.
          fotoLivro = livroData.foto
            ? `${API_URL}/uploads/${livroData.foto}`
            : '';

          fotoFile = null;
        } else {
          error = body?.message || 'Erro ao carregar livro.';
        }
      } catch (e: any) {
        error =
          e.response?.data?.message ||
          'Erro ao carregar livro.';
      } finally {
        loading = false;
      }
    }
  });

  async function handleSubmit() {
    fieldErrors = [];
    error = '';

    if (!livro.id_autor || Number(livro.id_autor) <= 0) {
      error = 'Selecione um autor.';
      return;
    }

    const categoriasIds = Array.from(
      new Set(
        livro.categorias
          .map((idCategoria) => Number(idCategoria))
          .filter(
            (idCategoria) =>
              Number.isInteger(idCategoria) && idCategoria > 0
          )
      )
    );

    if (categoriasIds.length === 0) {
      error = 'Selecione pelo menos uma categoria.';
      return;
    }

    if (!livro.titulo.trim()) {
      error = 'Informe o título do livro.';
      return;
    }

    loading = true;

    try {
      const formData = new FormData();

      // O backend aceita "autor" como ID do autor.
      formData.append('autor', String(livro.id_autor));
      formData.append('id_categorias', JSON.stringify(categoriasIds));
      formData.append('titulo', livro.titulo.trim());
      formData.append('sinopse', livro.sinopse ?? '');
      formData.append(
        'ano_de_publicacao',
        String(livro.ano_de_publicacao ?? '')
      );
      formData.append('editora', livro.editora ?? '');
      formData.append('isbn', String(livro.isbn ?? ''));

      // Só envia uma nova capa se o usuário selecionar outra.
      // Se não selecionar, o backend preserva a foto anterior.
      if (fotoFile) {
        formData.append('foto', fotoFile, fotoFile.name);
      }

      console.log('Dados enviados:');

      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const targetRoute = id === null ? '/livros' : `/livros/${id}`;

      const res =
        id === null
          ? await api.post(targetRoute, formData)
          : await api.put(targetRoute, formData);

      const body = res.data as ApiResponse<Livro>;

      if (!body?.success) {
        error = body?.message || 'Erro ao salvar livro.';
        fieldErrors = body?.errors || [];
        return;
      }

      await goto('/livros');
    } catch (e: any) {
      console.error('Erro ao salvar livro:', e);
      console.error('Resposta do backend:', e.response?.data);

      error =
        e.response?.data?.message ||
        'Erro ao salvar livro.';

      fieldErrors = e.response?.data?.errors || [];
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    if (!loading) goto('/livros');
  }
</script>

<svelte:head>
  <title>{id === null ? 'Cadastrar Livro' : 'Editar Livro'} | Arcane Library</title>
</svelte:head>

<Card class="max-w-2xl mx-auto mt-10 p-0 overflow-hidden shadow-lg border border-gray-200 rounded-lg">
  <form
    class="flex flex-col gap-6 p-6"
    on:submit|preventDefault={handleSubmit}
  >
    <Heading tag="h3" class="mb-2 text-center">
      {id === null ? 'Cadastrar Livro' : 'Editar Livro'}
    </Heading>

    {#if error}
      <div class="text-red-500 text-center">{error}</div>
    {/if}

    {#if loading}
      <p class="text-center text-gray-500">Carregando ou salvando...</p>
    {/if}

    <!-- Capa do livro -->
    <div class="flex flex-col items-center gap-3">
      <Label>Capa do livro</Label>

      <button
        type="button"
        class="w-40 h-56 rounded-lg overflow-hidden border-4 border-gray-300 hover:border-blue-500 transition shadow-md bg-gray-200"
        on:click={() => (abrirModalFoto = true)}
        disabled={loading}
      >
        {#if fotoLivro}
          <img
            src={fotoLivro}
            alt="Capa de {livro.titulo || 'livro'}"
            class="w-full h-full object-cover"
          />
        {:else}
          <div class="w-full h-full flex items-center justify-center text-gray-500 text-center p-4">
            Clique para adicionar capa
          </div>
        {/if}
      </button>

      <p class="text-xs text-gray-500">
        Clique na capa para selecionar uma imagem. Máximo de 5 MB.
      </p>
    </div>

    <!-- Categorias -->
    <div>
      <Label for="categoria">Categorias</Label>

      <Input
        id="categoria"
        bind:value={pesquisaCategoria}
        placeholder="Pesquisar categoria..."
        class="mt-1"
        disabled={loading}
      />

      {#if pesquisaCategoria}
        <div class="mt-1 border border-gray-300 rounded-lg bg-white max-h-48 overflow-y-auto">
          {#if categoriasFiltradas.length > 0}
            {#each categoriasFiltradas as categoria}
              {#if !livro.categorias.includes(Number(categoria.id_categorias))}
                <button
                  type="button"
                  class="w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-900"
                  on:click={() => selecionarCategoria(categoria)}
                >
                  {categoria.nome}
                </button>
              {/if}
            {/each}
          {:else}
            <div class="px-3 py-2 text-gray-500">
              Nenhuma categoria encontrada.
            </div>
          {/if}
        </div>
      {/if}

      {#if categoriasSelecionadas.length > 0}
        <div class="mt-3 flex flex-wrap gap-2">
          {#each categoriasSelecionadas as categoria}
            <div class="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
              <span>{categoria.nome}</span>

              <button
                type="button"
                class="text-blue-600 hover:text-red-500 font-bold"
                on:click={() =>
                  removerCategoria(Number(categoria.id_categorias))}
                disabled={loading}
              >
                ×
              </button>
            </div>
          {/each}
        </div>
      {:else}
        <div class="mt-2 text-sm text-gray-500">
          Nenhuma categoria selecionada.
        </div>
      {/if}

      {#if errorOf('categorias')}
        <div class="mt-1 text-sm text-red-500">{errorOf('categorias')}</div>
      {/if}
    </div>

    <!-- Título -->
    <div>
      <Label for="titulo">Título</Label>
      <Input
        id="titulo"
        bind:value={livro.titulo}
        placeholder="Digite o título"
        required
        class="mt-1"
        disabled={loading}
      />

      {#if errorOf('titulo')}
        <div class="mt-1 text-sm text-red-500">{errorOf('titulo')}</div>
      {/if}
    </div>

    <!-- Sinopse -->
    <div>
      <Label for="sinopse">Sinopse</Label>
      <textarea
        id="sinopse"
        bind:value={livro.sinopse}
        placeholder="Digite a sinopse do livro..."
        rows="5"
        disabled={loading}
        class="mt-1 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
      ></textarea>

      {#if errorOf('sinopse')}
        <div class="mt-1 text-sm text-red-500">{errorOf('sinopse')}</div>
      {/if}
    </div>

    <!-- Ano -->
    <div>
      <Label for="ano">Ano de Publicação</Label>
      <Input
        id="ano"
        type="number"
        min="1000"
        max="2026"
        step="1"
        bind:value={livro.ano_de_publicacao}
        placeholder="Ano de publicação"
        disabled={loading}
      />

      {#if errorOf('ano_de_publicacao')}
        <div class="mt-1 text-sm text-red-500">
          {errorOf('ano_de_publicacao')}
        </div>
      {/if}
    </div>

    <!-- Autor -->
    <div>
      <Label for="autor">Autor</Label>
      <Input
        id="autor"
        bind:value={pesquisaAutor}
        placeholder="Pesquisar autor..."
        class="mt-1"
        disabled={loading}
        on:input={() => {
          if (
            autorSelecionado &&
            pesquisaAutor !== autorSelecionado.nome
          ) {
            limparAutor();
          }
        }}
      />

      {#if pesquisaAutor && !autorSelecionado}
        <div class="mt-1 border border-gray-300 rounded-lg bg-white max-h-48 overflow-y-auto">
          {#if autoresFiltrados.length > 0}
            {#each autoresFiltrados as autor}
              <button
                type="button"
                class="w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-900"
                on:click={() => selecionarAutor(autor)}
              >
                {autor.nome}
                {#if autor.pseunonimo}
                  <span class="text-gray-500">— {autor.pseunonimo}</span>
                {/if}
              </button>
            {/each}
          {:else}
            <div class="px-3 py-2 text-gray-500">
              Nenhum autor encontrado.
            </div>
          {/if}
        </div>
      {/if}

      {#if autorSelecionado}
        <div class="mt-2 text-sm text-gray-600">
          Autor selecionado: <strong>{autorSelecionado.nome}</strong>
          <button
            type="button"
            class="ml-2 text-red-500"
            on:click={limparAutor}
            disabled={loading}
          >
            ×
          </button>
        </div>
      {/if}

      {#if errorOf('autor')}
        <div class="mt-1 text-sm text-red-500">{errorOf('autor')}</div>
      {/if}
    </div>

    <!-- Editora -->
    <div>
      <Label for="editora">Editora</Label>
      <Input
        id="editora"
        bind:value={livro.editora}
        placeholder="Digite a editora"
        required
        class="mt-1"
        disabled={loading}
      />

      {#if errorOf('editora')}
        <div class="mt-1 text-sm text-red-500">{errorOf('editora')}</div>
      {/if}
    </div>

    <!-- ISBN -->
    <div>
      <Label for="isbn">ISBN</Label>
      <Input
        id="isbn"
        type="text"
        bind:value={livro.isbn}
        placeholder="Digite o ISBN"
        required
        class="mt-1"
        disabled={loading}
      />

      {#if errorOf('isbn')}
        <div class="mt-1 text-sm text-red-500">{errorOf('isbn')}</div>
      {/if}
    </div>

    <!-- Botões -->
    <div class="flex gap-4 justify-end mt-4">
      <Button
        color="light"
        type="button"
        onclick={handleCancel}
        disabled={loading}
      >
        <ArrowLeftOutline class="inline w-5 h-5 mr-2 align-text-bottom" />
        Cancelar
      </Button>

      <Button
        type="submit"
        color="primary"
        disabled={loading}
      >
        <FloppyDiskAltOutline class="inline w-5 h-5 mr-2 align-text-bottom" />
        {loading ? 'Salvando...' : id === null ? 'Cadastrar' : 'Salvar'}
      </Button>
    </div>
  </form>
</Card>

<!-- Modal para selecionar capa -->
<Modal bind:open={abrirModalFoto} size="sm" autoclose>
  <div class="p-6 flex flex-col items-center gap-4">
    <h3 class="text-lg font-semibold">Selecione a capa do livro</h3>

    {#if fotoLivro}
      <img
        src={fotoLivro}
        alt="Pré-visualização da capa"
        class="w-40 h-56 rounded-lg object-cover border"
      />
    {/if}

    <input
      type="file"
      name="foto"
      accept="image/*"
      on:change={selecionarFoto}
      class="block w-full text-sm text-gray-500"
    />

    <Button
      color="light"
      class="w-full"
      onclick={() => (abrirModalFoto = false)}
    >
      Fechar
    </Button>
  </div>
</Modal>
