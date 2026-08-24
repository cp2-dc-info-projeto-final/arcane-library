<script lang="ts">
    import LivroForm from '../../../../components/LivroForm.svelte';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';

    const params = get(page).params;
    const id = Number(params.id);
</script>

<svelte:head>
    <title>Editar Livro | Arcane Library</title>
    <meta
        name="description"
        content="Editar livro da Arcane Library"
    />
</svelte:head>

<LivroForm id={id} />