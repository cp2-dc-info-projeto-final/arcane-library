<script lang="ts">
  import { Heading } from 'flowbite-svelte';
  import CategoriasTable from '../../components/CategoriasTable.svelte';
  import { UserAddOutline } from 'flowbite-svelte-icons';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { getCurrentUser } from '$lib/auth';

  let checkingAccess = true;
  let canView = false;

  onMount(async () => {
    const user = await getCurrentUser();

    if (!user) {
      await goto('/login');
      return;
    }

    if (user.role !== 'admin') {
      await goto('/');
      return;
    }

    canView = true;
    checkingAccess = false;
  });
</script>

<svelte:head>
  <title>Categorias | Arcane Library</title>
</svelte:head>

{#if checkingAccess}
  <div class="loading">
    Verificando acesso...
  </div>
{:else if canView}
  <main class="categories-page">
    <div class="categories-wrapper">

      <!-- CABEÇALHO CENTRALIZADO -->
      <header class="categories-header">
        <Heading
          tag="h2"
          class="page-title text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white"
        >
          Categorias
        </Heading>

        <button
          type="button"
          class="add-button"
          onclick={() => goto('/categorias/new')}
        >
          <UserAddOutline class="w-5 h-5" />
          <span>Adicionar</span>
        </button>
      </header>

      <!-- TABELA -->
      <section class="categories-table">
        <CategoriasTable />
      </section>

    </div>
  </main>
{/if}

<style>
  .categories-page {
    width: 100%;
    min-height: calc(100vh - 80px);
    box-sizing: border-box;
    padding: 40px 24px 64px;
  }

  .categories-wrapper {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
    box-sizing: border-box;
  }

  .categories-header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 auto 30px;
    gap: 20px;
  }

  .page-title {
    margin: 0;
    text-align: left;
  }

  .add-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 11px 18px;
    flex-shrink: 0;
    color: white;
    font-weight: 700;
    background: #b58b3e;
    border: 1px solid #b58b3e;
    border-radius: 9px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .add-button:hover {
    background: #98702e;
  }

  .categories-table {
    width: 100%;
    min-width: 0;
  }

  .loading {
    width: 100%;
    padding: 80px 24px;
    text-align: center;
    color: #6b7280;
  }

  @media (max-width: 640px) {
    .categories-page {
      padding: 32px 16px 48px;
    }

    .categories-header {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>