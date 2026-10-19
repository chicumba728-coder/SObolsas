# Plano de implementação — Bolsaria

## Objetivo e âmbito

Construir um frontend responsivo para uma plataforma de bolsas de estudo e mentorias pagas, exclusivamente com HTML semântico, CSS, JavaScript e React. A aplicação funcionará sem backend e sem base de dados. Não haverá conteúdo de exemplo, endpoints presumidos, autenticação real, persistência, reservas reais ou processamento de pagamentos. Todos os módulos previstos terão navegação e interfaces; os espaços de dados começam vazios e indicam, com clareza, quando a integração ainda não existe.

## Abordagem técnica

- React com JavaScript (ficheiros `.js`/`.jsx`), CSS puro e HTML5 semântico.
- Vite e o plugin React serão usados apenas como ferramenta de desenvolvimento e compilação; não será introduzido outro framework de frontend, biblioteca de componentes, TypeScript, Tailwind ou Bootstrap.
- Navegação SPA por History API, com rotas declaradas num módulo local e sem biblioteca de routing.
- A configuração inicial do projeto permanece sem servidor e sem base de dados.
- Os componentes de formulário podem validar campos localmente, mas não enviam dados, não os gravam e não apresentam sucesso fictício. A interface explicita que a funcionalidade depende de integração.
- Um módulo isolado de dados vazios serve de limite de integração futura. Não define URLs, contratos, modelos de utilizador ou serviços de API.
- Os estados reutilizáveis de carregamento e erro ficam disponíveis para a futura integração; nesta versão sem fonte de dados, as listas mostram os estados vazios neutros.

## Estrutura proposta

```text
public/
  favicon.svg             # Marca simples da aplicação
src/
  main.jsx                # Entrada React
  App.jsx                 # Shell e composição das páginas
  router.js               # History API, rotas e navegação
  data/emptyData.js        # Coleções vazias, sem contrato nem endpoints
  components/
    AppShell.jsx           # Estrutura pública
    Header.jsx              # Navegação pública e menu móvel
    PortalLayout.jsx        # Navegação contextual do estudante/mentor/admin
    PageHeader.jsx          # Títulos, contexto e ações
    EmptyState.jsx          # Ausência de dados
    FeedbackState.jsx       # Carregamento e erro preparados
    FormField.jsx           # Campos acessíveis e mensagens
    DataTable.jsx           # Tabelas vazias para gestão
    Notice.jsx              # Avisos de integração e indisponibilidade
  pages/
    HomePage.jsx
    ScholarshipsPage.jsx
    ScholarshipDetailPage.jsx
    MentorsPage.jsx
    MentorDetailPage.jsx
    LoginPage.jsx
    RegisterPage.jsx
    RecoveryPage.jsx
    StudentAreaPage.jsx
    MentorAreaPage.jsx
    BookingPage.jsx
    CheckoutPage.jsx
    AdminPage.jsx
  styles/
    tokens.css              # Paleta, tipografia, espaçamento e sombras
    global.css              # Base, acessibilidade e estados
    layout.css              # Navegação, grelhas e breakpoints
    components.css          # Cartões, campos, tabelas e avisos
index.html
package.json
vite.config.js
```

## Navegação e páginas

Rotas públicas para início, bolsas, detalhe de bolsa, mentores, perfil de mentor e interfaces distintas de login, registo e recuperação de palavra-passe. Rotas da área estudante para perfil, bolsas guardadas, candidaturas, documentos e mentorias. Rotas da área mentor para perfil profissional, serviços, calendário, reservas e rendimentos. Uma rota de agendamento contempla seleção de serviço/horário apenas quando opções reais estiverem disponíveis; o checkout é uma apresentação preparada para integração, sem recolha ou processamento de pagamento. A administração separa gestão de bolsas, utilizadores, mentores e reservas. Todos os módulos têm navegação acessível e estados vazios honestos; detalhes de entidades sem dados apresentam uma ausência neutra, sem inventar identificadores ou registos.

## Design aprovado e linguagem visual

- **Movimento:** minimalismo editorial institucional, traduzido numa interface de serviço clara e contemporânea.
- **Princípios:** hierarquia evidente; consistência entre cartões e formulários; acessibilidade e legibilidade; ausência de ruído ou conteúdo ornamental que sugira dados inexistentes.
- **Filosofia de cor:** azul-escuro transmite confiança e orientação; azul principal destaca ações e navegação ativa; branco mantém o conteúdo aberto; cinza-claro delimita áreas e separa níveis sem competir com a informação. A cor nunca será o único indicador de estado.
- **Paleta:** azul-escuro aproximado `#10213D`, azul principal/assinatura `#315FEA`, branco `#FFFFFF`, fundo cinza-claro `#F4F6FA`, texto secundário `#667085`, bordas `#E3E8F0`. Contraste será verificado visualmente e reforçado nos estados.
- **Paradigma de layout:** cabeçalho público compacto e conteúdo alinhado à esquerda; nas áreas de portal, navegação lateral em ecrãs largos e navegação adaptada em ecrãs pequenos, com o conteúdo principal em coluna de leitura. Em vez de um dashboard centrado em mosaicos de estatísticas, usar secções de trabalho e listas vazias.
- **Elementos distintivos:** marcador azul estreito para a secção ativa; cartões de borda fina com raio discreto; pequenos traços/linhas de percurso como motivo da marca, sem ilustrações genéricas ou imagens de pessoas inventadas.
- **Interação:** navegação previsível, foco visível, alvos de toque generosos, filtros claros e mensagens que descrevem o que falta. Nenhuma ação aparentará sucesso remoto ou persistência.
- **Animação:** transições breves e discretas em menu, foco e hover; sem movimento automático ou efeito que faça estados vazios parecerem conteúdo a carregar. Respeitar `prefers-reduced-motion`.
- **Tipografia:** títulos em Inter (fallback para `system-ui`), corpo em `system-ui`/sans-serif; escala curta e consistente, com pesos médios para navegação e sem corpo excessivamente pequeno. Sem dependência de fontes externas.
- **Essência de marca:** Bolsaria ajuda estudantes e mentores a encontrar o próximo passo através de informação clara e percursos organizados. Personalidade: clara, fiável, acolhedora.
- **Voz:** títulos concretos, microcopy honesta e sem promessas de serviço inexistente. Exemplos: “Explore oportunidades quando estiverem disponíveis.” e “Esta área ficará pronta quando os seus dados estiverem ligados.”
- **Marca/logótipo:** wordmark “Bolsaria” acompanhado por um símbolo geométrico de página aberta com um percurso ascendente, em azul-escuro e azul principal; o símbolo será desenhado em SVG simples, sem recorrer a um pacote de ícones.
- **Cor de marca:** azul `#315FEA` como cor de ação reconhecível, reservado a controlos primários, foco e navegação ativa.

## Build e entrega

1. Configurar diagnósticos de JavaScript, CSS, HTML e JSON antes da primeira edição de código.
2. Adicionar o manifesto de rotas e a estrutura React/Vite, fixando a versão do gestor de pacotes e definindo explicitamente a política de scripts exigida pelo gestor escolhido.
3. Implementar os componentes comuns e as páginas por módulos, mantendo cada fluxo sem dados fictícios e sem operações de servidor.
4. Iniciar o servidor de desenvolvimento na porta de Preview já configurada (3000), verificar resposta HTTP, manifesto JSON, compilação e navegação/estados através de inspeção de código e verificações disponíveis.
5. Não publicar nem ativar servidor/base de dados; conservar as definições atuais de publicação automática (desativada).