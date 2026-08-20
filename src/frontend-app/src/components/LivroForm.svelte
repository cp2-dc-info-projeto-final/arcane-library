<script lang="ts">
  import { Card, Button, Label, Input, Heading, Select, Modal } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import api from '$lib/api';
  import type { ApiFieldError, ApiResponse } from '$lib/api';
  import { goto } from '$app/navigation';
  import { ArrowLeftOutline, FloppyDiskAltOutline } from 'flowbite-svelte-icons';
  import type { Livro, LivroFormData } from '$lib/models/Livros';
  import type { Categorias } from '$lib/models/Categorias';
  import { getToken } from "$lib/auth";

  export let id: number | null = null;

  let livro: LivroFormData = { 
    id_categorias: 0, 
    titulo: '', 
    ano_de_publicacao: '',
    editora: '',
    isbn: 0
  };
  
  let categorias: Categorias[] = [];
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

  onMount(async () => {
    hasToken = getToken() !== null;
    
    // Carregar categorias
    try {
      const res = await api.get('/categorias');
      const body = res.data as ApiResponse<Categorias[]>;
      if (body?.success && body.data) {
        categorias = body.data;
      }
    } catch (e) {
      console.error('Erro ao carregar categorias:', e);
    }

    // Se editando, carregar livro
    if (id !== null) {
      loading = true;
      try {
        const res = await api.get(`/livros/${id}`);
        const body = res.data as ApiResponse<Livro>;
        if (body && body.success && body.data) {
          livro = { ...body.data };
          fotoLivro = body.data.foto || '';
        } else {
          error = body?.message || 'Erro ao carregar livro.';
        }
      } catch (e: any) {
        const body = e.response?.data as ApiResponse<Livro> | undefined;
        error = body?.message || 'Erro ao carregar livro.';
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
      const formData = new FormData();
      formData.append('id_categorias', livro.id_categorias.toString());
      formData.append('titulo', livro.titulo);
      formData.append('ano_de_publicacao', livro.ano_de_publicacao);
      formData.append('editora', livro.editora);
      formData.append('isbn', livro.isbn.toString());

      if (fotoFile) {
        formData.append('foto', fotoFile);
      }

      let targetRoute = id === null ? '/livros' : `/livros/${id}`;
      let res;

      if (id === null) {
        res = await api.post(targetRoute, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.put(targetRoute, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      const body = res.data as ApiResponse<Livro>;
      if (!body?.success) {
        error = body?.message || 'Erro ao salvar livro.';
        fieldErrors = body?.errors || [];
        return;
      }

      goto('/livros');
    } catch (e: any) {
      error = e.response?.data?.message || 'Erro ao salvar livro.';
      fieldErrors = e.response?.data?.errors || [];
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    goto('/livros');
  }

  function selecionarFoto(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    fotoFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      fotoLivro = e.target?.result as string;
    };
    reader.readAsDataURL(file);
    abrirModalFoto = false;
  }

  const categoriasOptions = categorias.map(c => ({
    value: c.id_categorias.toString(),
    name: c.nome
  }));
</script>

<Card class="max-w-2xl mx-auto mt-10 p-0 overflow-hidden shadow-lg border border-gray-200 rounded-lg">
  <form class="flex flex-col gap-6 p-6" on:submit|preventDefault={handleSubmit}>
    <Heading tag="h3" class="mb-2 text-center">
      {id === null ? 'Cadastrar Livro' : 'Editar Livro'}
    </Heading>

    {#if error}
      <div class="text-red-500 text-center">{error}</div>
    {/if}

    <!-- Foto do Livro -->
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

    <!-- Categoria -->
    <div>
      <Label for="categoria">Categoria</Label>
      <Select 
        id="categoria" 
        bind:value={livro.id_categorias} 
        items={categoriasOptions} 
        class="mt-1"
        required
      />
      {#if errorOf('id_categorias')}
        <div class="mt-1 text-sm text-red-500">{errorOf('id_categorias')}</div>
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
      />
      {#if errorOf('titulo')}
        <div class="mt-1 text-sm text-red-500">{errorOf('titulo')}</div>
      {/if}
    </div>

    <!-- Ano de Publicação -->
    <div>
      <Label for="ano">Ano de Publicação</Label>
      <Input 
        id="ano" 
        bind:value={livro.ano_de_publicacao} 
        placeholder="YYYY" 
        required 
        class="mt-1" 
      />
      {#if errorOf('ano_de_publicacao')}
        <div class="mt-1 text-sm text-red-500">{errorOf('ano_de_publicacao')}</div>
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
        type="number"
        bind:value={livro.isbn} 
        placeholder="Digite o ISBN" 
        required 
        class="mt-1" 
      />
      {#if errorOf('isbn')}
        <div class="mt-1 text-sm text-red-500">{errorOf('isbn')}</div>
      {/if}
    </div>

    <!-- Botões -->
    <div class="flex gap-4 justify-end mt-4">
      <Button color="light" type="button" onclick={handleCancel} disabled={loading}>
        <ArrowLeftOutline class="inline w-5 h-5 mr-2 align-text-bottom" />
        Cancelar
      </Button>
      <Button type="submit" color="primary" disabled={loading}>
        <FloppyDiskAltOutline class="inline w-5 h-5 mr-2 align-text-bottom" />
        {id === null ? 'Cadastrar' : 'Salvar'}
      </Button>
    </div>
  </form>
</Card>

<!-- Modal para foto -->
<Modal bind:open={abrirModalFoto} size="sm" autoclose>
  <div class="p-6 flex flex-col items-center gap-4">
    <h3 class="text-lg font-semibold">Selecione a capa do livro</h3>
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