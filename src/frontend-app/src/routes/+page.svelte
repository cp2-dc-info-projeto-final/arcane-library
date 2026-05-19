<script lang="ts">
  import { Heading } from 'flowbite-svelte';
  import Menu from '../components/Menu.svelte';
  import {  P, ImagePlaceholder, Skeleton, TextPlaceholder } from "flowbite-svelte";
</script>

<Menu />


<div class=" bg-primary-400 text-center p-8 pt-32">
	<Heading tag="h2" class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">Home</Heading>
	<P class="text-lg leading-relaxed text-gray-700 dark:text-gray-300 mb-4 text-justify">
		Que alegria ter você aqui conosco. 🎉
		
		A <strong>Arcane Library</strong> é mais do que uma biblioteca - é um refúgio para conhecimento, inspiração e descobertas. Somos um espaço acolhedor onde cada visitante é valorizado e onde as histórias ganham vida.
		Se você é um apaixonado por livros, um pesquisador em busca de fontes confiáveis ou simplesmente alguém que procura um lugar tranquilo para aprender e crescer, este é o seu lugar.
		<em>Nossa missão é simples: <strong>"Proporcionar um ambiente saudável, qualidade de vida e bastante fonte de conhecimento aos clientes"</strong>.</em>
	
	
	
	</P>
	<Skeleton class="mt-16 mb-8" />
	<ImagePlaceholder class="my-8" />
	<TextPlaceholder class="my-8" />
</div>
