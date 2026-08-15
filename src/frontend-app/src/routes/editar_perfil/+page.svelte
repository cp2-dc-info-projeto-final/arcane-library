<script lang="ts">
    // Importa o componente de formulário de usuário
    import UserForm from '../../components/UserForm.svelte';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';
    import api from '$lib/api'; // API backend
	  import type { User } from '$lib/models/User';
    import { onMount } from 'svelte'; // ciclo de vida
    import type { ApiFieldError, ApiResponse } from '$lib/api';
  
    // Captura o parâmetro 'id' da URL
    let { id } = get(page).params;
    let error = null;
    let loading = false;

    onMount(async () => {
    if (id === null) {
      try {
        const res = await api.get(`/users/me`);
        const body = res.data as ApiResponse<User>;
        if (body.success && body.data) {
           // não carrega senha na edição
          console.log(body);
          id = String(body.data.id);
        } else {
          error = body.message;
        }
      } catch (e: any) {
        const body = e.response?.data as ApiResponse<User> | undefined;
        error = body?.message || 'Erro ao carregar usuário.';
      } finally {
        loading = false;
      }
    } 
  });

  </script>
  
  <!-- Utiliza o componente UserForm passando id -->

  {#if loading === false}
    <UserForm me='true' id={Number(id)} />
  {/if}