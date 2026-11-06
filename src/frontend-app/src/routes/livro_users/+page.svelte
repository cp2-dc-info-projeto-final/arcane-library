
<script lang="ts">
	import LivroTable from '../../components/LivroTable.svelte';
</script>

<svelte:head>
	<title>Catálogo de Livros | Arcane Library</title>
	<meta
		name="description"
		content="Explore o catálogo de livros da Arcane Library."
	/>
</svelte:head>

<main class="catalogo">
	<header class="cabecalho">
		<div class="icone">📚</div>

		<div>
			<p class="subtitulo">ARCANE LIBRARY</p>
			<h1>Nosso catálogo</h1>
			<p class="descricao">
				Explore os livros disponíveis e encontre sua próxima leitura.
			</p>
		</div>
	</header>

	<section class="conteudo" aria-label="Catálogo de livros">
		<LivroTable />
	</section>
</main>

<style>
	.catalogo {
		min-height: 100%;
		padding: 2rem;
		color: var(--color-text, #29213d);
	}

	.cabecalho {
		display: flex;
		align-items: center;
		gap: 1rem;
		max-width: 1200px;
		margin: 0 auto 2rem;
		padding: 1.75rem;
		border: 1px solid #8b5cf633;
		border-radius: 1.25rem;
		background: linear-gradient(
			135deg,
			#8b5cf61a,
			#c084fc0d
		);
	}

	.icone {
		display: grid;
		flex-shrink: 0;
		width: 4rem;
		height: 4rem;
		place-items: center;
		border-radius: 1rem;
		background: #8b5cf626;
		font-size: 2rem;
	}

	.subtitulo {
		margin: 0 0 0.35rem;
		color: #8b5cf6;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.15em;
	}

	h1 {
		margin: 0;
		font-size: clamp(1.6rem, 4vw, 2.25rem);
		font-weight: 800;
		letter-spacing: -0.04em;
	}

	.descricao {
		margin: 0.5rem 0 0;
		opacity: 0.75;
		line-height: 1.6;
	}

	.conteudo {
		max-width: 1200px;
		margin: 0 auto;
	}

	:global(.dark) .catalogo {
		color: #f3efff;
	}

	@media (max-width: 600px) {
		.catalogo {
			padding: 1rem;
		}

		.cabecalho {
			align-items: flex-start;
			padding: 1.25rem;
		}

		.icone {
			width: 3rem;
			height: 3rem;
			font-size: 1.5rem;
		}
	}
</style>

