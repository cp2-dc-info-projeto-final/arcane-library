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
  let abrirModalDelete = false;
  let livroParaDeletar: Livro | null = null;
  let consulta: ''

  onMount(async () => {
      try {
        const res = await api.get('/livros');
        const body = res.data as ApiResponse<Livro[]>;
        if (body.success) {
          livros = body.data ?? [];
        } else {
          error = body.message;
        }
      } catch (e: any) {
        console.error('Erro ao carregar livro:', e);
        const body = e.response?.data as ApiResponse<Livro[]> | undefined;
        error = body?.message || 'Erro ao carregar categoria';
      } finally {
        loading = false;
      }
    });
    async function filtrarLivros(){
      try {
        const res = await api.get(`/livros?consulta=${encodeURIComponent(consulta)}`);
        const body = res.data as ApiResponse<Livro[]>;
        if (body.success) {
          livros = body.data ?? [];
        } else {
          error = body.message;
        }
      } catch (e: any) {
        console.error('Erro ao carregar livros:', e);
        const body = e.response?.data as ApiResponse<Livro[]> | undefined;
        error = body?.message || 'Erro ao carregar livros';
      } finally {
        loading = false;
      }
    };
    

  function abrirDelete(livro: Livro) {
    livroParaDeletar = livro;
    abrirModalDelete = true;
  }

  async function confirmarDelete() {
    if (!livroParaDeletar) return;

    loading = true;
    try {
      await api.delete(`/livros/${livroParaDeletar.id}`);
      await filtrarLivros();
      abrirModalDelete = false;
      livroParaDeletar = null;
    } catch (e: any) {
      error = e.response?.data?.message || 'Erro ao deletar livro';
    } finally {
      loading = false;
    }
  }
</script>
  
<div class = "">
  
      
  <input type ="text" id = "pesquisa" bind:value={consulta} on:input={filtrarLivros} placeholder="Busca por livros">
  
</div>  
  

<div class="max-w-6xl mx-auto">
  {#if error}
    <div class="mb-4 p-4 text-red-500 bg-red-100 rounded">{error}</div>
  {/if}

  {#if loading}
    <div class="flex justify-center p-8">
      <Spinner />
    </div>
  {:else if livros.length === 0}
    <div class="text-center p-8 text-gray-500">Nenhum livro encontrado</div>
  {:else}
    <Table>
      <thead>
        <tr>
          <th>Capa</th>
          <th>Título</th>
          <th>Ano</th>
          <th>Autor</th>
          <th>Editora</th>
          <th>ISBN</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {#each livros as livro}
          <tr>
            <td>
              {#if livro.foto}
                <img 
                  src={`/uploads/${livro.foto}`} 
                  alt={livro.titulo}
                  class="w-12 h-20 object-cover rounded"
                />
              {:else}
                <div class="w-12 h-20 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-600">
                  Sem foto
                </div>
              {/if}
            </td>
            <td>{livro.titulo}</td>
            <td>{livro.ano_de_publicacao}</td>
            <td>{livro.editora}</td>
            <td>{livro.isbn}</td>
            <td>
              <div class="flex gap-2">
                <Button 
                  size="sm" 
                  color="light"
                  on:click={() => goto(`/livros/edit/${livro.id}`)}
                >
                
                </Button>
                <Button 
                  size="sm" 
                  color="red"
                  on:click={() => abrirDelete(livro)}
                >
                  <TrashBinOutline class="w-4 h-4" />
                </Button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </Table>
  {/if}
</div>


<Modal bind:open={abrirModalDelete} size="sm">
  <div class="p-6">
    <h3 class="text-lg font-semibold mb-4">
      Deseja deletar "{livroParaDeletar?.titulo}"?
    </h3>
    <div class="flex gap-2 justify-end">
      <Button color="light" on:click={() => abrirModalDelete = false}>
        Cancelar
      </Button>
      <Button color="red" on:click={confirmarDelete}>
        Deletar
      </Button>
    </div>
  </div>
</Modal>
