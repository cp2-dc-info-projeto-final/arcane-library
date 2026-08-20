<script>
  import LivroForm from '../../../../components/LivroForm.svelte';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  let id: number | null = null;

  onMount(() => {
    id = parseInt($page.params.id);
  });
</script>

<LivroForm {id} />