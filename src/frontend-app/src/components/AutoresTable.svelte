<script lang="ts">
    // Tabela de autores
    import { Table, TableHead, TableHeadCell, TableBody, TableBodyRow, TableBodyCell, Card } from 'flowbite-svelte';
    import ConfirmModal from './ConfirmModal.svelte';
    import { UserEditOutline, TrashBinOutline } from 'flowbite-svelte-icons';
    import { goto } from '$app/navigation';
    import api from '$lib/api';
    import type { ApiResponse } from '$lib/api';
    import { onMount } from 'svelte';
    import type { Autores } from '$lib/models/Autores';
  
    let autores: Autores[] = [];
    let loading = true;
    let error = '';
    let deletingId: number | null = null;
    let confirmOpen = false;
    let confirmTargetId: number | null = null;
    let consulta = '';
  
    // Abre modal de confirmação
    function openConfirm(id: number) {
      confirmTargetId = id;
      confirmOpen = true;
    }
    
    // Fecha modal
    function closeConfirm() {
      confirmOpen = false;
      confirmTargetId = null;
    }
  
    // Confirma remoção
    function handleConfirm() {
      if (confirmTargetId !== null) {
        handleDelete(confirmTargetId);
      }
      closeConfirm();
    }
  
    // Cancela remoção
    function handleCancel() {
      closeConfirm();
    }
  
    async function handleDelete(id: number) {
      deletingId = id;
      error = '';
      try {
        const res = await api.delete(`/autores/${id}`);
        const body = res.data as ApiResponse<null>;
        if (!body.success) {
          error = body.message;
          return;
        }
        autores = autores.filter(autor => autor.id !== id);
      } catch (e: any) {
        console.error('Erro ao deletar autor:', e);
        const body = e.response?.data as ApiResponse<null> | undefined;
        error = body?.message || 'Erro ao remover autor.';
      } finally {
        deletingId = null;
      }
    }
  
    onMount(async () => {
      try {
        const res = await api.get('/autores');
        const body = res.data as ApiResponse<Autores[]>;
        if (body.success) {
          autores = body.data ?? [];
        } else {
          error = body.message;
        }
      } catch (e: any) {
        console.error('Erro ao carregar autores:', e);
        const body = e.response?.data as ApiResponse<Autores[]> | undefined;
        error = body?.message || 'Erro ao carregar autores';
      } finally {
        loading = false;
      }
    });

    async function filtrarAutores() {
      try {
        const res = await api.get(`/autores?consulta=${encodeURIComponent(consulta)}`);
        const body = res.data as ApiResponse<Autores[]>;
        if (body.success) {
          autores = body.data ?? [];
        } else {
          error = body.message;
        }
      } catch (e: any) {
        console.error('Erro ao carregar autores:', e);
        const body = e.response?.data as ApiResponse<Autores[]> | undefined;
        error = body?.message || 'Erro ao carregar autores';
      } finally {
        loading = false;
      }
    }
</script>

{#if loading}
  <div class="my-8 text-center text-gray-500">Carregando autores...</div>
{:else if error}
  <div class="my-8 text-center text-red-500">{error}</div>
{:else}
  <div class="">
    <input 
      type="text" 
      id="pesquisa" 
      bind:value={consulta} 
      on:input={filtrarAutores} 
      placeholder="Busca por autores"
      class="w-full p-2 border border-gray-300 rounded-lg mb-4"
    />
  </div>
  
  <!-- Tabela para telas médias/grandes -->
  <div class="hidden xl:block">
    <Table class="w-full max-w-5xl mx-auto my-8 shadow-lg border border-gray-200 rounded-lg">
      <TableHead>
        <TableHeadCell class="w-16">ID</TableHeadCell>
        <TableHeadCell class="w-32">Nome</TableHeadCell>
        <TableHeadCell class="w-32">Pseudônimo</TableHeadCell>
        <TableHeadCell class="w-24"></TableHeadCell>
      </TableHead>
      <TableBody>
        {#each autores as autor}
          <TableBodyRow>
            <TableBodyCell>{autor.id}</TableBodyCell>
            <TableBodyCell>{autor.nome}</TableBodyCell>
            <TableBodyCell>{autor.pseunonimo || '-'}</TableBodyCell>
            <TableBodyCell>
              <!-- Botão editar -->
              <button
                class="p-2 rounded border border-primary-200 hover:border-primary-400 transition bg-transparent"
                title="Editar"
                on:click={() => goto(`/autores/edit/${autor.id}`)}
              >
                <UserEditOutline class="w-5 h-5 text-primary-500" />
              </button>
              <!-- Botão remover -->
              <button
                title="Remover"
                class="p-2 rounded border border-red-100 hover:border-red-300 transition bg-transparent"
                on:click={() => openConfirm(autor.id)}
                disabled={deletingId === autor.id || loading}
              >
                <TrashBinOutline class="w-5 h-5 text-red-400" />
              </button>
            </TableBodyCell>
          </TableBodyRow>
        {/each}
      </TableBody>
    </Table>
  </div>

  <!-- Cards para telas pequenas -->
  <div class="block xl:hidden">
    <div class="flex flex-col items-center gap-4 my-8 max-w-3xl mx-auto md:grid md:grid-cols-2">
      {#each autores as autor}
        <Card class="max-w-sm w-full p-0 overflow-hidden shadow-lg border border-blue-200">
          <div class="px-4 pt-4 pb-2 bg-blue-100 text-left flex items-center justify-between">
            <div>
              <div class="text-lg font-semibold text-gray-800 text-left">{autor.nome}</div>
              <div class="text-xs text-gray-400 text-left">ID: {autor.id}</div>
            </div>
            <div class="flex gap-2">
              <!-- Botão editar -->
              <button
                class="p-2 rounded border border-primary-200 hover:border-primary-400 transition bg-transparent"
                title="Editar"
                on:click={() => goto(`/autores/edit/${autor.id}`)}
              >
                <UserEditOutline class="w-5 h-5 text-primary-500" />
              </button>
              <!-- Botão remover -->
              <button
                title="Remover"
                class="p-2 rounded border border-red-100 hover:border-red-300 transition bg-transparent"
                on:click={() => openConfirm(autor.id)}
                disabled={deletingId === autor.id || loading}
              >
                <TrashBinOutline class="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
          <div class="px-4 pb-4 pt-2 flex flex-col gap-2 text-left">
            <div class="text-gray-700 text-sm">
              <strong>Pseudônimo:</strong> {autor.pseunonimo || '-'}
            </div>
          </div>
        </Card>
      {/each}
    </div>
  </div>
{/if}

<!-- Modal de confirmação -->
<ConfirmModal
  open={confirmOpen}
  message="Tem certeza que deseja remover este autor?"
  confirmText="Remover"
  cancelText="Cancelar"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
/>
