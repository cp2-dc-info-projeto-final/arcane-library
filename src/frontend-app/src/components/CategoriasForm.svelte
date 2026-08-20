<script lang="ts">
  import { Card, Button, Label, Input, Heading } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import api from '$lib/api';
  import type { ApiFieldError, ApiResponse } from '$lib/api';
  import { goto } from '$app/navigation';
  import { ArrowLeftOutline, FloppyDiskAltOutline } from 'flowbite-svelte-icons';
  import type { Categorias, CategoriasFormData } from '$lib/models/Categorias';
  import { getToken } from "$lib/auth";
  import { themeStore, themes, type Season } from '$lib/themeStore';

  export let id: number | null = null;

  let categorias: CategoriasFormData = { id: 0, nome: '', };
  let loading = false;
  let error = '';
  let fieldErrors: ApiFieldError[] = [];
  let hasToken = false;
  let currentTheme: Season = 'spring';

 themeStore.subscribe((theme) => {
  currentTheme = theme;
});
// ver 
  function errorOf(field: string): string | null {
    return fieldErrors.find((item) => item.field === field)?.message ?? null;
  }


  onMount(async () => {
    if (id !== null) {
      loading = true;
      try {
        let targetRoute = `/categorias/${id}`;

        const res = await api.get(targetRoute);
        const body = res.data as ApiResponse<Categorias>;
        if (body && body.success && body.data) {
          categorias = { ...body.data};
        } else {
          error = body?.message || 'Erro ao carregar categoria.';
        }

      } catch (e: any) {
        const body = e.response?.data as ApiResponse<Categorias> | undefined;
        error = body?.message || 'Erro ao carregar categoria.';
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
      
      let targetRoute = id === null ? '/categorias' : `/categorias/${id}`;
      let res;

      // REMOVIDO FormData! Enviamos o objeto JSON diretamente:
      if (id === null) {
        res = await api.post(targetRoute, { nome: categorias.nome });
      } else {
        res = await api.put(targetRoute, { nome: categorias.nome });
      }

      const body = res.data as ApiResponse<Categorias>;
      if (!body?.success) {
        error = body?.message || 'Erro ao salvar categorias.';
        fieldErrors = body?.errors || [];
        return;
      }

      goto('/categorias');

    } catch (e: any) {
      error = e.response?.data?.message || 'Erro ao salvar categoria.';
      fieldErrors = e.response?.data?.errors || [];
    } finally {
      loading = false;
    }
  
  }
  function handleCancel() {
    goto('/categorias');
  }

  function verificaUser() {
    hasToken = getToken() !== null;
  }

  void verificaUser();

 
</script>

<!-- Card do formulário -->
<Card class="max-w-md mx-auto mt-10 p-0 overflow-hidden shadow-lg border border-gray-200 rounded-lg">
  <!-- Formulário principal -->
  <form class="flex flex-col gap-6 p-6" on:submit|preventDefault={handleSubmit}>
    <!-- Título -->
    <Heading tag="h3" class="mb-2 text-center">
      {id === null ? 'Cadastrar Categoria' : 'Editar Categoria'}
    </Heading>
    <!-- Mensagem de erro -->
    {#if error}
      <div class="text-red-500 text-center">{error}</div>
    {/if}

  
    <!-- Campo nome -->
    <div>
      <Label for="nome">Nome</Label>
      <Input id="nome" bind:value={categorias.nome} placeholder="Digite o nome" required class="mt-1" />
      {#if errorOf('nome')}
        <div class="mt-1 text-sm text-red-500">{errorOf('nome')}</div>
      {/if}
    </div>

    
    <!-- Botões de ação -->
    
    <div class="flex gap-4 justify-end mt-4">
      <!-- Botão cancelar/voltar -->
      <Button color="light" type="button" onclick={handleCancel} disabled={loading}>
        <ArrowLeftOutline class="inline w-5 h-5 mr-2 align-text-bottom" />
        {id === null ? 'Voltar' : 'Cancelar'}
      </Button>
      <!-- Botão salvar -->
      <Button type="submit" color="primary" disabled={loading}>
        <FloppyDiskAltOutline class="inline w-5 h-5 mr-2 align-text-bottom" />
        {id === null ? 'Cadastrar' : 'Salvar'}
      </Button> 
    </div>
  </form>
</Card>

