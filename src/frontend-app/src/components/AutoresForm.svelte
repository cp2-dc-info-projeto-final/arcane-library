
<script lang="ts">
  import { Card, Button, Label, Input, Heading } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import api from '$lib/api';
  import type { ApiFieldError, ApiResponse } from '$lib/api';
  import { goto } from '$app/navigation';
  import {
      ArrowLeftOutline,
      FloppyDiskAltOutline
  } from 'flowbite-svelte-icons';
  import type { Autores, AutoresFormData } from '$lib/models/Autores';

  export let id: number | null = null;

  let autor: AutoresFormData = {
      id: undefined,
      nome: '',
      pseunonimo: '',
      sinopse: '',
      foto: null
  };

  let fotoAtual: string | null = null;
  let fotoArquivo: File | null = null;
  let fotoPreview: string | null = null;

  let loading = false;
  let error = '';
  let fieldErrors: ApiFieldError[] = [];

  function errorOf(field: string): string | null {
      return fieldErrors.find(item => item.field === field)?.message ?? null;
  }

  onMount(async () => {
      if (id !== null) {
          loading = true;

          try {
              const res = await api.get(`/autores/${id}`);
              const body = res.data as ApiResponse<Autores>;

              if (body?.success && body.data) {
                  autor.nome = body.data.nome;
                  autor.pseunonimo = body.data.pseunonimo || '';
                  autor.sinopse = body.data.sinopse || '';

                  fotoAtual = body.data.foto;
              } else {
                  error = body?.message || 'Erro ao carregar autor.';
              }
          } catch (e: any) {
              error = e.response?.data?.message || 'Erro ao carregar autor.';
          } finally {
              loading = false;
          }
      }
  });

  function selecionarFoto(event: Event) {
      const input = event.currentTarget as HTMLInputElement;
      const arquivo = input.files?.[0];

      if (!arquivo) return;

      if (!arquivo.type.startsWith('image/')) {
          error = 'Selecione um arquivo de imagem válido.';
          input.value = '';
          return;
      }

      fotoArquivo = arquivo;
      fotoPreview = URL.createObjectURL(arquivo);
      error = '';
  }

  async function handleSubmit() {
      fieldErrors = [];
      loading = true;
      error = '';

      try {
          const targetRoute = id === null
              ? '/autores'
              : `/autores/${id}`;

          const formData = new FormData();

          formData.append('nome', autor.nome);
          formData.append('pseunonimo', autor.pseunonimo || '');
          formData.append('sinopse', autor.sinopse || '');

          if (fotoArquivo) {
              formData.append('foto', fotoArquivo);
          }

          let res;

          if (id === null) {
              res = await api.post(targetRoute, formData);
          } else {
              res = await api.put(targetRoute, formData);
          }

          const body = res.data as ApiResponse<Autores>;

          if (!body?.success) {
              error = body?.message || 'Erro ao salvar autor.';
              fieldErrors = body?.errors || [];
              return;
          }

          goto('/autores');
      } catch (e: any) {
          error = e.response?.data?.message || 'Erro ao salvar autor.';
          fieldErrors = e.response?.data?.errors || [];
      } finally {
          loading = false;
      }
  }

  function handleCancel() {
      goto('/autores');
  }
</script>

<Card class="max-w-xl mx-auto mt-10 p-0 overflow-hidden shadow-lg border border-gray-200 rounded-lg">
  <form
  class="flex flex-col gap-5 p-6"
  onsubmit={(event) => {
      event.preventDefault();
      handleSubmit();
  }}
>
      <Heading tag="h3" class="mb-2 text-center">
          {id === null ? 'Cadastrar Autor' : 'Editar Autor'}
      </Heading>

      {#if error}
          <div class="text-red-500 text-center">{error}</div>
      {/if}
      <div>
        <Label for="foto">Foto do autor</Label>
        <input
            id="foto"
            type="file"
            accept="image/*"
            onchange={selecionarFoto}
            class="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-100 file:px-4 file:py-2 file:text-purple-700"
        />

        {#if fotoPreview || fotoAtual}
            <img
                src={fotoPreview || `http://localhost:3000/uploads/${fotoAtual}`}
                alt="Pré-visualização da foto do autor"
                class="mt-4 h-48 w-40 rounded-lg object-cover"
            />
        {/if}
      </div>
      <div>
          <Label for="nome">Nome</Label>
          <Input
              id="nome"
              bind:value={autor.nome}
              placeholder="Digite o nome do autor"
              required
              class="mt-1"
          />

          {#if errorOf('nome')}
              <div class="mt-1 text-sm text-red-500">{errorOf('nome')}</div>
          {/if}
      </div>

      <div>
          <Label for="pseunonimo">Pseudônimo</Label>
          <Input
              id="pseunonimo"
              bind:value={autor.pseunonimo}
              placeholder="Digite o pseudônimo"
              class="mt-1"
          />
      </div>

      <div>
          <Label for="sinopse">Biografia / Sinopse</Label>
          <textarea
              id="sinopse"
              bind:value={autor.sinopse}
              rows="6"
              placeholder="Escreva sobre a vida e a trajetória do autor..."
              class="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-sm text-gray-900 focus:border-purple-500 focus:ring-purple-500"
          ></textarea>
      </div>

      <div class="flex gap-4 justify-end mt-4">
          <Button
              color="light"
              type="button"
              onclick={handleCancel}
              disabled={loading}
          >
              <ArrowLeftOutline class="inline w-5 h-5 mr-2" />
              {id === null ? 'Voltar' : 'Cancelar'}
          </Button>

          <Button type="submit" color="primary" disabled={loading}>
              <FloppyDiskAltOutline class="inline w-5 h-5 mr-2" />
              {id === null ? 'Cadastrar' : 'Salvar'}
          </Button>
      </div>
  </form>
</Card>
