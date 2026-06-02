<script lang="ts">
  // Formulário de usuário
  import { Card, Button, Label, Input, Heading, Select } from 'flowbite-svelte'; // UI
  import { onMount } from 'svelte'; // ciclo de vida
  import api from '$lib/api'; // API backend
  import type { ApiFieldError, ApiResponse } from '$lib/api';
  import { goto } from '$app/navigation'; // navegação
  import { ArrowLeftOutline, FloppyDiskAltOutline } from 'flowbite-svelte-icons'; // ícones
  import type { User, UserFormData } from '$lib/models/User';
  import { getToken } from "$lib/auth";
  export let id: number | null = null; // id do usuário
  export let me: string = 'false';

  let user: UserFormData = { id: 0, login: '',cpf: '',telefone: '', dataNasc: '',  email: '', senha: '', role: 'cliente' }; // dados do form
  
  // Opções de roles
  const roleOptions = [
    { value: 'cliente', name: 'Cliente' },
    { value: 'admin', name: 'Administrador' }
  ];
  
  let loading = false;
  let error = '';
  let fieldErrors: ApiFieldError[] = [];
  let hasToken = false;
  let confirmarSenha = '';
  let senhaVisivel = false;
  let confirmarSenhaVisivel = false;
  let falaManu = true;
  //let dataFormatada = '';

  function errorOf(field: string): string | null {
    return fieldErrors.find((item) => item.field === field)?.message ?? null;
  }

  // Carrega usuário se for edição
  onMount(async () => {
    if (id !== null) {
      loading = true;
      try {
        let targetRoute = ''
        if (me === 'true') {
          targetRoute = '/users/me'
        } else  {
          targetRoute = `/users/${id}`
        }
        const res = await api.get(targetRoute);
        const body = res.data as ApiResponse<User>;
        if (body.success && body.data) {
          user = { ...body.data, senha: '' }; // não carrega senha na edição
          console.log(user);
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

  
  // Submissão do formulário
  async function handleSubmit() {
    fieldErrors = [];

    // Validação de senha
    if (id === null && (!user.senha || user.senha.length < 6)) {
      fieldErrors = [{ field: 'senha', message: 'Senha deve ter pelo menos 6 caracteres.' }];
      error = 'Senha deve ter pelo menos 6 caracteres.';
      return;
    }
    
    if (user.senha !== confirmarSenha) {
      fieldErrors = [{ field: 'senha', message: 'Senhas precisam ser iguais!' }];
      error = 'Senhas precisam ser iguais!';
      return;
    }
  
    loading = true;
    error = '';
    try {
      if (id === null) {
        const res = await api.post('/users', user);
        const body = res.data as ApiResponse<User>;
        if (!body.success) {
          error = body.message;
          fieldErrors = body.errors;
          return;
        }
      } else {
        let targetRoute = '';
        if (me === 'true') {
          targetRoute = '/users/me'
        } else  {
          targetRoute = `/users/${id}`
        }
        console.log('FALAMANUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU')
        const res = await api.put(targetRoute, user);

        const body = res.data as ApiResponse<User>;
        if (!body.success) {
          error = body.message;
          fieldErrors = body.errors;
          return;
        }
      }
      goto('/users');
    } catch (e: any) {
      const body = e.response?.data as ApiResponse<User> | undefined;
      error = body?.message || 'Erro ao salvar usuário.';
      fieldErrors = body?.errors || [];
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    goto('/users');
  }
  void verificaUser();
  async function verificaUser() {
    hasToken = getToken() !== null;
    console.log('SIIIIIIIIIIXSEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEVEN')
  }

  
  let errosCustomizados = {};   

  // 1. Função de Máscara Automática
  function aplicarMascara(valor) {
    const digitos = valor.replace(/\D/g, '').slice(0, 11);
    return digitos
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  // 2. Algoritmo de Validação Matemática (Módulo 11)
  function validarCPF(cpf) {
    const limpo = cpf.replace(/\D/g, '');
    if (limpo.length !== 11 || /^(\d)\1+$/.test(limpo)) return false;
    
    let soma = 0;
    for (let i = 1; i <= 9; i++) soma += parseInt(limpo.substring(i - 1, i)) * (11 - i);
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(limpo.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(limpo.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(limpo.substring(10, 11));
  }

  // 3. CONSTRUÇÃO AUTOMÁTICA (Reatividade Nativa do Svelte)
  // Roda automaticamente a cada caractere digitado no input
  $: if (user.cpf) {
    // Aplica os pontos e hífen na tela
    user.cpf = aplicarMascara(user.cpf); 
    
    const apenasNumeros = user.cpf.replace(/\D/g, '');
    
    // Atualiza a mensagem de erro em tempo real
    if (apenasNumeros.length === 11) {
      errosCustomizados['cpf'] = validarCPF(apenasNumeros) ? '' : 'CPF inválido';
    } else {errorOf
      errosCustomizados['cpf'] = 'O CPF deve conter 11 dígitos';
    }
  } else {
    errosCustomizados['cpf'] = '';
  }

  let telefone = '';

  function aplicarTelefone(tele) {
    let telefone = tele.target.value;
    
    // Remove tudo que não é número
    telefone = telefone.replace(/\D/g, '');
    
    // Limita em 11 dígitos (DDD + 9 dígitos)
    telefone = telefone.substring(0, 11);
    
    // Aplica a máscara
    telefone = telefone.replace(/^(\d{2})(\d)/g, '($1) $2');
    telefone = telefone.replace(/(\d)(\d{4})$/, '$1-$2');
    
    // Atualiza a variável e o input
    telefone = telefone;
    tele.target.value = telefone;
  }
  let dataNasc = ''
  const dataMin ='21-08-1909' // data de nascimento da pessoa mais velha ethel caterham
  const hoje = new Date().toISOString().split('T')[0];
  
</script>

<!-- Card do formulário -->
<Card class="max-w-md mx-auto mt-10 p-0 overflow-hidden shadow-lg border border-gray-200 rounded-lg">
  <!-- Formulário principal -->
  <form class="flex flex-col gap-6 p-6" on:submit|preventDefault={handleSubmit}>
    <!-- Título -->
    <Heading tag="h3" class="mb-2 text-center">
      {id === null ? 'Cadastrar Usuário' : 'Editar Usuário'}
    </Heading>
    <!-- Mensagem de erro -->
    {#if error}
      <div class="text-red-500 text-center">{error}</div>
    {/if}
    <!-- Campo login -->
    <div>
      <Label for="login">Login</Label>
      <Input id="login" bind:value={user.login} placeholder="Digite o login" required class="mt-1" />
      {#if errorOf('login')}
        <div class="mt-1 text-sm text-red-500">{errorOf('login')}</div>
      {/if}
    </div>

    <!--Campo cpf-->
 


  <div>
  <Label for="cpf">CPF</Label>
  <Input 
    id="cpf" 
    bind:value={user.cpf} 
    placeholder="000.000.000-00" 
    maxlength="14"
    required 
    class="mt-1 {errorOf('cpf') ? 'border-red-500 focus:ring-red-500' : ''}" 
  />
  
  <!-- Exibe a mensagem gerada automaticamente -->
  {#if errorOf('cpf')}
    <div class="mt-1 text-sm text-red-500">
      {errorOf('cpf')}
    </div>
  {/if}
  </div>

    
    

    <!-- Campo telefone -->
    <div>
    <Label for="telefone">Telefone</Label>
    <Input id="telefone" type="tel" bind:value={user.telefone} placeholder="(XX) XXXXX-XXXX" required class="mt-1" onInput={aplicarTelefone} />
    {#if errorOf('telefone')}
        <div class="mt-1 text-sm text-red-500">{errorOf('telefone')}</div>
      {/if}
    </div>
    
    <!-- Campo dataNasc -->
    <div>
      <Label for="dataNasc">Data de nascimento</Label>
      <Input id="dataNasc"
      type="date" 
      bind:value={user.dataNasc} 
      placeholder="00/00/0000" 
      required class="mt-1"
      maxlenght="10"
      min={dataMin}
      max={hoje}
      />
      {#if errorOf('dataNasc')}
          <div class="mt-1 text-sm text-red-500">{errorOf('dataNasc')}</div>
      {/if}
      
      </div>

    <!-- Campo email -->
    <div>
      <Label for="email">Email</Label>
      <Input id="email" type="email" bind:value={user.email} placeholder="Digite o e-mail" required class="mt-1" />
      {#if errorOf('email')}
        <div class="mt-1 text-sm text-red-500">{errorOf('email')}</div>
      {/if}
    </div>
    <!-- Campo senha -->
    <div>
      <Label for="senha">Senha {id !== null ? '(deixe vazio para manter atual)' : ''}</Label>
      <Input 
        id="senha" 
        type="password" 
        bind:value={user.senha} 
        placeholder={id === null ? 'Digite a senha (mínimo 6 caracteres)' : 'Nova senha (opcional)'} 
        required={id === null}
        minlength={6}
        class="mt-1" 
      />
    
      {#if errorOf('senha')}
        <div class="mt-1 text-sm text-red-500">{errorOf('senha')}</div>
      {/if}
    </div>

    <div>
      <Label for="confirmarSenha">Confirme a Senha</Label>
      <Input 
        id ="confirmarSenha"
        type="password"
        bind:value={confirmarSenha} 
        placeholder={id === null ? 'Confirme sua senha' : 'Confirme sua senha (opcional)'}
        required={id === null}
        minlength={6}
        class="mt-1" 
      />
    </div>

    <!-- Campo role -->
    <div>
        
        {#if hasToken && me !== 'true'}
          <Label for="role">Perfil</Label>
          <Select id="role" bind:value={user.role} items={roleOptions} class="mt-1" />
        {/if}
        

      {#if errorOf('role')}
        <div class="mt-1 text-sm text-red-500">{errorOf('role')}</div>
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