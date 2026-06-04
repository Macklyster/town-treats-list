Adicionar um banner de upgrade (Plus/Destaque) na tela Histórico, posicionado entre o gráfico de atividade diária (30d) e a linha do tempo. O banner destaca os benefícios exclusivos da tela Inteligência para incentivar upgrade.

**Mudanças técnicas:**
- Editar `src/pages/Historico.tsx`:
  - Inserir import de ícones adicionais do Lucide (Sparkles, TrendingUp, Target, Clock, ArrowRight, Lock).
  - Adicionar um `<Card>` estilizado (gradiente sutil, borda primary/20) com:
    - Título "Quer insights mais profundos?" com badge Plus/Destaque.
    - Lista de 4 benefícios com ícones:
      1. Heatmap de horário de pico (Clock)
      2. Ranking de ofertas que mais convertem (TrendingUp)
      3. Benchmark com concorrentes da mesma categoria (Target)
      4. Comparativo de percentil e média da cidade (Sparkles)
    - Botão CTA "Ver Inteligência da Loja" com ícone ArrowRight, rota `/painel-lojista/inteligencia`.
    - Observação de que é exclusivo dos planos Destaque e Plus (Lock).
  - Posicionar o banner entre o `</Card>` do gráfico de atividade diária e o `<Card>` da linha do tempo.