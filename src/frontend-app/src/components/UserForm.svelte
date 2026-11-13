<script lang="ts">
  import {
    Card,
    Button,
    Label,
    Input,
    Heading,
    Select,
    Modal,
    Alert
  } from 'flowbite-svelte';

  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import {
    ArrowLeftOutline,
    FloppyDiskAltOutline,
    UserCircleOutline,
    CameraPhotoOutline
  } from 'flowbite-svelte-icons';

  import api from '$lib/api';
  import type { ApiFieldError, ApiResponse } from '$lib/api';
  import type { User, UserFormData } from '$lib/models/User';
  import { getToken } from '$lib/auth';

  type UserWithProfile = User & {
  biografia?: string | null;
  cor_biografia?: string | null;
};

  export let id: number | null = null;
  export let me: string = 'false';

  let user: UserFormData & {
  biografia: string;
  cor_biografia: string;
} = {
  id: 0,
  foto: '',
  login: '',
  cpf: '',
  telefone: '',
  datanasc: '',
  email: '',
  senha: '',
  role: 'cliente',
  biografia: '',
  cor_biografia: '#000000'
};

  const roleOptions = [
  { value: 'cliente', name: 'Cliente' },
  { value: 'bibliotecario', name: 'Bibliotecário' },
  { value: 'admin', name: 'Administrador' }
];

  let fotoPerfil = '';
  let fotoFile: File | null = null;
  let abrirModalFoto = false;

  let loading = false;
  let error = '';
  let fieldErrors: ApiFieldError[] = [];
  let confirmarSenha = '';
  let hasToken = false;
  let errosCustomizados: Record<string, string> = {};

  const dataMin = '1909-08-21';
  const hoje = new Date().toISOString().split('T')[0];

  $: editando = id !== null;
  $: titulo = editando ? 'Editar usuário' : 'Cadastrar usuário';
  $: subtitulo = editando
    ? 'Atualize seus dados com segurança.'
    : 'Preencha seus dados para criar uma conta.';

  function errorOf(field: string): string | null {
    const apiError = fieldErrors.find((item) => item.field === field)?.message;
    return apiError || errosCustomizados[field] || null;
  }

  function limparErroCampo(field: string) {
    fieldErrors = fieldErrors.filter((item) => item.field !== field);
    error = '';
  }

  function aplicarMascara(valor: string): string {
    const digitos = valor.replace(/\D/g, '').slice(0, 11);

    return digitos
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  
function validarCPF(cpf: string): boolean {
  const limpo = cpf.replace(/\D/g, '');

  if (limpo.length !== 11 || /^(\d)\1{10}$/.test(limpo)) {
    return false;
  }

  const calcularDigito = (base: string, pesoInicial: number): number => {
    let soma = 0;

    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (pesoInicial - i);
    }

    const resto = soma % 11;

    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiroDigito = calcularDigito(limpo.substring(0, 9), 10);

  if (primeiroDigito !== Number(limpo[9])) {
    return false;
  }

  const segundoDigito = calcularDigito(limpo.substring(0, 10), 11);

  return segundoDigito === Number(limpo[10]);
}


function atualizarCPF(valor: string) {
  user.cpf = aplicarMascara(valor);
  limparErroCampo('cpf');

  const digitos = user.cpf.replace(/\D/g, '');

  errosCustomizados = {
    ...errosCustomizados,
    cpf: digitos.length > 0 && digitos.length < 11
      ? 'O CPF deve conter 11 dígitos.'
      : ''
  };
}

  function atualizarTelefone(valor: string) {
    let telefone = valor.replace(/\D/g, '').slice(0, 11);

    if (telefone.length > 10) {
      telefone = telefone.replace(/^(\d{2})(\d)/, '($1) $2');
      telefone = telefone.replace(/(\d{5})(\d{4})$/, '$1-$2');
    } else if (telefone.length > 6) {
      telefone = telefone.replace(/^(\d{2})(\d)/, '($1) $2');
      telefone = telefone.replace(/(\d{4})(\d{1,4})$/, '$1-$2');
    } else if (telefone.length > 2) {
      telefone = telefone.replace(/^(\d{2})(\d)/, '($1) $2');
    }

    user.telefone = telefone;
    limparErroCampo('telefone');
  }

  function selecionarFoto(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error = 'Selecione um arquivo de imagem válido.';
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      error = 'A imagem deve ter no máximo 5 MB.';
      input.value = '';
      return;
    }

    fotoFile = file;
    console.log('Arquivo guardado:', fotoFile);
    console.log('Nome:', fotoFile.name);
    console.log('Tipo:', fotoFile.type);
    console.log('Tamanho:', fotoFile.size);
    error = '';

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        fotoPerfil = reader.result;
      }
    };

    reader.onerror = () => {
      error = 'Não foi possível visualizar essa imagem.';
    };

    reader.readAsDataURL(file);
    abrirModalFoto = false;
  }

  onMount(async () => {
    hasToken = getToken() !== null;

    if (id === null && me !== 'true') return;
    
    loading = true;
    error = '';

    try {
      const targetRoute = me === 'true' ? '/users/me' : `/users/${id}`;
      const res = await api.get(targetRoute);
      const body = res.data as ApiResponse<UserWithProfile>;  

      if (body?.success && body.data) {
        user = {
  ...body.data,
  cpf: aplicarMascara(String(body.data.cpf ?? '')),
  senha: '',
  biografia: body.data.biografia ?? '',
  cor_biografia: body.data.cor_biografia ?? '#000000'
};
              fotoPerfil = body.data.foto
              ? `http://localhost:3000/uploads/${body.data.foto}`
              : '';
          errosCustomizados = {
            ...errosCustomizados,
            cpf: ''
          };

      } else {
        error = body?.message || 'Erro ao carregar usuário.';
      }
    } catch (e: any) {
      const body = e.response?.data as ApiResponse<User> | undefined;
      error = body?.message || 'Erro ao carregar usuário.';
    } finally {
      loading = false;
    }
  });

  async function handleSubmit() {
  error = '';
  fieldErrors = [];

  // Sempre valida o valor atual do campo, sem depender
  // de uma mensagem de erro armazenada anteriormente.
  const cpfLimpo = String(user.cpf ?? '').replace(/\D/g, '');

  if (cpfLimpo.length !== 11) {
    errosCustomizados = {
      ...errosCustomizados,
      cpf: 'O CPF deve conter 11 dígitos.'
    };

    error = 'Corrija o CPF antes de continuar.';
    return;
  }

  errosCustomizados = {
    ...errosCustomizados,
    cpf: ''
  };

  if (!editando && user.senha.length < 6) {
    fieldErrors = [
      { field: 'senha', message: 'A senha deve ter pelo menos 6 caracteres.' }
    ];
    error = 'Verifique a senha informada.';
    return;
  }

  if (user.senha && user.senha.length < 6) {
    fieldErrors = [
      { field: 'senha', message: 'A senha deve ter pelo menos 6 caracteres.' }
    ];
    error = 'Verifique a senha informada.';
    return;
  }

  if (user.senha !== confirmarSenha) {
    fieldErrors = [
      { field: 'senha', message: 'As senhas precisam ser iguais.' }
    ];
    error = 'As senhas não conferem.';
    return;
  }

  loading = true;

  try {
    const targetRoute =
      me === 'true'
        ? '/users/me'
        : editando
          ? `/users/${id}`
          : '/users';

    const formData = new FormData();

    formData.append('login', user.login.trim());
    formData.append('cpf', cpfLimpo);
    formData.append('telefone', user.telefone);
    formData.append('datanasc', user.datanasc);
    formData.append('email', user.email.trim());
    formData.append('biografia', user.biografia || '');
    formData.append('cor_biografia', user.cor_biografia || '#000000');

    if (user.senha) {
      formData.append('senha', user.senha);
    }

    if (hasToken && me !== 'true') {
      formData.append('role', user.role);
    }

        if (fotoFile instanceof File) {
      formData.append('foto', fotoFile, fotoFile.name);
    }

    console.log('========== ENVIO DO USUÁRIO ==========');
    console.log('Arquivo selecionado:', fotoFile);
    console.log('Arquivo no FormData:', formData.get('foto'));
    console.log('Todos os campos enviados:');

    formData.forEach((value, key) => {
      console.log(
        key,
        value instanceof File
          ? {
              nome: value.name,
              tipo: value.type,
              tamanho: value.size
            }
          : value
      );
    });

    console.log('======================================');

    const res = editando
      ? await api.put(targetRoute, formData)
      : await api.post('/users', formData);

      const body = res.data as ApiResponse<UserWithProfile>;

    if (!body?.success) {
      error = body?.message || 'Não foi possível salvar o usuário.';
      fieldErrors = body?.errors || [];
      return;
    }

if (editando || me === 'true') {
  const perfilId = body.data?.id ?? user.id ?? id;

  if (perfilId !== null && perfilId !== undefined) {
    await goto(`/perfil/${perfilId}`);
  } else {
    await goto('/users');
  }
} else {
  await goto('/users');
}
  } catch (e: any) {
    const body = e.response?.data as ApiResponse<User> | undefined;

    error = body?.message || 'Erro ao salvar usuário.';
    fieldErrors = body?.errors || [];
  } finally {
    loading = false;
  }
}
function handleCancel() {
  if (loading) return;

  if (editando || me === 'true') {
    const perfilId = id ?? user.id;

    if (perfilId) {
      goto(`/perfil/${perfilId}`);
      return;
    }
  }

  goto('/users');
}
</script>

<svelte:head>
  <title>{titulo} | Arcane Library</title>
  <meta
    name="description"
    content="Formulário de cadastro e edição de usuários da Arcane Library."
  />
</svelte:head>

<main class="user-page">
  <div class="user-form-wrapper">
    <!-- Cabeçalho -->
    <header class="mb-8 text-center">
      <div class="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-300/40 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
        <UserCircleOutline class="h-5 w-5" />
        Área de usuários
      </div>

      <Heading
        tag="h1"
        class="!mb-3 !text-3xl !font-extrabold tracking-tight text-gray-900 dark:text-white sm:!text-4xl"
      >
        {titulo}
      </Heading>

      <p class="text-sm leading-7 text-gray-600 dark:text-gray-400 sm:text-base">
        {subtitulo}
      </p>
    </header>

    <Card class="!w-full !max-w-none !overflow-hidden !rounded-3xl !border !border-purple-200/60 !p-0 !shadow-xl !shadow-purple-950/5 dark:!border-purple-400/20">
      <!-- Faixa superior -->
      <div class="form-banner px-6 py-6 sm:px-9">
        <div class="flex items-center gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white">
            <UserCircleOutline class="h-7 w-7" />
          </div>

          <div>
            <h2 class="text-lg font-bold text-white">
              Seus dados
            </h2>
            <p class="mt-1 text-sm text-purple-100">
              Mantenha suas informações atualizadas.
            </p>
          </div>
        </div>
      </div>

      <form
        class="form-content flex flex-col gap-6 p-5 sm:p-9"
        onsubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        {#if error}
          <Alert color="red" class="rounded-xl">
            <span class="font-medium">{error}</span>
          </Alert>
        {/if}

        {#if loading}
          <div class="flex items-center justify-center gap-3 rounded-xl bg-purple-500/5 p-5 text-sm text-gray-600 dark:text-gray-300">
            <span class="loading-spinner"></span>
            Carregando ou salvando informações...
          </div>
        {/if}

        <!-- Foto -->
        <section class="flex flex-col items-center rounded-2xl border border-dashed border-purple-300/70 bg-purple-500/5 px-4 py-7">
          <p class="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
            Foto de perfil
          </p>

          <button
            type="button"
            class="profile-picture group relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-purple-300 bg-purple-100 shadow-lg transition duration-300 hover:scale-105 hover:border-purple-500 focus:outline-none focus:ring-4 focus:ring-purple-500/30 dark:border-purple-500/60 dark:bg-gray-800"
            onclick={() => (abrirModalFoto = true)}
            aria-label="Selecionar foto de perfil"
            disabled={loading}
          >
            {#if fotoPerfil}
              <img
                src={fotoPerfil}
                alt="Prévia da foto de perfil"
                class="h-full w-full object-cover"
              />
            {:else}
              <UserCircleOutline class="h-20 w-20 text-purple-400 dark:text-purple-300" />
            {/if}

            <span class="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition group-hover:opacity-100">
              <CameraPhotoOutline class="h-8 w-8" />
            </span>
          </button>

          <p class="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
            Clique na foto para alterar · JPG, PNG ou outro formato de imagem · Até 5 MB
          </p>
        </section>

        <!-- Dados pessoais -->
        <section>
          <div class="section-heading">
            <span class="section-number">01</span>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">
              Informações pessoais
            </h3>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <Label for="login" class="field-label">Login</Label>
              <Input
                id="login"
                bind:value={user.login}
                oninput={() => limparErroCampo('login')}
                placeholder="Escolha seu nome de usuário"
                required
                disabled={loading}
                autocomplete="username"
                class="mt-2"
              />
              {#if errorOf('login')}
                <p class="field-error">{errorOf('login')}</p>
              {/if}
            </div>

            <div>
              <Label for="cpf" class="field-label">CPF</Label>
              <Input
                id="cpf"
                value={user.cpf}
                oninput={(event) => atualizarCPF(event.currentTarget.value)}
                placeholder="000.000.000-00"
                maxlength={14}
                inputmode="numeric"
                required
                disabled={loading}
                class="mt-2"
              />
              {#if errorOf('cpf')}
                <p class="field-error">{errorOf('cpf')}</p>
              {/if}
            </div>

            <div>
              <Label for="telefone" class="field-label">Telefone</Label>
              <Input
                id="telefone"
                type="tel"
                value={user.telefone}
                oninput={(event) => atualizarTelefone(event.currentTarget.value)}
                placeholder="(21) 99999-9999"
                required
                disabled={loading}
                autocomplete="tel"
                class="mt-2"
              />
              {#if errorOf('telefone')}
                <p class="field-error">{errorOf('telefone')}</p>
              {/if}
            </div>

            <div>
              <Label for="datanasc" class="field-label">Data de nascimento</Label>
              <Input
                id="datanasc"
                type="date"
                bind:value={user.datanasc}
                min={dataMin}
                max={hoje}
                required
                disabled={loading}
                class="mt-2"
                oninput={() => limparErroCampo('datanasc')}
              />
              {#if errorOf('datanasc')}
                <p class="field-error">{errorOf('datanasc')}</p>
              {/if}
            </div>

            <div>
              <Label for="email" class="field-label">E-mail</Label>
              <Input
                id="email"
                type="email"
                bind:value={user.email}
                oninput={() => limparErroCampo('email')}
                placeholder="voce@exemplo.com"
                required
                disabled={loading}
                autocomplete="email"
                class="mt-2"
              />
              {#if errorOf('email')}
                <p class="field-error">{errorOf('email')}</p>
              {/if}
            </div>
          </div>
        </section>


<!-- Biografia e personalização -->
<section>
  <div class="section-heading">
    <span class="section-number">03</span>
    <h3 class="text-lg font-bold text-gray-900 dark:text-white">
      Biografia do perfil
    </h3>
  </div>

  <div class="flex flex-col gap-5">
    <div>
      <Label for="biografia" class="field-label">
        Sobre mim
      </Label>

      <textarea
        id="biografia"
        bind:value={user.biografia}
        maxlength="500"
        rows="5"
        placeholder="Conte um pouco sobre você, seus gostos e suas leituras..."
        disabled={loading}
        class="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      ></textarea>

      <p class="mt-1 text-right text-xs text-gray-500 dark:text-gray-400">
        {user.biografia.length}/500 caracteres
      </p>
    </div>

    <div class="flex flex-col gap-3 rounded-xl border border-purple-200/60 bg-purple-500/5 p-4 dark:border-purple-400/20 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Label for="cor_biografia" class="field-label">
          Cor do texto da biografia
        </Label>

        <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Escolha a cor que aparecerá na sua página pública.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <input
          id="cor_biografia"
          type="color"
          bind:value={user.cor_biografia}
          disabled={loading}
          class="h-11 w-16 cursor-pointer rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-gray-800"
        />

        <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {user.cor_biografia}
        </span>
      </div>
    </div>

    <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Prévia da biografia
      </p>

      <p
        class="whitespace-pre-wrap break-words text-sm"
        style={`color: ${user.cor_biografia || '#000000'}`}
      >
        {user.biografia || 'Sua biografia aparecerá aqui.'}
      </p>
    </div>
  </div>
</section>


        <!-- Segurança -->
        <section>
          <div class="section-heading">
            <span class="section-number">02</span>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">
              Segurança da conta
            </h3>
          </div>

          {#if editando}
            <div class="mb-4 rounded-xl border border-purple-200/60 bg-purple-500/5 p-4 text-sm leading-6 text-gray-700 dark:border-purple-400/20 dark:text-gray-300">
              Você está editando uma conta existente. Deixe os campos de senha
              vazios para manter a senha atual.
            </div>
          {/if}

          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <Label for="senha" class="field-label">
                {editando ? 'Nova senha' : 'Senha'}
              </Label>
              <Input
                id="senha"
                type="password"
                bind:value={user.senha}
                oninput={() => limparErroCampo('senha')}
                placeholder={editando ? 'Opcional' : 'Mínimo de 6 caracteres'}
                required={!editando}
                minlength={6}
                disabled={loading}
                autocomplete="new-password"
                class="mt-2"
              />
              {#if errorOf('senha')}
                <p class="field-error">{errorOf('senha')}</p>
              {/if}
            </div>

            <div>
              <Label for="confirmarSenha" class="field-label">
                Confirmar senha
              </Label>
              <Input
                id="confirmarSenha"
                type="password"
                bind:value={confirmarSenha}
                placeholder="Digite a senha novamente"
                required={!editando || !!user.senha}
                minlength={6}
                disabled={loading}
                autocomplete="new-password"
                class="mt-2"
              />
              {#if confirmarSenha && user.senha !== confirmarSenha}
                <p class="field-error">As senhas não conferem.</p>
              {/if}
            </div>
          </div>
        </section>

        <!-- Permissões -->
        {#if hasToken && me !== 'true'}
          <section>
            <div class="section-heading">
              <span class="section-number">03</span>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                Permissões
              </h3>
            </div>

            <Label for="role" class="field-label">Perfil do usuário</Label>
            <Select
              id="role"
              bind:value={user.role}
              items={roleOptions}
              disabled={loading}
              class="mt-2"
            />

            <p class="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
              O perfil define as permissões da conta. O servidor deve verificar
              se você tem autorização para alterar esse campo.
            </p>

            {#if errorOf('role')}
              <p class="field-error">{errorOf('role')}</p>
            {/if}
          </section>
        {/if}

        <!-- Ações -->
        <div class="mt-2 flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 dark:border-gray-700 sm:flex-row sm:justify-end">
          <Button
            color="light"
            type="button"
            onclick={handleCancel}
            disabled={loading}
            class="justify-center"
          >
            <ArrowLeftOutline class="mr-2 h-5 w-5" />
            {editando ? 'Cancelar' : 'Voltar'}
          </Button>

          <Button
            type="submit"
            color="primary"
            disabled={loading}
            class="justify-center !bg-purple-700 hover:!bg-purple-800 focus:!ring-purple-500 dark:!bg-purple-600 dark:hover:!bg-purple-700"
          >
            <FloppyDiskAltOutline class="mr-2 h-5 w-5" />
            {loading ? 'Aguarde...' : editando ? 'Salvar alterações' : 'Criar conta'}
          </Button>
        </div>
      </form>
    </Card>

    <p class="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
      Arcane Library · Seus dados merecem cuidado.
    </p>
  </div>
</main>

<!-- Modal para selecionar foto -->
<Modal bind:open={abrirModalFoto} size="sm" autoclose>
  <div class="flex flex-col items-center gap-5 p-6">
    <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-700 dark:text-purple-300">
      <CameraPhotoOutline class="h-8 w-8" />
    </div>

    <div class="text-center">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white">
        Foto de perfil
      </h3>
      <p class="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">
        Escolha uma imagem para personalizar sua conta.
      </p>
    </div>

    {#if fotoPerfil}
      <img
        src={fotoPerfil}
        alt="Prévia da foto escolhida"
        class="h-28 w-28 rounded-full border-4 border-purple-300 object-cover shadow-md"
      />
    {/if}

    <label for="fotoArquivo" class="w-full cursor-pointer rounded-xl border-2 border-dashed border-purple-300 p-5 text-center transition hover:bg-purple-500/5 dark:border-purple-500/40">
      <CameraPhotoOutline class="mx-auto mb-2 h-7 w-7 text-purple-600 dark:text-purple-300" />
      <span class="block text-sm font-semibold text-gray-800 dark:text-gray-200">
        Escolher imagem
      </span>
      <span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">
        Máximo de 5 MB
      </span>

      <input
        id="fotoArquivo"
        type="file"
        accept="image/*"
        class="sr-only"
        onchange={selecionarFoto}
      />
    </label>

    <Button
      color="light"
      class="w-full justify-center"
      onclick={() => (abrirModalFoto = false)}
    >
      Fechar
    </Button>
  </div>
</Modal>

<style>
  .user-page {
    /*
     * Faz a página ocupar a largura da viewport,
     * mesmo quando o layout pai possui um container estreito.
     */
    position: relative;
    left: 50%;
    width: 100vw;
    min-height: 100vh;
    transform: translateX(-50%);
    box-sizing: border-box;

    display: grid;
    place-items: center;

    padding: 7rem 1rem 4rem;

    background:
      radial-gradient(
        ellipse at 10% 5%,
        rgb(168 85 247 / 0.12),
        transparent 42%
      ),
      radial-gradient(
        ellipse at 90% 40%,
        rgb(139 92 246 / 0.09),
        transparent 38%
      ),
      var(--color-page-background, transparent);
  }

  .user-form-wrapper {
    width: 100%;
    max-width: 48rem;
    margin-inline: auto;
  }

  :global(.dark) .user-page {
    color-scheme: dark;
  }

  .form-banner {
    background: linear-gradient(120deg, #581c87, #6d28d9 60%, #7e22ce);
  }

  .form-content {
    background: rgb(255 255 255 / 0.88);
  }

  :global(.dark) .form-content {
    background: rgb(17 24 39 / 0.92);
  }

  .section-heading {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgb(168 85 247 / 0.2);
  }

  .section-number {
    display: inline-flex;
    height: 2rem;
    width: 2rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: 0.7rem;
    background: rgb(139 92 246 / 0.12);
    color: #7e22ce;
    font-size: 0.75rem;
    font-weight: 800;
  }

  :global(.dark) .section-number {
    color: #d8b4fe;
  }

  .field-label {
    font-weight: 600;
    color: #374151;
  }

  :global(.dark) .field-label {
    color: #e5e7eb;
  }

  .field-error {
    margin-top: 0.4rem;
    font-size: 0.8rem;
    line-height: 1.4;
    color: #dc2626;
  }

  :global(.dark) .field-error {
    color: #fca5a5;
  }

  .loading-spinner {
    height: 1.1rem;
    width: 1.1rem;
    flex-shrink: 0;
    border: 2px solid rgb(139 92 246 / 0.25);
    border-top-color: #7e22ce;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .loading-spinner {
      animation: none;
    }

    .profile-picture {
      transition: none;
    }
  }
</style>