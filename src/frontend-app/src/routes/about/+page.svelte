```svelte
<script lang="ts">
  import { Heading } from 'flowbite-svelte';

  const criadores = [
    {
      nome: 'Manúmeros',
      descricao: 'Estou falando e odeio matemática.',
      foto: '/images/manu.jpeg',
      alt: 'Foto da Manu',
      lado: 'esquerda'
    },
    {
      nome: 'Hudson',
      descricao: 'Vôlei, vôlei e vôlei.',
      foto: '/images/hudson.jpeg',
      alt: 'Foto do Hudson',
      lado: 'direita'
    },
    {
      nome: 'Guilherme',
      descricao: 'Débora, Débora e Débora.',
      foto: '/images/guilherme.jpeg',
      alt: 'Foto do Guilherme',
      lado: 'esquerda'
    },
    {
      nome: 'Judce',
      descricao:
        'Opa! Eu sou o João Miguel, um tricolor de coração aspirante a programador, apaixonado por futebol e vôlei, multi-instrumentista e louco por Charlie Brown Jr., Belchior e Engenheiros do Hawaii! E Chuck Berry é o rei do rock.',
      foto: '/images/judce.jpg',
      alt: 'Foto do João Miguel',
      lado: 'direita'
    },
    {
      nome: 'João',
      descricao: 'Dono da melhor China do mundo.',
      foto: '/images/joao.jpeg',
      alt: 'Foto do João',
      lado: 'esquerda'
    }
  ];
</script>

<svelte:head>
  <title>Sobre nós | Arcane Library</title>
  <meta
    name="description"
    content="Conheça a Arcane Library, nossa missão e as pessoas que desenvolveram este projeto."
  />
</svelte:head>

<main class="about-page min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:px-8">
  <div class="mx-auto max-w-6xl">

    <!-- Cabeçalho -->
    <section class="mx-auto mb-16 max-w-3xl text-center">
      <div class="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-300/40 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
        <span>✦</span>
        Nossa história
        <span>✦</span>
      </div>

      <Heading
        tag="h1"
        class="!mb-6 !text-4xl !font-extrabold tracking-tight text-gray-900 dark:text-white sm:!text-5xl lg:!text-6xl"
      >
        Muito além dos livros
      </Heading>

      <p class="mx-auto max-w-2xl text-base leading-8 text-gray-700 dark:text-gray-300 sm:text-lg">
        Todo livro abre uma porta para um novo mundo. A Arcane Library nasceu
        para ajudar você a encontrar a sua próxima grande descoberta.
      </p>

      <div class="mx-auto mt-8 h-1 w-24 rounded-full bg-purple-600"></div>
    </section>

    <!-- Sobre a biblioteca -->
    <section class="mb-20 grid gap-6 md:grid-cols-2">
      <article class="info-card rounded-3xl border border-purple-200/60 p-7 shadow-lg shadow-purple-950/5 transition duration-300 hover:-translate-y-1 sm:p-9 dark:border-purple-400/20">
        <div class="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/10 text-2xl">
          📚
        </div>

        <h2 class="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Quem somos?
        </h2>

        <p class="leading-8 text-gray-700 dark:text-gray-300">
          Fundada em 2026, a <strong>Arcane Library</strong> é um projeto
          dedicado ao conhecimento, à imaginação e à descoberta. Queremos
          transformar a experiência de explorar livros em uma jornada
          acolhedora, interessante e cheia de possibilidades.
        </p>
      </article>

      <article class="info-card rounded-3xl border border-purple-200/60 p-7 shadow-lg shadow-purple-950/5 transition duration-300 hover:-translate-y-1 sm:p-9 dark:border-purple-400/20">
        <div class="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/10 text-2xl">
          ✨
        </div>

        <h2 class="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
          Nossa missão
        </h2>

        <p class="leading-8 text-gray-700 dark:text-gray-300">
          Proporcionar um ambiente acolhedor que incentive a leitura, o
          aprendizado e o desenvolvimento pessoal. Buscamos oferecer uma
          experiência simples e agradável, aproximando cada leitor de novas
          ideias, histórias e fontes de conhecimento.
        </p>
      </article>
    </section>

    <!-- Mensagem de destaque -->
    <section class="mb-24 overflow-hidden rounded-3xl border border-purple-400/20 bg-purple-950 px-6 py-12 text-center shadow-xl sm:px-12 sm:py-16">
      <span class="mb-4 block text-4xl">🔮</span>

      <h2 class="mb-5 text-2xl font-extrabold text-white sm:text-3xl">
        Um universo de possibilidades espera por você
      </h2>

      <p class="mx-auto max-w-2xl leading-8 text-purple-100/90">
        Explore nossa coleção, descubra novos autores e embarque em jornadas
        inesperadas através das páginas. Aqui, cada leitura pode ser o começo
        de uma nova aventura.
      </p>

      <p class="mt-7 text-lg font-bold text-white">
        Bem-vindo à sua próxima grande descoberta! 📖✨
      </p>
    </section>

    <!-- Criadores -->
    <section>
      <div class="mb-12 text-center">
        <p class="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-purple-700 dark:text-purple-300">
          Por trás do projeto
        </p>

        <Heading
          tag="h2"
          class="!mb-4 !text-3xl !font-extrabold text-gray-900 dark:text-white sm:!text-4xl"
        >
          Conheça os criadores
        </Heading>

        <p class="mx-auto max-w-2xl leading-7 text-gray-700 dark:text-gray-300">
          Uma equipe com personalidades, interesses e histórias diferentes,
          reunida para dar vida à Arcane Library.
        </p>
      </div>

      <div class="space-y-8">
        {#each criadores as criador, i (criador.nome)}
          <article
            class="creator-card group flex flex-col items-center gap-7 rounded-3xl border border-purple-200/60 p-5 shadow-lg shadow-purple-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-7 md:gap-10 md:p-8
            {criador.lado === 'direita' ? 'md:flex-row-reverse' : 'md:flex-row'}"
          >
            <div class="relative shrink-0">
              <div class="absolute -inset-2 rounded-2xl bg-purple-600/20 blur-md transition duration-300 group-hover:bg-purple-600/35"></div>

              <img
                src={criador.foto}
                alt={criador.alt}
                loading="lazy"
                class="relative h-56 w-56 rounded-2xl border border-purple-300/40 object-cover shadow-md sm:h-64 sm:w-64"
              />

              <span class="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-xl border border-purple-200 bg-white text-sm font-extrabold text-purple-700 shadow-md dark:border-purple-400/30 dark:bg-gray-900 dark:text-purple-300">
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>

            <div class="min-w-0 flex-1 text-center md:text-left">
              <p class="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-purple-700 dark:text-purple-300">
                Criador da Arcane Library
              </p>

              <h3 class="text-2xl font-extrabold text-gray-900 dark:text-white sm:text-3xl">
                {criador.nome}
              </h3>

              <div class="mx-auto my-4 h-1 w-12 rounded-full bg-purple-600 md:mx-0"></div>

              <p class="text-base leading-8 text-gray-700 dark:text-gray-300">
                {criador.descricao}
              </p>
            </div>
          </article>
        {/each}
      </div>
    </section>

    <!-- Rodapé da página -->
    <footer class="mt-20 border-t border-purple-300/30 pt-8 text-center">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Arcane Library · 2026
      </p>
      <p class="mt-2 text-sm font-medium text-purple-700 dark:text-purple-300">
        Conhecimento que abre novos mundos.
      </p>
    </footer>

  </div>
</main>

<style>
  .about-page {
    background:
      radial-gradient(
        ellipse at 15% 5%,
        rgb(168 85 247 / 0.12),
        transparent 42%
      ),
      radial-gradient(
        ellipse at 90% 45%,
        rgb(139 92 246 / 0.1),
        transparent 38%
      ),
      var(--color-page-background, transparent);
  }

  .info-card,
  .creator-card {
    background: rgb(255 255 255 / 0.82);
    backdrop-filter: blur(14px);
  }

  :global(.dark) .info-card,
  :global(.dark) .creator-card {
    background: rgb(17 24 39 / 0.78);
  }

  @media (prefers-reduced-motion: reduce) {
    .info-card,
    .creator-card {
      transition: none;
    }
  }
</style>

