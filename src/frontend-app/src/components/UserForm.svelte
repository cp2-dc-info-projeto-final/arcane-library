<script lang="ts">
   import { Card, Button, Label, Input, Heading, Select, Modal, Alert } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import api from '$lib/api';
  import type { ApiFieldError, ApiResponse } from '$lib/api';
  import { goto } from '$app/navigation';
  import { ArrowLeftOutline, FloppyDiskAltOutline } from 'flowbite-svelte-icons';
  import type { User, UserFormData } from '$lib/models/User';
  import { getToken } from "$lib/auth";
  import { themeStore, themes, type Season } from '$lib/themeStore';

  export let id: number | null = null;
  export let me: string = 'false';

  let user: UserFormData = { id: 0, foto: '', login: '', cpf: '', telefone: '', datanasc: '', email: '', senha: '', role: 'cliente' };

  const roleOptions = [
    { value: 'cliente', name: 'Cliente' },
    { value: 'admin', name: 'Administrador' }
  ];

  let fotoPerfil = '';
  let abrirModalFoto = false;

  let loading = false;
  let error = '';
  let fieldErrors: ApiFieldError[] = [];
  let hasToken = false;
  let confirmarSenha = '';
  let currentTheme: Season = 'spring';

 themeStore.subscribe((theme) => {
  currentTheme = theme;
});

  // 🔥 NOVO: guarda arquivo real da imagem
  let fotoFile: File | null = null;

  function errorOf(field: string): string | null {
    return fieldErrors.find((item) => item.field === field)?.message ?? null;
  }


  onMount(async () => {
    if (id !== null) {
      loading = true;
      try {
        let targetRoute = '';

        if (me === 'true') {
          targetRoute = '/users/me';
        } else {
          targetRoute = `/users/${id}`;
        }

        const res = await api.get(targetRoute);
        const body = res.data as ApiResponse<User>;
        if (body && body.success && body.data) {
          user = { ...body.data, senha: '' };
          fotoPerfil = user.foto || '';
        } else {
          error = body?.message || 'Erro ao carregar usuário.';
        }

      } catch (e: any) {
        const body = e.response?.data as ApiResponse<User> | undefined;
        error = body?.message || 'Erro ao carregar usuário.';
      } finally {
        loading = false;
      }
    }
  });

  async function handleSubmit() {
    fieldErrors = [];

    if (id === null && (!user.senha || user.senha.length < 6)) {
      fieldErrors = [{ field: 'senha', message: 'Senha deve ter pelo menos 6 caracteres.' }];
      error = 'Senha inválida';
      return;
    }

    if (user.senha !== confirmarSenha) {
      fieldErrors = [{ field: 'senha', message: 'Senhas precisam ser iguais!' }];
      error = 'Senhas não conferem';
      return;
    }

    loading = true;
    error = '';

    try {
      let targetRoute = '';

      if (me === 'true') {
        targetRoute = '/users/me';
      } else {
        targetRoute = id === null ? '/users' : `/users/${id}`;
      }

      const formData = new FormData();

      
      formData.append('login', user.login);
      formData.append('cpf', user.cpf);
      formData.append('telefone', user.telefone);
      formData.append('datanasc', user.datanasc);
      formData.append('email', user.email);
      formData.append('role', user.role);

      if (user.senha) {
        formData.append('senha', user.senha);
      }

      // 🔥 arquivo real (NÃO base64)
      if (fotoFile) {
        formData.append('foto', fotoFile);
      }

      let res;

      if (id === null) {
        res = await api.post('/users', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.put(targetRoute, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      const body = res.data as ApiResponse<User>;

      if (!body?.success) {
        error = body?.message || 'Erro ao salvar usuário.';
        fieldErrors = body?.errors || [];
        return;
      }

      goto('/users');

    } catch (e: any) {
      error = e.response?.data?.message || 'Erro ao salvar usuário.';
      fieldErrors = e.response?.data?.errors || [];
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    goto('/users');
  }

  function verificaUser() {
    hasToken = getToken() !== null;
  }

  void verificaUser();

  let errosCustomizados: any = {};

  function aplicarMascara(valor: string) {
    const digitos = valor.replace(/\D/g, '').slice(0, 11);

    return digitos
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  function validarCPF(cpf: string) {
    const limpo = cpf.replace(/\D/g, '');

    if (limpo.length !== 11 || /^(\d)\1+$/.test(limpo)) return false;

    let soma = 0;

    for (let i = 1; i <= 9; i++) {
      soma += parseInt(limpo.substring(i - 1, i)) * (11 - i);
    }

    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;

    if (resto !== parseInt(limpo.substring(9, 10))) return false;

    soma = 0;

    for (let i = 1; i <= 10; i++) {
      soma += parseInt(limpo.substring(i - 1, i)) * (12 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;

    return resto === parseInt(limpo.substring(10, 11));
  }

  $: if (user.cpf) {
    const cpfFormatado = aplicarMascara(user.cpf);

    if (cpfFormatado !== user.cpf) {
      user.cpf = cpfFormatado;
    }

    const apenasNumeros = cpfFormatado.replace(/\D/g, '');

    if (apenasNumeros.length === 11) {
      errosCustomizados['cpf'] = validarCPF(apenasNumeros) ? '' : 'CPF inválido';
    } else {
      errosCustomizados['cpf'] = 'O CPF deve conter 11 dígitos';
    }
  } else {
    errosCustomizados['cpf'] = '';
  }

  function aplicarTelefone(tele: any) {
    let telefone = tele.target.value;

    telefone = telefone.replace(/\D/g, '');
    telefone = telefone.substring(0, 11);

    telefone = telefone.replace(/^(\d{2})(\d)/g, '($1) $2');
    telefone = telefone.replace(/(\d)(\d{4})$/, '$1-$2');

    tele.target.value = telefone;
    user.telefone = telefone;
  }

  let datanasc = "";
  const dataMin = '1909-08-21';
  const hoje = new Date().toISOString().split('T')[0];

  function selecionarFoto(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) return;

    const file = input.files[0];

    fotoFile = file;

    const reader = new FileReader();

    reader.onload = (e) => {
      fotoPerfil = e.target?.result as string;
    };

    reader.readAsDataURL(file);

    abrirModalFoto = false;
  }
  
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

    <!-- Foto de Perfil -->
<div class="flex justify-center">
  <button
    type="button"
    class="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-300 hover:border-blue-500 transition"
    on:click={() => (abrirModalFoto = true)}
  >
    {#if fotoPerfil}
      <img
        src={fotoPerfil}
        alt="Foto de perfil"
        class="w-full h-full object-cover"
      />
    {:else}
      <div
        class="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500"
      >
        Foto
      </div>
    {/if}
  </button>
</div>

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
    
    <!-- Campo datanasc -->
    <div>
      <Label for="datanasc">Data de nascimento</Label>
      <Input id="datanasc"
      type="date" 
      bind:value={user.datanasc} 
      placeholder="00/00/0000" 
      required class="mt-1"
      maxlenght="10"
      min={dataMin}
      max={hoje}
      />
      {#if errorOf('datanasc')}
          <div class="mt-1 text-sm text-red-500">{errorOf('datanasc')}</div>
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
<Modal bind:open={abrirModalFoto} size="sm" autoclose>
  <div class="p-6 flex flex-col items-center gap-4">
    <h3 class="text-lg font-semibold">
      Selecione uma foto de perfil
    </h3>

    <input
      type="file"
      accept="image/*"
      on:change={selecionarFoto}
      class="block w-full text-sm text-gray-500"
    />

    {#if fotoPerfil}
      <img
        src={fotoPerfil}
        alt="Pré-visualização"
        class="w-32 h-32 rounded-full object-cover border"
      />
    {/if}
  </div>
</Modal>