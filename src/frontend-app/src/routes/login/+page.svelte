<script lang="ts">
  import { Card, Button, Input, Label, Alert } from "flowbite-svelte";
  import { goto } from "$app/navigation";
  import { login as authLogin } from "$lib/auth";
  import { themeStore, themes, type Season } from "$lib/themeStore";
  
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

<div class="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
  <!-- Efeito de luz de fundo animada -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
    <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
    <div class="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
  </div>

  <!-- Conteúdo principal -->
  <div class="w-full max-w-sm relative z-10">
    <div class="text-center mb-8">
      <img src="/images/arcaneL.png" alt="Arcane Library Logo" class="w-20 h-20 mx-auto mb-4 drop-shadow-lg" />
      <h1 class="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
        Arcane Library
      </h1>
      <p class="text-purple-200 text-sm">Bem-vindo ao mundo da magia e dos mistérios</p>
    </div>
    
    <Card class="p-8 w-full bg-slate-800 border border-purple-500 border-opacity-30 shadow-2xl backdrop-blur-xl">
      <form on:submit|preventDefault={handleLogin} class="space-y-6">
        <div>
          <Label for="login" class="mb-2 text-purple-100 font-semibold">Login</Label>
          <Input
            id="login"
            type="text"
            bind:value={login}
            placeholder="Digite seu nick"
            class="bg-slate-700 border-purple-500 border-opacity-50 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400"
            required
          />
        </div>

        <div>
          <Label for="password" class="mb-2 text-purple-100 font-semibold">Senha</Label>
          <Input
            id="password"
            type="password"
            bind:value={password}
            placeholder="Digite sua senha"
            class="bg-slate-700 border-purple-500 border-opacity-50 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400"
            required
          />
        </div>

        {#if error}
          <Alert color="red" class="mb-4 bg-red-900 bg-opacity-50 border-red-500 border-opacity-50">
            {error}
          </Alert>
        {/if}

        <Button 
          type="submit"
          class="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50" 
          disabled={loading}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>

        <div class="text-center pt-4 border-t border-purple-500 border-opacity-30">
          <p class="text-gray-300 text-sm mb-2">Não possui conta?</p>
          <a href="/public_user" class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 font-semibold hover:underline transition-all">
            Cadastre-se aqui
          </a>
        </div>
      </form>
    </Card>
  </div>
</div>

<style>
  @keyframes blob {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(30px, -50px) scale(1.1);
    }
    66% {
      transform: translate(-20px, 20px) scale(0.9);
    }
  }

  :global(.animate-blob) {
    animation: blob 7s infinite;
  }

  :global(.animation-delay-2000) {
    animation-delay: 2s;
  }

  :global(.animation-delay-4000) {
    animation-delay: 4s;
  }
</style>
