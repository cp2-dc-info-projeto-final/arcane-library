
<script lang="ts">
	import { BookOutline } from 'flowbite-svelte-icons';
  </script>
  
  <svelte:head>
	<title>Arcane Library | Início</title>
	<meta
	  name="description"
	  content="Explore a Arcane Library, um refúgio para conhecimento, inspiração e descobertas."
	/>
  </svelte:head>
  
  <main class="arcane-home">
	<section class="library-hero">
	  <div class="hero-overlay"></div>
  
	  <div class="library-hero-content">
		<h1 class="hero-title">
		  ARCANE
		  <span>LIBRARY</span>
		</h1>
  
		<div class="hero-line"></div>
  
		<p class="hero-description">
		  Um refúgio para conhecimento, inspiração e descobertas.
		  <br />
		  Entre em um mundo onde cada livro guarda uma nova história.
		</p>
  
		<div class="hero-buttons">
		  <a href="/livro_users" class="arcane-button">
			Explorar livros
		  </a>
		  <a href="/about" class="arcane-button-outline">
			Conheça a biblioteca
		  </a>
		</div>
	  </div>
	</section>
  
	<section class="intro-section">
	  <div class="intro-content">
		<p class="section-label">ARCANE LIBRARY</p>
		<h2>Onde histórias ganham vida</h2>
		<div class="gold-line"></div>
  
		<p>
		  A Arcane Library é mais do que uma biblioteca. É um espaço dedicado
		  ao conhecimento, à leitura e à descoberta.
		</p>
  
		<p>
		  Aqui, cada livro representa uma nova possibilidade: aprender algo
		  novo, conhecer diferentes mundos e encontrar histórias que
		  permanecem conosco.
		</p>
	  </div>
	</section>
  
	<section class="books-section">
	  <div class="section-header">
		<p class="section-label">EXPLORE</p>
		<h2>Encontre sua próxima história</h2>
		<p>Explore nosso catálogo e descubra novos livros.</p>
	  </div>
  
	  <div class="quick-actions">
		<a href="/livro_users" class="quick-card">
		  <div class="quick-icon">
			<BookOutline />
		  </div>
		  <div>
			<h3>Catálogo</h3>
			<p>Encontre livros disponíveis para empréstimo.</p>
		  </div>
		</a>
  
		<a href="/emprestimos_users" class="quick-card">
		  <div class="quick-icon">📖</div>
		  <div>
			<h3>Meus empréstimos</h3>
			<p>Consulte seus livros emprestados.</p>
		  </div>
		</a>
  
		<a href="/about" class="quick-card">
		  <div class="quick-icon">✦</div>
		  <div>
			<h3>Sobre nós</h3>
			<p>Conheça a história da Arcane Library.</p>
		  </div>
		</a>
	  </div>
	</section>
  
	<section class="quote-section">
	  <div class="quote-decoration">✦</div>
	  <blockquote>
		"Uma biblioteca não é apenas um lugar cheio de livros. É um lugar
		cheio de possibilidades."
	  </blockquote>
	  <div class="gold-line small"></div>
	</section>
  </main>
  
  <style>
	.arcane-home {
	  width: 100%;
	  min-height: 100vh;
	  background: #f4efe4;
	  color: #10243a;
	}
  
	:global(.dark .arcane-home) {
	  background: #080d14;
	  color: #f1e9d6;
	}
  
	.library-hero {
	  position: relative;
	  min-height: 700px;
	  display: flex;
	  align-items: center;
	  overflow: hidden;
	  padding: 120px 7% 80px;
	  background-image: url('/images/library-light.jpg');
	  background-size: cover;
	  background-position: center;
	  background-repeat: no-repeat;
	}
  
	:global(.dark) .library-hero {
	  background-image: url('/images/library-dark.jpg');
	}
  
	.hero-overlay {
	  position: absolute;
	  inset: 0;
	  background: linear-gradient(
		90deg,
		rgba(244, 239, 228, 0.97) 0%,
		rgba(244, 239, 228, 0.82) 32%,
		rgba(244, 239, 228, 0.38) 65%,
		rgba(244, 239, 228, 0.08) 100%
	  );
	}
  
	:global(.dark) .hero-overlay {
	  background: linear-gradient(
		90deg,
		rgba(8, 13, 20, 0.96) 0%,
		rgba(8, 13, 20, 0.82) 32%,
		rgba(8, 13, 20, 0.42) 65%,
		rgba(8, 13, 20, 0.12) 100%
	  );
	}
  
	.library-hero-content {
	  position: relative;
	  z-index: 2;
	  max-width: 680px;
	}
  
	.hero-title {
	  margin: 0;
	  font-family: 'Baskerville Old Face', Baskerville, Georgia, serif;
	  font-size: clamp(4rem, 9vw, 8rem);
	  line-height: 0.82;
	  letter-spacing: 0.08em;
	  font-weight: 700;
	  color: #10243a;
	}
  
	.hero-title span {
	  display: block;
	  margin-top: 12px;
	  font-size: 0.65em;
	  letter-spacing: 0.2em;
	}
  
	:global(.dark) .hero-title {
	  color: #f1e9d6;
	}
  
	.hero-line {
	  width: 120px;
	  height: 2px;
	  margin: 30px 0;
	  background: #c9a45c;
	}
  
	.hero-description {
	  max-width: 570px;
	  color: #526171;
	  font-size: 1.2rem;
	  line-height: 1.8;
	}
  
	:global(.dark) .hero-description {
	  color: #c1c4c5;
	}
  
	.hero-buttons {
	  display: flex;
	  flex-wrap: wrap;
	  gap: 14px;
	  margin-top: 30px;
	}
  
	.arcane-button,
	.arcane-button-outline {
	  display: inline-flex;
	  align-items: center;
	  justify-content: center;
	  padding: 13px 25px;
	  border-radius: 4px;
	  font-weight: 700;
	  text-decoration: none;
	  transition: all 0.25s ease;
	}
  
	.arcane-button {
	  border: 1px solid #c9a45c;
	  background: #c9a45c;
	  color: #080d14;
	}
  
	.arcane-button:hover {
	  background: #e4c77a;
	  transform: translateY(-2px);
	}
  
	.arcane-button-outline {
	  border: 1px solid #967237;
	  background: rgba(255, 255, 255, 0.08);
	  color: #10243a;
	}
  
	:global(.dark) .arcane-button-outline {
	  color: #f1e9d6;
	  border-color: #c9a45c;
	}
  
	.arcane-button-outline:hover {
	  background: #c9a45c;
	  color: #080d14;
	}
  
	.intro-section,
	.quote-section {
	  padding: 100px 7%;
	  background: #ebe2d1;
	  text-align: center;
	}
  
	:global(.dark .intro-section),
	:global(.dark .quote-section) {
	  background: #101923;
	}
  
	.intro-content {
	  max-width: 800px;
	  margin: 0 auto;
	}
  
	.section-label {
	  color: #967237;
	  font-size: 0.8rem;
	  font-weight: 700;
	  letter-spacing: 0.2em;
	}
  
	:global(.dark) .section-label {
	  color: #c9a45c;
	}
  
	.intro-content h2,
	.books-section h2 {
	  margin: 12px 0;
	  color: #10243a;
	  font-size: clamp(2rem, 4vw, 3.2rem);
	}
  
	:global(.dark .intro-content h2),
	:global(.dark .books-section h2) {
	  color: #f1e9d6;
	}
  
	.intro-content p:not(.section-label) {
	  margin: 18px auto;
	  color: #526171;
	  font-size: 1.1rem;
	  line-height: 1.8;
	}
  
	:global(.dark .intro-content p:not(.section-label)) {
	  color: #aeb5bb;
	}
  
	.gold-line {
	  width: 90px;
	  height: 2px;
	  margin: 20px auto;
	  background: #c9a45c;
	}
  
	.gold-line.small {
	  width: 60px;
	}
  
	.books-section {
	  padding: 100px 7%;
	  background: #f4efe4;
	}
  
	:global(.dark .books-section) {
	  background: #080d14;
	}
  
	.section-header {
	  margin-bottom: 35px;
	  text-align: center;
	}
  
	.section-header > p:last-child {
	  color: #526171;
	}
  
	:global(.dark .section-header > p:last-child) {
	  color: #aeb5bb;
	}
  
	.quick-actions {
	  display: grid;
	  grid-template-columns: repeat(3, minmax(0, 1fr));
	  gap: 24px;
	}
  
	.quick-card {
	  display: flex;
	  align-items: flex-start;
	  gap: 18px;
	  padding: 28px;
	  border: 1px solid #d6c6a5;
	  border-radius: 5px;
	  background: #fffaf0;
	  color: #10243a;
	  text-decoration: none;
	  transition: all 0.25s ease;
	}
  
	:global(.dark .quick-card) {
	  background: #1b1512;
	  border-color: #51432e;
	  color: #f1e9d6;
	}
  
	.quick-card:hover {
	  transform: translateY(-5px);
	  border-color: #c9a45c;
	  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
	}
  
	.quick-icon {
	  display: flex;
	  align-items: center;
	  justify-content: center;
	  width: 50px;
	  height: 50px;
	  flex-shrink: 0;
	  border: 1px solid #c9a45c;
	  border-radius: 50%;
	  color: #967237;
	  font-size: 1.4rem;
	}
  
	.quick-card h3 {
	  margin: 0 0 8px;
	  font-size: 1.3rem;
	}
  
	.quick-card p {
	  margin: 0;
	  color: #526171;
	  line-height: 1.6;
	}
  
	:global(.dark .quick-card p) {
	  color: #9fa7ae;
	}
  
	.quote-decoration {
	  color: #c9a45c;
	  font-size: 2rem;
	}
  
	blockquote {
	  max-width: 800px;
	  margin: 25px auto;
	  color: #10243a;
	  font-size: clamp(1.5rem, 3vw, 2.4rem);
	  line-height: 1.5;
	  font-style: italic;
	}
  
	:global(.dark) blockquote {
	  color: #f1e9d6;
	}
  
	@media (max-width: 1100px) {
	  .quick-actions {
		grid-template-columns: 1fr;
	  }
	}
  
	@media (max-width: 768px) {
	  .library-hero {
		min-height: 650px;
		padding: 130px 25px 70px;
	  }
  
	  .hero-title {
		font-size: clamp(3.5rem, 15vw, 5rem);
	  }
  
	  .hero-description {
		font-size: 1rem;
	  }
  
	  .intro-section,
	  .books-section,
	  .quote-section {
		padding: 70px 25px;
	  }
	}
  
	@media (max-width: 480px) {
	  .library-hero {
		min-height: 620px;
		padding: 120px 20px 60px;
	  }
  
	  .hero-buttons {
		flex-direction: column;
	  }
  
	  .arcane-button,
	  .arcane-button-outline {
		width: 100%;
	  }
  
	  .hero-title {
		font-size: 3.2rem;
	  }
  
	  .quick-card {
		padding: 20px;
	  }
	}
  </style>