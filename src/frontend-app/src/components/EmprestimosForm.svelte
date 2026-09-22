<script lang="ts">
  import { Card, Button, Label, Input, Heading } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import api from '$lib/api';
  import type { ApiFieldError, ApiResponse } from '$lib/api';
  import { goto } from '$app/navigation';
  import { ArrowLeftOutline, FloppyDiskAltOutline } from 'flowbite-svelte-icons';
  import type { Emprestimos, EmprestimosFormData } from '$lib/models/Emprestimos';
  import type { User } from '$lib/models/User';
  import type { Livro } from '$lib/models/Livros';
  import { getToken } from '$lib/auth';

  export let id: number | null = null;

  let emprestimos: EmprestimosFormData = {
    id: 0,
    id_usuario: 0,
    id_livro: 0,
    data_de_emprestimo: '',
    data_fim_emprestimo: '',
    status_emprestimo: 'ativo'
  };

  let users: User[] = [];
  let pesquisaUser = '';
  let userSelecionado: User | null = null;

  let livros: Livro[] = [];
  let pesquisaLivro = '';
  let livroSelecionado: Livro | null = null;

  let loading = false;
  let error = '';
  let fieldErrors: ApiFieldError[] = [];
  let hasToken = false;

  function errorOf(field: string): string | null {
    return fieldErrors.find((item) => item.field === field)?.message ?? null;
  }

  function formatDateTimeLocal(value: string | null | undefined): string {
    if (!value) return '';

    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    

    return `${year}-${month}-${day}`;
  }

  $: usersFiltrados = users.filter((user) => {
    const pesquisa = pesquisaUser.toLowerCase().trim();

    if (!pesquisa) {
      return true;
    }

    return (
      user.login?.toLowerCase().includes(pesquisa) ||
      user.email?.toLowerCase().includes(pesquisa)
    );
  });

  $: livrosFiltrados = livros.filter((livro) => {
    const pesquisa = pesquisaLivro.toLowerCase().trim();

    if (!pesquisa) {
      return true;
    }

    return livro.titulo?.toLowerCase().includes(pesquisa);
  });

  function selecionarUser(user: User) {
    const idUser = Number(user.id);

    if (!Number.isInteger(idUser) || idUser <= 0) {
      return;
    }

    userSelecionado = user;
    emprestimos.id_usuario = idUser;
    pesquisaUser = user.login;
  }

  function limparUser() {
    userSelecionado = null;
    pesquisaUser = '';
    emprestimos.id_usuario = 0;
  }

  function selecionarLivro(livro: Livro) {
    const idLivro = Number(livro.id);

    if (!Number.isInteger(idLivro) || idLivro <= 0) {
      return;
    }

    livroSelecionado = livro;
    emprestimos.id_livro = idLivro;
    pesquisaLivro = livro.titulo;
  }

  function limparLivro() {
    livroSelecionado = null;
    pesquisaLivro = '';
    emprestimos.id_livro = 0;
  }

  onMount(async () => {
    hasToken = getToken() !== null;

    try {
      const res = await api.get('/users');
      const body = res.data as ApiResponse<User[]>;

      if (body?.success && body.data) {
        users = body.data.map((user) => ({
          ...user,
          id: Number(user.id)
        }));
      }
    } catch (e) {
      console.error('Erro ao carregar usuários:', e);
    }

    try {
      const res = await api.get('/livros');
      const body = res.data as ApiResponse<Livro[]>;

      if (body?.success && body.data) {
        livros = body.data.map((livro) => ({
          ...livro,
          id: Number(livro.id)
        }));
      }
    } catch (e) {
      console.error('Erro ao carregar livros:', e);
    }

    if (id !== null) {
      loading = true;

      try {
        const res = await api.get(`/emprestimos/${id}`);
        const body = res.data as ApiResponse<Emprestimos>;

        if (body?.success && body.data) {
          const emprestimoData = body.data;

          emprestimos = {
            id: Number(emprestimoData.id),
            id_usuario: Number(emprestimoData.id_usuario),
            id_livro: Number(emprestimoData.id_livro),
            data_de_emprestimo: formatDateTimeLocal(
              emprestimoData.data_de_emprestimo
            ),
            data_fim_emprestimo: formatDateTimeLocal(
              emprestimoData.data_fim_emprestimo
            ),
            status_emprestimo: emprestimoData.status_emprestimo
          };

          userSelecionado =
            users.find(
              (user) => Number(user.id) === Number(emprestimoData.id_usuario)
            ) ?? null;

          if (userSelecionado) {
            pesquisaUser = userSelecionado.login;
          } else if (emprestimoData.id_usuario) {
            pesquisaUser = emprestimoData.id_usuario;
          }

          livroSelecionado =
            livros.find(
              (livro) => Number(livro.id) === Number(emprestimoData.id_livro)
            ) ?? null;

          if (livroSelecionado) {
            pesquisaLivro = livroSelecionado.titulo;
          } else if (emprestimoData.id_livro) {
            pesquisaLivro = emprestimoData.id_livro;
          }
        } else {
          error = body?.message || 'Erro ao carregar empréstimo.';
        }
      } catch (e: any) {
        const body = e.response?.data as
          | ApiResponse<Emprestimos>
          | undefined;

        error =
          body?.message ||
          'Erro ao carregar empréstimo.';
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
      if (!emprestimos.id_usuario || emprestimos.id_usuario === 0) {
        error = 'Selecione um usuário.';
        loading = false;
        return;
      }

      if (!emprestimos.id_livro || emprestimos.id_livro === 0) {
        error = 'Selecione um livro.';
        loading = false;
        return;
      }

      if (!emprestimos.data_de_emprestimo) {
        error = 'Informe a data de empréstimo.';
        loading = false;
        return;
      }

      if (
        emprestimos.data_fim_emprestimo &&
        new Date(emprestimos.data_fim_emprestimo) <
        new Date(emprestimos.data_de_emprestimo)
      ) {
        error =
          'A data de fim do empréstimo não pode ser anterior à data de empréstimo.';
        loading = false;
        return;
      }

      if (
        !['ativo', 'devolvido', 'atrasado'].includes(
          emprestimos.status_emprestimo
        )
      ) {
        error = 'Selecione um status válido.';
        loading = false;
        return;
      }

      const dados = {
        id_usuario: Number(emprestimos.id_usuario),
        id_livro: Number(emprestimos.id_livro),
        data_de_emprestimo: emprestimos.data_de_emprestimo,
        data_fim_emprestimo: emprestimos.data_fim_emprestimo || null,
        status_emprestimo: emprestimos.status_emprestimo
      };

      const targetRoute =
        id === null
          ? '/emprestimos'
          : `/emprestimos/${id}`;

      let res;

      if (id === null) {
        res = await api.post(targetRoute, dados);
      } else {
        res = await api.put(targetRoute, dados);
      }

      const body =
        res.data as ApiResponse<Emprestimos>;

      if (!body?.success) {
        error =
          body?.message ||
          'Erro ao salvar empréstimo.';

        fieldErrors =
          body?.errors || [];

        return;
      }

      goto('/emprestimos');
    } catch (e: any) {
      console.error(
        'Erro ao salvar empréstimo:',
        e
      );

      console.error(
        'Resposta do backend:',
        e.response?.data
      );

      error =
        e.response?.data?.message ||
        'Erro ao salvar empréstimo.';

      fieldErrors =
        e.response?.data?.errors ||
        [];
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    goto('/emprestimos');
  }
</script>

<Card class="max-w-2xl mx-auto mt-10 p-0 overflow-hidden shadow-lg border border-gray-200 rounded-lg">
  <form
    class="flex flex-col gap-6 p-6"
    on:submit|preventDefault={handleSubmit}
  >
    <Heading tag="h3" class="mb-2 text-center">
      {id === null ? 'Cadastrar Empréstimo' : 'Editar Empréstimo'}
    </Heading>


{#if error}
  <div class="text-red-500 text-center">
    {error}
  </div>
{/if}

<div>
  <Label for="usuario">
    Usuário
  </Label>

  <Input
    id="usuario"
    bind:value={pesquisaUser}
    placeholder="Pesquisar usuário..."
    class="mt-1"
    disabled={loading}
  />

  {#if pesquisaUser && !userSelecionado}
    <div class="mt-1 border border-gray-300 rounded-lg bg-white max-h-48 overflow-y-auto">
      {#if usersFiltrados.length > 0}
        {#each usersFiltrados as user}
          <button
            type="button"
            class="w-full text-left px-3 py-2 hover:bg-gray-100"
            on:click={() => selecionarUser(user)}
          >
            <div>{user.login}</div>

            {#if user.email}
              <div class="text-sm text-gray-500">
                {user.email}
              </div>
            {/if}
          </button>
        {/each}
      {:else}
        <div class="px-3 py-2 text-gray-500">
          Nenhum usuário encontrado.
        </div>
      {/if}
    </div>
  {/if}

  {#if userSelecionado}
    <div class="mt-2 text-sm text-gray-600">
      Usuário selecionado:
      <strong>{userSelecionado.login}</strong>

      <button
        type="button"
        class="ml-2 text-red-500"
        on:click={limparUser}
      >
        ×
      </button>
    </div>
  {/if}

  {#if errorOf('id_usuario')}
    <div class="mt-1 text-sm text-red-500">
      {errorOf('id_usuario')}
    </div>
  {/if}
</div>

<div>
  <Label for="livro">
    Livro
  </Label>

  <Input
    id="livro"
    bind:value={pesquisaLivro}
    placeholder="Pesquisar livro..."
    class="mt-1"
    disabled={loading}
  />

  {#if pesquisaLivro && !livroSelecionado}
    <div class="mt-1 border border-gray-300 rounded-lg bg-white max-h-48 overflow-y-auto">
      {#if livrosFiltrados.length > 0}
        {#each livrosFiltrados as livro}
          <button
            type="button"
            class="w-full text-left px-3 py-2 hover:bg-gray-100"
            on:click={() => selecionarLivro(livro)}
          >
            <div>{livro.titulo}</div>

            {#if livro.editora}
              <div class="text-sm text-gray-500">
                {livro.editora}
              </div>
            {/if}
          </button>
        {/each}
      {:else}
        <div class="px-3 py-2 text-gray-500">
          Nenhum livro encontrado.
        </div>
      {/if}
    </div>
  {/if}

  {#if livroSelecionado}
    <div class="mt-2 text-sm text-gray-600">
      Livro selecionado:
      <strong>{livroSelecionado.titulo}</strong>

      <button
        type="button"
        class="ml-2 text-red-500"
        on:click={limparLivro}
      >
        ×
      </button>
    </div>
  {/if}

  {#if errorOf('id_livro')}
    <div class="mt-1 text-sm text-red-500">
      {errorOf('id_livro')}
    </div>
  {/if}
</div>

<div>
  <Label for="data_de_emprestimo">
    Data de Empréstimo
  </Label>

  <Input
    id="data_de_emprestimo"
    type="date"
    maxlenght="10"
    bind:value={emprestimos.data_de_emprestimo}
    required
    class="mt-1"
    disabled={loading}
  />

  {#if errorOf('data_de_emprestimo')}
    <div class="mt-1 text-sm text-red-500">
      {errorOf('data_de_emprestimo')}
    </div>
  {/if}
</div>

<div>
  <Label for="data_fim_emprestimo">
    Data de Fim do Empréstimo
  </Label>

  <Input
    id="data_fim_emprestimo"
    type="date"
    maxlenght="10"
    bind:value={emprestimos.data_fim_emprestimo}
    class="mt-1"
    disabled={loading}
  />
</div>


  {#if errorOf('data_fim_emprestimo')}
    <div class="mt-1 text-sm text-red-500">
      {errorOf('data_fim_emprestimo')}
    </div>
  {/if}


<div>
  <Label for="status_emprestimo">
    Status do Empréstimo
  </Label>

  <select
    id="status_emprestimo"
    bind:value={emprestimos.status_emprestimo}
    class="mt-1 block w-full rounded-lg border border-gray-300 bg-white p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
    disabled={loading}
    required
  >
    <option value="ativo">Ativo</option>
    <option value="devolvido">Devolvido</option>
    <option value="atrasado">Atrasado</option>
  </select>

  {#if errorOf('status_emprestimo')}
    <div class="mt-1 text-sm text-red-500">
      {errorOf('status_emprestimo')}
    </div>
  {/if}
</div>

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
