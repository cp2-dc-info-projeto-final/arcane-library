<script lang="ts">
    import { Heading } from 'flowbite-svelte';
    import LivroTable from '../../../components/LivroTable.svelte';
    import { UserAddOutline } from 'flowbite-svelte-icons';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { getCurrentUser } from '$lib/auth';

    let checkingAccess = true;
    let canView = false;

    /**
     * Verifica se o usuário está autenticado
     * e se possui permissão de administrador.
     * Se não estiver autenticado: redireciona para /login
     * Se estiver autenticado, mas não for administrador: redireciona para /
     * Apenas administradores podem acessar
     * a página de gerenciamento de livros.
     */
    onMount(async () => {
        try {
            const user = await getCurrentUser();

            if (!user) {
                await goto('/login');
                return;
            }

            if (user.role !== 'admin') {
                await goto('/');
                return;
            }

            canView = true;
        } catch (error) {
            console.error('Erro ao verificar acesso:', error);

            await goto('/login');
            return;
        } finally {
            checkingAccess = false;
        }
    });

    /**
     * Redireciona para a página de cadastro
     * de um novo livro.
     */
    function adicionarLivro() {
        goto('/livros/new');
    }
</script>

<svelte:head>
    <title>Livros | Arcane Library</title>
    <meta
        name="description"
        content="Gerenciamento de livros da Arcane Library"
    />
</svelte:head>

{#if checkingAccess}

    <!-- Tela enquanto verifica autenticação -->
    <div class="flex min-h-[60vh] items-center justify-center">
        <div class="text-center">
            <div class="mb-3 text-lg font-medium text-gray-600 dark:text-gray-300">
                Verificando acesso...
            </div>

            <div
                class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600"
            ></div>
        </div>
    </div>

{:else if canView}

    <!-- Conteúdo principal -->
    <div class="p-8 pt-32">

        <!-- Cabeçalho -->
        <div
            class="mx-auto mb-6 flex max-w-6xl items-center justify-between"
        >
            <div>
                <Heading
                    tag="h2"
                    class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white"
                >
                    Livros
                </Heading>

                <p class="mt-2 text-gray-500 dark:text-gray-400">
                    Gerencie os livros cadastrados na biblioteca.
                </p>
            </div>

            <!-- Botão adicionar -->
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800"
                on:click={adicionarLivro}
            >
                <UserAddOutline class="h-5 w-5" />

                <span>
                    Adicionar
                </span>
            </button>
        </div>

        <!-- Tabela de livros -->
        <div class="mx-auto max-w-6xl">
            <LivroTable />
        </div>

    </div>

{/if}