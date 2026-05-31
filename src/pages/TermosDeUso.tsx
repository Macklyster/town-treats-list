import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

const TermosDeUso = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl py-12">
        <h1 className="mb-6 text-4xl font-bold">Termos de Uso</h1>
        <div className="prose prose-neutral max-w-none space-y-4 text-foreground">
          <p>
            Bem-vindo ao OfertasFly. Ao acessar e utilizar nossa plataforma, você concorda com os
            termos e condições descritos abaixo. Leia com atenção antes de continuar.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">1. Aceitação dos Termos</h2>
          <p>
            O uso do site OfertasFly implica na aceitação integral destes Termos de Uso. Caso não
            concorde com alguma das condições, recomendamos que não utilize a plataforma.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">2. Cadastro</h2>
          <p>
            Para acessar determinadas funcionalidades, é necessário criar uma conta fornecendo
            informações verdadeiras e atualizadas. O usuário é responsável pela confidencialidade
            das suas credenciais.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">3. Ofertas e Lojistas</h2>
          <p>
            O OfertasFly atua como hub de divulgação de ofertas locais. As condições, valores e
            disponibilidade dos produtos/serviços são de responsabilidade exclusiva do lojista
            anunciante.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">4. Conduta do Usuário</h2>
          <p>
            É vedado utilizar a plataforma para fins ilícitos, divulgar conteúdo ofensivo,
            fraudulento ou que viole direitos de terceiros.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">5. Limitação de Responsabilidade</h2>
          <p>
            O OfertasFly não se responsabiliza por danos decorrentes de transações realizadas
            entre consumidores e lojistas, devendo as partes resolverem eventuais conflitos entre si.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">6. Publicação e Agendamento de Ofertas</h2>
          <p>
            Toda oferta enviada pelo lojista passa por análise prévia da equipe OfertasFly antes de ficar
            visível ao público. Nossa meta de SLA de aprovação é de até <strong>24 horas</strong> após o
            envio — esse prazo é um objetivo operacional e não constitui garantia contratual; pode ser
            ajustado pela administração e está disponível no painel do lojista.
          </p>
          <p>
            Lojistas dos planos <strong>Destaque</strong> e <strong>Plus</strong> podem agendar a
            publicação de ofertas dentro de uma janela definida pela OfertasFly (atualmente, mínimo de
            12 horas e máximo de 30 dias de antecedência). Ofertas agendadas, mesmo já aprovadas, só
            ficam públicas a partir do horário marcado. A OfertasFly se reserva o direito de recusar,
            atrasar ou remover ofertas que estejam fora dessas janelas, violem estes Termos ou cuja
            análise não seja viável em tempo hábil.
          </p>
          <p>
            Para todas as demais ofertas, exigimos uma validade mínima (atualmente <strong>6 horas</strong>
            a partir do envio) para que a aprovação faça sentido e o consumidor tenha tempo de
            aproveitar.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">6. Alterações</h2>
          <p>
            Reservamo-nos o direito de modificar estes Termos a qualquer momento. As alterações
            entrarão em vigor a partir da sua publicação no site.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">7. Contato</h2>
          <p>
            Em caso de dúvidas, entre em contato pelo e-mail{" "}
            <a href="mailto:contato@ofertasfly.com.br" className="text-accent-strong underline">
              contato@ofertasfly.com.br
            </a>
            .
          </p>

          <p className="mt-8 text-sm text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermosDeUso;
