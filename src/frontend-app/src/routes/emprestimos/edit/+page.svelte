<script lang="ts">
    import EmprestimosForm from '../../../components/EmprestimosForm.svelte';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';
	

    const params = get(page).params;
    const id = Number(params.id);
</script>

<svelte:head>
    <title>Editar empréstimo | Arcane Library</title>
    <meta
        name="description"
        content="Editar empréstimo da Arcane Library"
    />
</svelte:head>

<EmprestimosForm id={id} />