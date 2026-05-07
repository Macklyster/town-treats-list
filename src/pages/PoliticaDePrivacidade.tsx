import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

const PoliticaDePrivacidade = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-4xl py-12">
        <h1 className="mb-6 text-4xl font-bold">Política de Privacidade</h1>
        <div className="prose prose-neutral max-w-none space-y-4 text-foreground">
          <p>
            A sua privacidade é importante para o HelpfyOfertas. Esta política descreve como
            coletamos, utilizamos e protegemos seus dados pessoais.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">1. Dados Coletados</h2>
          <p>
            Coletamos informações fornecidas voluntariamente no cadastro (nome, e-mail, telefone,
            cidade) e dados de navegação (cookies, endereço IP, páginas visitadas) para melhorar a
            experiência de uso.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">2. Uso das Informações</h2>
          <p>
            Os dados são utilizados para:
          </p>
          <ul className="list-disc pl-6">
            <li>Permitir o acesso à plataforma e suas funcionalidades;</li>
            <li>Personalizar ofertas e recomendações;</li>
            <li>Enviar comunicações sobre ofertas, novidades e atualizações;</li>
            <li>Cumprir obrigações legais.</li>
          </ul>

          <h2 className="mt-8 text-2xl font-semibold">3. Compartilhamento</h2>
          <p>
            Não vendemos dados pessoais. Compartilhamos informações apenas com lojistas parceiros
            quando o usuário interage com uma oferta, ou quando exigido por lei.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">4. Cookies</h2>
          <p>
            Utilizamos cookies para análise de tráfego e personalização. Você pode desativá-los nas
            configurações do seu navegador, mas algumas funcionalidades podem ser afetadas.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">5. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra
            acesso não autorizado, perda ou alteração.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">6. Seus Direitos (LGPD)</h2>
          <p>
            Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode solicitar acesso,
            correção, exclusão ou portabilidade dos seus dados a qualquer momento.
          </p>

          <h2 className="mt-8 text-2xl font-semibold">7. Contato</h2>
          <p>
            Para exercer seus direitos ou tirar dúvidas, escreva para{" "}
            <a href="mailto:contato@helpfyofertas.com.br" className="text-accent-strong underline">
              contato@helpfyofertas.com.br
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

export default PoliticaDePrivacidade;
