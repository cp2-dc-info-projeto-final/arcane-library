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

  export let id: number | null = null;

  let livro: LivroFormData = {
    id_autor: 0,
    autor: '',
    categorias: [],
    titulo: '',
    ano_de_publicacao: '',
    editora: '',
    isbn: 0
  };

  let categorias: Categorias[] = [];
  let categoriasSelecionadas: Categorias[] = [];
  let pesquisaCategoria = '';

  let autores: Autores[] = [];
  let pesquisaAutor = '';
  let autorSelecionado: Autores | null = null;

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

    if (!pesquisa) {
      return true;
    }

    return (
      autor.nome.toLowerCase().includes(pesquisa) ||
      autor.pseunonimo?.toLowerCase().includes(pesquisa)
    );
  });

  $: categoriasFiltradas = categorias.filter((categoria) => {
    const pesquisa = pesquisaCategoria.toLowerCase().trim();

    if (!pesquisa) {
      return true;
    }

    return categoria.nome.toLowerCase().includes(pesquisa);
  });

  /*
   * Selecionar categoria
   *
   * livro.categorias contém SOMENTE os IDs.
   * categoriasSelecionadas contém SOMENTE os objetos
   * utilizados para exibição.
   */
  function selecionarCategoria(categoria: Categorias) {
    const idCategoria = Number(categoria.id_categorias);

    if (!Number.isInteger(idCategoria) || idCategoria <= 0) {
      return;
    }

    // Evita duplicação pelo ID.
    if (livro.categorias.includes(idCategoria)) {
      return;
    }

    livro.categorias = [
      ...livro.categorias,
      idCategoria
    ];

    categoriasSelecionadas = [
      ...categoriasSelecionadas,
      categoria
    ];

    pesquisaCategoria = '';

    console.log('Categoria adicionada:', idCategoria);
    console.log('IDs atuais:', livro.categorias);
  }

  /*
   * Remover categoria
   */
  function removerCategoria(idCategoria: number) {
    const id = Number(idCategoria);

    livro.categorias = livro.categorias.filter(
      (categoriaId) => Number(categoriaId) !== id
    );

    categoriasSelecionadas = categoriasSelecionadas.filter(
      (categoria) => Number(categoria.id_categorias) !== id
    );

    console.log('Categoria removida:', id);
    console.log('IDs atuais:', livro.categorias);
  }

  /*
   * Selecionar autor
   */
  function selecionarAutor(autor: Autores) {
    autorSelecionado = autor;
    pesquisaAutor = autor.nome;
    livro.id_autor = autor.id;
    livro.autor = autor.nome;
  }

  /*
   * Limpar autor
   */
  function limparAutor() {
    autorSelecionado = null;
    pesquisaAutor = '';
    livro.id_autor = 0;
    livro.autor = '';
  }

  onMount(async () => {
    hasToken = getToken() !== null;

    // =========================
    // CARREGAR CATEGORIAS
    // =========================

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

    // =========================
    // CARREGAR AUTORES
    // =========================

    try {
      const res = await api.get('/autores');
      const body = res.data as ApiResponse<Autores[]>;

      if (body?.success && body.data) {
        autores = body.data;
      }
    } catch (e) {
      console.error('Erro ao carregar autores:', e);
    }

    // =========================
    // CARREGAR LIVRO PARA EDIÇÃO
    // =========================

    if (id !== null) {
      loading = true;

      try {
        const res = await api.get(`/livros/${id}`);
        const body = res.data as ApiResponse<Livro>;

        if (body?.success && body.data) {
          const livroData = body.data;

          /*
           * Normaliza os IDs recebidos da API para number.
           *
           * Isso é importante porque PostgreSQL/JSON pode devolver
           * bigint como string dependendo da configuração.
           */
          const idsCategorias = (livroData.categorias ?? [])
            .map((categoria) => Number(categoria.id_categorias))
            .filter(
              (idCategoria) =>
                Number.isInteger(idCategoria) && idCategoria > 0
            );

          livro = {
            id: livroData.id,
            id_autor: livroData.id_autor,
            autor: livroData.autor,
            categorias: idsCategorias,
            titulo: livroData.titulo,
            ano_de_publicacao: livroData.ano_de_publicacao,
            editora: livroData.editora,
            isbn: livroData.isbn,
            foto: livroData.foto
          };

          /*
           * Montar objetos das categorias selecionadas
           * usando os IDs normalizados.
           */
          categoriasSelecionadas = categorias.filter((categoria) =>
            idsCategorias.includes(Number(categoria.id_categorias))
          );

          /*
           * Autor selecionado
           */
          autorSelecionado =
            autores.find(
              (autor) => autor.id === livroData.id_autor
            ) ?? null;

          pesquisaAutor =
            autorSelecionado?.nome ??
            livroData.autor ??
            '';

          /*
           * Foto
           */
          fotoLivro = livroData.foto
            ? `/uploads/${livroData.foto}`
            : '';

          console.log(
            'CATEGORIAS CARREGADAS PARA EDIÇÃO:',
            categoriasSelecionadas
          );

          console.log(
            'IDS DAS CATEGORIAS CARREGADAS:',
            livro.categorias
          );
        } else {
          error = body?.message || 'Erro ao carregar livro.';
        }
      } catch (e: any) {
        const body = e.response?.data as
          | ApiResponse<Livro>
          | undefined;

        error =
          body?.message ||
          'Erro ao carregar livro.';
      } finally {
        loading = false;
      }
    }
  });

  async function handleSubmit() {
    fieldErrors = [];
    loading = true;
    error = '';

    try {
      // =========================
      // VALIDAR AUTOR
      // =========================

      if (!livro.id_autor || livro.id_autor === 0) {
        error = 'Selecione um autor.';
        loading = false;
        return;
      }

      // =========================
      // NORMALIZAR CATEGORIAS
      // =========================

      /*
       * Converte tudo para number.
       * Remove IDs inválidos.
       * Remove duplicados.
       */
      const categoriasIds = Array.from(
        new Set(
          livro.categorias
            .map((idCategoria) => Number(idCategoria))
            .filter(
              (idCategoria) =>
                Number.isInteger(idCategoria) &&
                idCategoria > 0
            )
        )
      );

      /*
       * Atualiza o estado para garantir que ele também
       * fique normalizado.
       */
      livro.categorias = categoriasIds;

      console.log(
        'CATEGORIAS SELECIONADAS:',
        categoriasSelecionadas
      );

      console.log(
        'IDS DAS CATEGORIAS:',
        livro.categorias
      );

      console.log(
        'IDS FINAIS ENVIADOS:',
        categoriasIds
      );

      // =========================
      // FORM DATA
      // =========================

      const formData = new FormData();

      formData.append(
        'autor',
        String(livro.id_autor)
      );

      formData.append(
        'categorias',
        JSON.stringify(categoriasIds)
      );

      formData.append(
        'titulo',
        livro.titulo
      );

      formData.append(
        'ano_de_publicacao',
        String(livro.ano_de_publicacao)
      );

      formData.append(
        'editora',
        livro.editora
      );

      formData.append(
        'isbn',
        String(livro.isbn)
      );

      if (fotoFile) {
        formData.append(
          'foto',
          fotoFile
        );
      }

      // =========================
      // DEBUG DO FORMDATA
      // =========================

      console.log('========== FORMDATA ==========');

      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      console.log('==============================');

      // =========================
      // CADASTRAR OU EDITAR
      // =========================

      const targetRoute =
        id === null
          ? '/livros'
          : `/livros/${id}`;

      let res;

      if (id === null) {
        res = await api.post(
          targetRoute,
          formData
        );
      } else {
        res = await api.put(
          targetRoute,
          formData
        );
      }

      const body =
        res.data as ApiResponse<Livro>;

      if (!body?.success) {
        error =
          body?.message ||
          'Erro ao salvar livro.';

        fieldErrors =
          body?.errors || [];

        return;
      }

      goto('/livros');

    } catch (e: any) {
      console.error(
        'Erro ao salvar livro:',
        e
      );

      console.error(
        'Resposta do backend:',
        e.response?.data
      );

      error =
        e.response?.data?.message ||
        'Erro ao salvar livro.';

      fieldErrors =
        e.response?.data?.errors ||
        [];
    } finally {
      loading = false;
    }
  }



  function handleCancel() {
    goto('/livros');
  }

  function selecionarFoto(event: Event) {
    const input =
      event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    const file = input.files[0];

    fotoFile = file;

    const reader = new FileReader();

    reader.onload = (e) => {
      fotoLivro =
        e.target?.result as string;
    };

    reader.readAsDataURL(file);

    abrirModalFoto = false;
  }
</script>

<Card class="max-w-2xl mx-auto mt-10 p-0 overflow-hidden shadow-lg border border-gray-200 rounded-lg">

  <form
    class="flex flex-col gap-6 p-6"
    on:submit|preventDefault={handleSubmit}
  >

    <Heading tag="h3" class="mb-2 text-center">
      {id === null ? 'Cadastrar Livro' : 'Editar Livro'}
    </Heading>

    {#if error}
      <div class="text-red-500 text-center">
        {error}
      </div>
    {/if}

    <!-- Capa -->

    <div class="flex justify-center">

      <button
        type="button"
        class="w-40 h-56 rounded-lg overflow-hidden border-4 border-gray-300 hover:border-blue-500 transition shadow-md"
        on:click={() => (abrirModalFoto = true)}
      >

        {#if fotoLivro}

          <img
            src={fotoLivro}
            alt="Capa do livro"
            class="w-full h-full object-cover"
          />

        {:else}

          <div class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-center p-4">
            Clique para adicionar capa
          </div>

        {/if}

      </button>

    </div>

    <!-- Categorias -->

    <div>

      <Label for="categoria">
        Categorias
      </Label>

      <Input
        id="categoria"
        bind:value={pesquisaCategoria}
        placeholder="Pesquisar categoria..."
        class="mt-1"
      />

      {#if pesquisaCategoria}

        <div class="mt-1 border border-gray-300 rounded-lg bg-white max-h-48 overflow-y-auto">

          {#if categoriasFiltradas.length > 0}

            {#each categoriasFiltradas as categoria}

              {#if !livro.categorias.includes(Number(categoria.id_categorias))}

                <button
                  type="button"
                  class="w-full text-left px-3 py-2 hover:bg-gray-100"
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

              <span>
                {categoria.nome}
              </span>

              <button
                type="button"
                class="text-blue-600 hover:text-red-500 font-bold"
                on:click={() =>
                  removerCategoria(
                    Number(categoria.id_categorias)
                  )
                }
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

        <div class="mt-1 text-sm text-red-500">
          {errorOf('categorias')}
        </div>

      {/if}

    </div>

    <!-- Título -->

    <div>

      <Label for="titulo">
        Título
      </Label>

      <Input
        id="titulo"
        bind:value={livro.titulo}
        placeholder="Digite o título"
        required
        class="mt-1"
      />

      {#if errorOf('titulo')}

        <div class="mt-1 text-sm text-red-500">
          {errorOf('titulo')}
        </div>

      {/if}

    </div>

    <!-- Ano -->

    <div>

      <Label for="ano">
        Ano de Publicação
      </Label>

    <input
    type="number"
    name="ano_de_publicacao"
    min="1000"
    max="2026"
    step="1"
    bind:value={livro.ano_de_publicacao}
    placeholder="Ano de publicação"
/>

      {#if errorOf('ano_de_publicacao')}

        <div class="mt-1 text-sm text-red-500">
          {errorOf('ano_de_publicacao')}
        </div>

      {/if}

    </div>

    <!-- Autor -->

    <div>

      <Label for="autor">
        Autor
      </Label>

      <Input
        id="autor"
        bind:value={pesquisaAutor}
        placeholder="Pesquisar autor..."
        class="mt-1"
      />

      {#if pesquisaAutor && !autorSelecionado}

        <div class="mt-1 border border-gray-300 rounded-lg bg-white max-h-48 overflow-y-auto">

          {#if autoresFiltrados.length > 0}

            {#each autoresFiltrados as autor}

              <button
                type="button"
                class="w-full text-left px-3 py-2 hover:bg-gray-100"
                on:click={() => selecionarAutor(autor)}
              >

                {autor.nome}

                {#if autor.pseunonimo}

                  <span class="text-gray-500">
                    — {autor.pseunonimo}
                  </span>

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

          Autor selecionado:

          <strong>
            {autorSelecionado.nome}
          </strong>

          <button
            type="button"
            class="ml-2 text-red-500"
            on:click={limparAutor}
          >
            ×
          </button>

        </div>

      {/if}

      {#if errorOf('autor')}

        <div class="mt-1 text-sm text-red-500">
          {errorOf('autor')}
        </div>

      {/if}

    </div>

    <!-- Editora -->

    <div>

      <Label for="editora">
        Editora
      </Label>

      <Input
        id="editora"
        bind:value={livro.editora}
        placeholder="Digite a editora"
        required
        class="mt-1"
      />

      {#if errorOf('editora')}

        <div class="mt-1 text-sm text-red-500">
          {errorOf('editora')}
        </div>

      {/if}

    </div>

    <!-- ISBN -->

    <div>

      <Label for="isbn">
        ISBN
      </Label>

      <Input
        id="isbn"
        type="number"
        bind:value={livro.isbn}
        placeholder="Digite o ISBN"
        required
        class="mt-1"
      />

      {#if errorOf('isbn')}

        <div class="mt-1 text-sm text-red-500">
          {errorOf('isbn')}
        </div>

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

        {id === null ? 'Cadastrar' : 'Salvar'}

      </Button>

    </div>

  </form>

</Card>

<!-- Modal da foto -->

<Modal
  bind:open={abrirModalFoto}
  size="sm"
  autoclose
>

  <div class="p-6 flex flex-col items-center gap-4">

    <h3 class="text-lg font-semibold">
      Selecione a capa do livro
    </h3>

    <input
      type="file"
      accept="image/*"
      on:change={selecionarFoto}
      class="block w-full text-sm text-gray-500"
    />

    {#if fotoLivro}

      <img
        src={fotoLivro}
        alt="Pré-visualização"
        class="w-40 h-56 rounded-lg object-cover border"
      />

    {/if}

  </div>

</Modal>