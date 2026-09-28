<script lang="ts">
  import { Card, Button, Input, Label, Alert } from "flowbite-svelte";
  import { goto } from "$app/navigation";
  import { login as authLogin } from "$lib/auth";
  import { themeStore, type Season } from "$lib/themeStore";

  let login = '';
  let password = '';
  let loading = false;
  let error = '';
  let currentTheme: Season = 'spring';

  themeStore.subscribe((theme) => {
    currentTheme = theme;
  });

  async function handleLogin() {
    if (!login || !password) {
      error = 'Por favor, preencha todos os campos';
      return;
    }

    loading = true;
    error = '';

    try {
      const result = await authLogin({ login, password });

      if (result.success) {
        await goto('/');
      } else {
        error = result.message || 'Credenciais inválidas';
      }
    } catch (err) {
      error = 'Erro interno do servidor';
      console.error('Erro no login:', err);
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Login - Arcane Library</title>
</svelte:head>

<!-- FUNDO DA PÁGINA INTEIRA -->
<div
  class="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
  style="background-image: url('/images/arcanelibrary.jpeg.jpeg');"
>
  <div class="absolute inset-0 bg-black/40"></div>
</div>

<!-- CONTEÚDO -->
<div class="relative z-10 min-h-screen w-full flex flex-col items-center justify-center p-4">

  <div class="w-full max-w-sm">

    <!-- Logo -->
    <div class="text-center mb-8">
      <img
        src="/images/arcaneL.png"
        alt="Arcane Library"
        class="w-20 h-20 mx-auto mb-3"
      />

      <h1 class="text-3xl font-bold text-purple-400">
        Arcane Library
      </h1>

      <p class="text-white text-sm mt-2">
        Bem-vindo ao mundo da magia e dos mistérios
      </p>
    </div>

    <!-- Login -->
    <Card class="bg-slate-800/95 border border-slate-700">
      <form on:submit|preventDefault={handleLogin} class="space-y-5">

        {#if error}
          <Alert color="red">
            {error}
          </Alert>
        {/if}

        <div>
          <Label for="login" class="mb-2">
            Login
          </Label>

          <Input
            id="login"
            bind:value={login}
            type="text"
            placeholder="Digite seu login"
            required
          />
        </div>

        <div>
          <Label for="password" class="mb-2">
            Senha
          </Label>

          <Input
            id="password"
            bind:value={password}
            type="password"
            placeholder="Digite sua senha"
            required
          />
        </div>

        <Button
          type="submit"
          class="w-full bg-gradient-to-r from-purple-600 to-pink-600"
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>

        <div class="border-t border-purple-500 pt-4 text-center">
          <p class="text-gray-300 text-sm">
            Não possui conta?
          </p>

          <a
            href="/public_user"
            class="text-purple-400 hover:text-pink-400"
          >
            Cadastre-se aqui
          </a>
        </div>

      </form>
    </Card>

  </div>
</div>

<style>
  :global(html),
  :global(body) {
    margin: 0;
    padding: 0;
    width: 100%;
    min-height: 100%;
  }

  :global(body) {
    overflow-x: hidden;
  }
</style>