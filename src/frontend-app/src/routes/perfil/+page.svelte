
<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { getCurrentUser, type User } from '$lib/auth';
    import api from '$lib/api';
    import type { ApiResponse } from '$lib/api';
  
    import {
      UserCircleOutline,
      EditOutline,
      ArrowLeftOutline
    } from 'flowbite-svelte-icons';
  
    type Perfil = {
      id: number;
      login: string;
      foto?: string | null;
      biografia?: string | null;
      cor_biografia?: string | null;
    };
  
    let perfil: Perfil | null = $state(null);
    let usuarioLogado: User | null = $state(null);
    let loading = $state(true);
    let error = $state('');
  
    let idPerfil = $derived(page.params.id);
  
    let podeEditar = $derived(
      !!perfil &&
      !!usuarioLogado &&
      (
        Number(usuarioLogado.id) === Number(perfil.id) ||
        usuarioLogado.role === 'admin'
      )
    );
  
    onMount(() => {
      carregarPerfil();
    });
  
    async function carregarPerfil() {
      loading = true;
      error = '';
  
      try {
        usuarioLogado = await getCurrentUser();
  
        if (!usuarioLogado) {
          await goto('/login');
          return;
        }
  
        const response = await api.get(`/users/public/${idPerfil}`);
        const body = response.data as ApiResponse<Perfil>;
  
        if (!body.success || !body.data) {
          error = body.message || 'Perfil não encontrado.';
          return;
        }
  
        perfil = body.data;
      } catch (e: any) {
        console.error('Erro ao carregar perfil:', e);
  
        error =
          e.response?.data?.message ||
          'Não foi possível carregar este perfil.';
      } finally {
        loading = false;
      }
    }
  
    function editarPerfil() {
      if (!perfil || !podeEditar) return;
  
      if (Number(usuarioLogado?.id) === Number(perfil.id)) {
        goto('/editar_perfil');
      } else if (usuarioLogado?.role === 'admin') {
        goto(`/users/edit/${perfil.id}`);
      }
    }
  
    function fotoUrl(foto?: string | null) {
      if (!foto) return '';
  
      if (foto.startsWith('http')) {
        return foto;
      }
  
      return `http://localhost:3000/uploads/${foto}`;
    }
  </script>
  
  <svelte:head>
    <title>
      {perfil ? `${perfil.login} | Arcane Library` : 'Perfil | Arcane Library'}
    </title>
  
    <meta
      name="description"
      content="Perfil público de usuário da Arcane Library."
    />
  </svelte:head>
  
  <main class="profile-page">
    <div class="profile-container">
  
      <button class="back-button" onclick={() => goto('/livro_users')}>
        <ArrowLeftOutline class="h-5 w-5" />
        Voltar
      </button>
  
      {#if loading}
        <div class="message">
          <span class="loading-spinner"></span>
          Carregando perfil...
        </div>
  
      {:else if error}
        <div class="error-message">
          {error}
        </div>
  
      {:else if perfil}
        <section class="profile-card">
  
          <div class="profile-banner"></div>
  
          <div class="profile-content">
  
            {#if podeEditar}
              <button
                class="edit-button"
                onclick={editarPerfil}
                aria-label="Editar perfil"
                title="Editar perfil"
              >
                <EditOutline class="h-5 w-5" />
              </button>
            {/if}
  
            <div class="avatar">
              {#if perfil.foto}
                <img
                  src={fotoUrl(perfil.foto)}
                  alt={`Foto de ${perfil.login}`}
                />
              {:else}
                <UserCircleOutline class="h-24 w-24" />
              {/if}
            </div>
  
            <h1>{perfil.login}</h1>
  
            <div class="bio-section">
              <h2>Sobre mim</h2>
  
              <p
                class="biography"
                style={`color: ${perfil.cor_biografia || '#000000'}`}
              >
                {perfil.biografia || 'Este usuário ainda não adicionou uma biografia.'}
              </p>
            </div>
  
          </div>
        </section>
      {/if}
  
    </div>
  </main>
  
  <style>
    .profile-page {
      min-height: 100vh;
      padding: 7rem 1.25rem 4rem;
      background:
        radial-gradient(ellipse at 10% 5%, rgb(168 85 247 / 0.12), transparent 42%),
        radial-gradient(ellipse at 90% 40%, rgb(139 92 246 / 0.09), transparent 38%),
        var(--color-page-background, transparent);
    }
  
    .profile-container {
      width: 100%;
      max-width: 850px;
      margin: 0 auto;
    }
  
    .back-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      color: #7e22ce;
      font-weight: 600;
      cursor: pointer;
    }
  
    .profile-card {
      position: relative;
      overflow: hidden;
      border: 1px solid rgb(168 85 247 / 0.2);
      border-radius: 1.5rem;
      background: white;
      box-shadow: 0 15px 40px rgb(0 0 0 / 0.07);
    }
  
    .profile-banner {
      height: 160px;
      background: linear-gradient(120deg, #581c87, #6d28d9, #9333ea);
    }
  
    .profile-content {
      position: relative;
      padding: 0 2rem 2.5rem;
      text-align: center;
    }
  
    .avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 140px;
      height: 140px;
      margin: -70px auto 1rem;
      overflow: hidden;
      border: 5px solid white;
      border-radius: 50%;
      background: #f3e8ff;
      color: #9333ea;
    }
  
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  
    h1 {
      margin: 0.5rem 0 2rem;
      color: #1f2937;
      font-size: 1.8rem;
      font-weight: 800;
    }
  
    .bio-section {
      padding: 1.5rem;
      border: 1px solid #e9d5ff;
      border-radius: 1rem;
      background: #faf5ff;
      text-align: left;
    }
  
    .bio-section h2 {
      margin-bottom: 0.75rem;
      color: #6b21a8;
      font-size: 1rem;
      font-weight: 800;
    }
  
    .biography {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font-size: 1rem;
      line-height: 1.8;
    }
  
    .edit-button {
      position: absolute;
      top: 1rem;
      right: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: white;
      color: #7e22ce;
      box-shadow: 0 3px 12px rgb(0 0 0 / 0.15);
      cursor: pointer;
    }
  
    .edit-button:hover {
      background: #f3e8ff;
    }
  
    .message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 3rem;
    }
  
    .error-message {
      padding: 1.5rem;
      border-radius: 1rem;
      background: #fee2e2;
      color: #991b1b;
    }
  
    .loading-spinner {
      width: 22px;
      height: 22px;
      border: 3px solid #e9d5ff;
      border-top-color: #7e22ce;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
  
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  
    :global(.dark) .profile-card {
      border-color: rgb(168 85 247 / 0.3);
      background: #1f2937;
    }
  
    :global(.dark) h1 {
      color: white;
    }
  
    :global(.dark) .avatar {
      border-color: #1f2937;
      background: #374151;
    }
  
    :global(.dark) .bio-section {
      border-color: #4c1d95;
      background: #312e41;
    }
  
    :global(.dark) .bio-section h2 {
      color: #d8b4fe;
    }
  
    @media (max-width: 600px) {
      .profile-content {
        padding: 0 1rem 1.5rem;
      }
  
      .profile-banner {
        height: 120px;
      }
  
      .avatar {
        width: 120px;
        height: 120px;
        margin-top: -60px;
      }
    }
  </style>
  