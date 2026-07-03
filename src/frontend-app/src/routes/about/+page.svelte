<script lang="ts">
  import { Heading, P, ImagePlaceholder } from "flowbite-svelte";
  import Menu from '../../components/Menu.svelte';
</script>

<Menu />


<div class="theme-background text-center p-8 pt-32">
  <Heading tag="h2" class="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">Sobre</Heading>
  <P class="text-lg leading-relaxed text-gray-900 dark:text-gray-900 mb-4 text-justify">
   Localizada no coração da cidade a Arcane Library traz para você que há de melhor para o seu conhecimento. Fundada em 2026, a Arcane Library já é destaque na cidade e conquista novos clientes a cada dia.
  </P>
  <P>
   Nossa missão é: "Proporcionar um ambiente saudavel, qualidade de vida e bastante fonte de conhecimento aos clientes" Oferecemos profissionais experientes e antenados às mudanças no mundo literario. O atendimento possui padrão de excelência e agilidade, garantindo qualidade e satisfação dos nossos clientes.
  </P>
  
  <P >
   A <strong>Arcane Library</strong> é mais do que uma biblioteca - é um refúgio para conhecimento, inspiração e descobertas. Somos um espaço acolhedor onde cada visitante é valorizado e onde as histórias ganham vida.
  </P>
  <P >
  Explore nossa coleção, descubra novos mundos e embarque em jornadas inesperadas através das páginas. Estamos aqui para tornar sua experiência memorável.
  </P>
  <P class="text-base leading-relaxed text-gray-900 dark:text-gray-900 mb-4 text-justify">
   <strong>Bem-vindo à sua próxima grande descoberta! 📖✨</strong>
  </P>
  
    <!-- Seção dos Criadores Intercalados -->
<div class="max-w-4xl mx-auto px-4 py-12 space-y-16">
  <p class="text-2xl font-bold text-center mb-12">
    <strong>E aqui estão os criadores desse maravilhoso site:</strong>
  </p>

  <!-- 1. Manu (Foto na Esquerda, Texto na Direita) -->
  <div class="flex flex-col md:flex-row items-center gap-8 bg-white/10 dark:bg-black/10 p-6 rounded-2xl backdrop-blur-sm">
    <img src="images/manu.jpeg" alt="Manu" class="w-64 h-64 object-cover rounded-xl shadow-lg">
    <div class="flex-1 text-left">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white">Manúmeros</h3>
      <p class="text-base mt-2 text-gray-900 dark:text-gray-900">estou falando e odeio matemática</p>
    </div>
  </div>

  <!-- 2. Hudson (Foto na Direita, Texto na Esquerda) -->
  <div class="flex flex-col md:flex-row-reverse items-center gap-8 bg-white/10 dark:bg-black/10 p-6 rounded-2xl backdrop-blur-sm">
    <img src="images/hudson.jpeg" alt="Hudson" class="w-64 h-64 object-cover rounded-xl shadow-lg">
    <div class="flex-1 text-right md:text-left">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white">Hudson</h3>
      <p class="text-base mt-2 text-gray-900 dark:text-gray-900">Volei volei e volei</p>
    </div>
  </div>

  <!-- 3. Guilherme (Foto na Esquerda, Texto na Direita) -->
  <div class="flex flex-col md:flex-row items-center gap-8 bg-white/10 dark:bg-black/10 p-6 rounded-2xl backdrop-blur-sm">
    <img src="images/guilherme.jpeg" alt="Guilherme" class="w-64 h-64 object-cover rounded-xl shadow-lg">
    <div class="flex-1 text-left">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white">Guilherme</h3>
      <p class="text-base mt-2 text-gray-900 dark:text-gray-900">debora debora e debora</p>
    </div>
  </div>

  <!-- 4. Judce (Foto na Direita, Texto na Esquerda) -->
  <div class="flex flex-col md:flex-row-reverse items-center gap-8 bg-white/10 dark:bg-black/10 p-6 rounded-2xl backdrop-blur-sm">
    <img src="images/judce.jpg" alt="Judce" class="w-64 h-64 object-cover rounded-xl shadow-lg">
    <div class="flex-1 text-right md:text-left">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white">Judce</h3>
      <p class="text-base mt-2 text-gray-900 dark:text-gray-900">Opa! Eu sou o João Miguel, um tricolor de coração aspirante a programador, apaixonado por futebol e vôlei, multi-instrumentista e louco por charlie brown, belchior e engenheiros do hawaii! E Chuck Berry é o rei do rock. </p>
    </div>
  </div>

  <!-- 5. João (Foto na Esquerda, Texto na Direita) -->
  <div class="flex flex-col md:flex-row items-center gap-8 bg-white/10 dark:bg-black/10 p-6 rounded-2xl backdrop-blur-sm">
    <img src="images/joao.jpeg" alt="João" class="w-64 h-64 object-cover rounded-xl shadow-lg">
    <div class="flex-1 text-left">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white">João</h3>
      <p class="text-base mt-2 text-gray-900 dark:text-gray-900">Dono da melhor china do mundo.</p>
    </div>
  </div>

</div>
</div>

<style>
	:global(.theme-background) {
		background: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-secondary-500) 0%, var(--color-accent-500) 70%);
		transition: background 0.5s ease;
	}
</style>

