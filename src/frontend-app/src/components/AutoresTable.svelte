<script lang="ts">
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
<!-- BUSCA -->
<div class="w-full max-w-6xl mx-auto px-4 mb-6">
  <input 
    type="text" 
    id="pesquisa" 
    bind:value={consulta} 
    on:input={filtrarAutores} 
    placeholder="Busca por autores"
    class="w-full p-2 text-sm border border-gray-300 rounded-lg"
  />
</div>

<!-- LISTA VERTICAL DE CARDS (centralizada) -->
<div class="w-full max-w-6xl mx-auto px-4">
  <!-- Contêiner centralizado -->
  <div class="w-full max-w-2xl mx-auto my-8">
    <!-- Lista vertical centralizada -->
    <div class="flex flex-col items-center gap-4">
      {#each autores as autor}
        <!-- Card de autor -->
        <div class="w-full max-w-md p-0 overflow-hidden shadow-lg border border-green-200 rounded-lg bg-white">
          <!-- Cabeçalho -->
          <div class="px-4 pt-4 pb-2 bg-green-100 text-left flex items-center justify-between">
            <div class="min-w-0">
              <div class="text-base font-semibold text-gray-800 truncate">
                {autor.nome}
              </div>
              <div class="text-xs text-gray-400">
                ID: {autor.id}
              </div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <!-- Botão editar -->
              <button
                class="p-2 rounded border border-primary-200 hover:border-primary-400 transition bg-transparent"
                title="Editar"
                on:click={() => goto(`/autores/edit/${autor.id}`)}
              >
                <UserEditOutline class="w-4 h-4 text-primary-500" />
              </button>
              <!-- Botão remover -->
              <button
                title="Remover"
                class="p-2 rounded border border-red-100 hover:border-red-300 transition bg-transparent"
                on:click={() => openConfirm(autor.id)}
                disabled={deletingId === autor.id || loading}
              >
                <TrashBinOutline class="w-4 h-4 text-red-400" />
              </button>
            </div>
          </div>

          <!-- Corpo -->
          <div class="px-4 pb-3 pt-2 flex flex-col gap-1.5 text-left">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z"/>
              </svg>
              <span class="text-gray-700 text-sm">
                <strong>Pseudônimo:</strong> {autor.pseunonimo || '-'}
              </span>
            </div>
          </div>
        </div>
      {/each}
    </div>
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