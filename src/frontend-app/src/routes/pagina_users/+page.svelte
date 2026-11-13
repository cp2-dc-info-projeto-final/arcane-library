
<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';
    import { Spinner, Button } from 'flowbite-svelte';
    import api from '$lib/api';
    import type { ApiResponse } from '$lib/api';

    type UsuarioDetalhado = {
        id: number;
        login: string;
        foto: string | null;
    };

    let idUsuario = $derived(page.url.searchParams.get('id'));

    let usuario: UsuarioDetalhado | null = $state(null);
    let loading = $state(true);
    let error = $state('');

    async function carregarUsuario(id: string) {
        loading = true;
        error = '';

        try {
            const response = await api.get(`/users/public/${id}`);
            const body = response.data as ApiResponse<UsuarioDetalhado>;

            if (!body.success || !body.data) {
                throw new Error(body.message || 'Usuário não encontrado.');
            }

            usuario = body.data;

        } catch (err: any) {
            console.error(err);

            error = err.response?.data?.message ||
                err.message ||
                'Não foi possível carregar o perfil.';

            usuario = null;

        } finally {
            loading = false;
        }
    }

    $effect(() => {
        const id = idUsuario;

        if (id) {
            carregarUsuario(id);
        } else {
            usuario = null;
            error = 'Nenhum usuário foi selecionado.';
            loading = false;
        }
    });
</script>

<svelte:head>
    <title>{usuario?.login ?? 'Perfil do usuário'} | Arcane Library</title>
</svelte:head>

<main class="pagina">

    {#if loading}

        <div class="estado">
            <Spinner size="xl" color="purple" />
            <p>Carregando perfil do usuário...</p>
        </div>

    {:else if error}

        <div class="estado">
            <h2>{error}</h2>

            <Button color="purple" onclick={() => goto('/')}>
                Voltar ao início
            </Button>
        </div>

    {:else if usuario}

        <div class="perfil">

            <div class="foto">
                {#if usuario.foto}
                    <img
                        src={`http://localhost:3000/uploads/${usuario.foto}`}
                        alt={`Foto de ${usuario.login}`}
                    />
                {:else}
                    <div class="sem-foto">
                        {usuario.login.charAt(0).toUpperCase()}
                    </div>
                {/if}
            </div>

            <div class="informacoes">
                <span class="identificacao">PERFIL DO USUÁRIO</span>

                <h1>@{usuario.login}</h1>

                <p>
                    Bem-vindo ao perfil de {usuario.login}.
                </p>
            </div>

        </div>

    {/if}

</main>

<style>
    .pagina {
        --fundo: #ffffff;
        --texto: #1f2937;
        --secundario: #6b7280;
        --destaque: #7c3aed;
        --borda: #e5e7eb;
        --fundo-foto: #f3f4f6;

        min-height: 100vh;
        padding: 65px 30px;
        box-sizing: border-box;
        background: var(--fundo);
        color: var(--texto);
    }

    :global(.dark) .pagina {
        --fundo: #11151a;
        --texto: #f5f3ff;
        --secundario: #929bad;
        --destaque: #a78bfa;
        --borda: #39414c;
        --fundo-foto: #252b34;

        background:
            radial-gradient(ellipse at 50% 0%, #292039 0%, transparent 55%),
            var(--fundo);
    }

    .perfil {
        max-width: 900px;
        margin: 40px auto;
        display: flex;
        align-items: center;
        gap: 40px;
    }

    .foto {
        width: 200px;
        height: 200px;
        flex-shrink: 0;
        overflow: hidden;
        border-radius: 50%;
        border: 2px solid var(--borda);
        background: var(--fundo-foto);
    }

    .foto img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .sem-foto {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: var(--destaque);
        font-size: 80px;
        font-weight: bold;
    }

    .identificacao {
        color: var(--destaque);
        font-size: 12px;
        font-weight: bold;
        letter-spacing: 2px;
    }

    .informacoes h1 {
        font-size: 34px;
        margin: 12px 0;
        overflow-wrap: anywhere;
    }

    .informacoes p {
        color: var(--secundario);
        font-size: 16px;
    }

    .estado {
        min-height: 65vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        text-align: center;
    }

    @media (max-width: 600px) {
        .perfil {
            flex-direction: column;
            text-align: center;
        }

        .foto {
            width: 160px;
            height: 160px;
        }
    }
</style>
